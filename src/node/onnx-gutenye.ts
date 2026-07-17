/**
 * ONNX OCR provider using the portable Gutenye PaddleOCR engine with a
 * package-owned Sharp and ONNX Runtime backend.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type {
  DependencyCheckResult,
  OCRCapabilities,
  OCRImage,
  OCROptions,
  OCRProvider,
  OCRResult,
} from '../shared/types';
import { OCRDependencyError } from '../shared/types';
import type {
  GutenyeDetection,
  GutenyeImageInput,
  GutenyeOCR,
} from './gutenye-runtime';

type NativeRuntime = typeof import('./gutenye-runtime');

const execFileAsync = promisify(execFile);
const nativeDependencyNames = ['sharp', 'onnxruntime-node'] as const;

let nativeRuntimePromise: Promise<NativeRuntime> | null = null;
let nativeDependencyCheckPromise: Promise<DependencyCheckResult> | null = null;

function loadNativeRuntime(): Promise<NativeRuntime> {
  if (!nativeRuntimePromise) {
    nativeRuntimePromise = import('./gutenye-runtime.js');
  }
  return nativeRuntimePromise;
}

async function checkNativeDependencies(): Promise<DependencyCheckResult> {
  const details: Record<string, boolean> = {
    sharp: false,
    'onnxruntime-node': false,
    'gutenye-ocr-common': true,
  };
  const resolvedDependencies: Array<[string, string]> = [];

  for (const name of nativeDependencyNames) {
    try {
      resolvedDependencies.push([name, import.meta.resolve(name)]);
    } catch {
      details[name] = false;
    }
  }

  if (resolvedDependencies.length !== nativeDependencyNames.length) {
    return {
      available: false,
      details,
      error: 'Native PaddleOCR dependencies are not installed',
    };
  }

  const validationScript = `
    const dependencies = JSON.parse(process.argv[1]);
    const results = {};
    for (const [name, url] of dependencies) {
      try {
        const loaded = await import(url);
        const version = name === 'sharp'
          ? loaded.default?.versions?.sharp
          : loaded.env?.versions?.node;
        results[name] = { available: true, version };
      } catch {
        results[name] = { available: false };
      }
    }
    process.stdout.write(JSON.stringify(results));
  `;

  const versions: Record<string, string | undefined> = {};
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        validationScript,
        JSON.stringify(resolvedDependencies),
      ],
      { timeout: 30_000, windowsHide: true },
    );
    const results = JSON.parse(stdout) as Record<
      string,
      { available: boolean; version?: string }
    >;
    for (const name of nativeDependencyNames) {
      details[name] = results[name]?.available ?? false;
      versions[name] = results[name]?.version;
    }
  } catch {
    return {
      available: false,
      details,
      error: 'Native PaddleOCR dependencies failed to load',
    };
  }

  const available = nativeDependencyNames.every((name) => details[name]);
  return {
    available,
    details,
    error: available
      ? undefined
      : 'Native PaddleOCR dependencies failed to load',
    version: available
      ? `Sharp ${versions.sharp}, ONNX Runtime ${versions['onnxruntime-node']}`
      : undefined,
  };
}

/** ONNX PaddleOCR provider backed by Sharp and ONNX Runtime on Node.js. */
export class ONNXGutenyeProvider implements OCRProvider {
  readonly name = 'onnx';
  private ocrInstance: GutenyeOCR | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private activeOperations = new Set<Promise<OCRResult>>();
  private cleanupPromise: Promise<void> | null = null;
  private cleanupError: unknown = null;

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!this.initializationPromise) {
      const initialization = loadNativeRuntime()
        .then(({ createGutenyeOCR }) => createGutenyeOCR())
        .then((ocr) => {
          this.ocrInstance = ocr;
          this.initialized = true;
        })
        .catch((error) => {
          throw new OCRDependencyError(
            this.name,
            `Failed to initialize native PaddleOCR: ${(error as Error).message}`,
          );
        });
      const trackedInitialization = initialization.finally(() => {
        if (this.initializationPromise === trackedInitialization) {
          this.initializationPromise = null;
        }
      });
      this.initializationPromise = trackedInitialization;
    }

    await this.initializationPromise;
  }

  performOCR(images: OCRImage[], options?: OCROptions): Promise<OCRResult> {
    const operation = this.performOCRWhenAvailable(images, options);
    this.activeOperations.add(operation);
    void operation.then(
      () => this.activeOperations.delete(operation),
      () => this.activeOperations.delete(operation),
    );
    return operation;
  }

  private async performOCRWhenAvailable(
    images: OCRImage[],
    options?: OCROptions,
  ): Promise<OCRResult> {
    await this.cleanupPromise;
    if (this.cleanupError) {
      throw new OCRDependencyError(
        this.name,
        'Native PaddleOCR cleanup must succeed before the provider can be reused',
        this.cleanupError,
      );
    }

    if (!images || images.length === 0) {
      return {
        text: '',
        confidence: 0,
        detections: [],
        metadata: {
          processingTime: 0,
          provider: this.name,
        },
      };
    }

    await this.initialize();
    const ocr = this.ocrInstance;
    if (!ocr) {
      throw new OCRDependencyError(
        this.name,
        'Native PaddleOCR initialized without an OCR instance',
      );
    }

    const startTime = Date.now();
    const allDetections: Array<{
      text: string;
      confidence: number;
      boundingBox?: { x: number; y: number; width: number; height: number };
    }> = [];
    const textParts: string[] = [];

    for (const image of images) {
      const input = this.toNativeInput(image);
      if (!input) {
        console.warn(
          'Unsupported image data: expected an encoded Buffer or valid RGB/RGBA pixels',
        );
        continue;
      }

      try {
        const detections = await ocr.detect(input, {
          language: options?.language || 'eng',
        });
        this.collectDetections(detections, textParts, allDetections);
      } catch (error) {
        console.warn(
          'Native PaddleOCR failed for image:',
          (error as Error).message || error,
        );
      }
    }

    const validDetections = allDetections.filter(
      (detection) => detection.confidence > 0,
    );
    const confidence =
      validDetections.length > 0
        ? validDetections.reduce(
            (sum, detection) => sum + detection.confidence,
            0,
          ) / validDetections.length
        : 0;
    const confidenceThreshold = options?.confidenceThreshold;
    const detections = confidenceThreshold
      ? allDetections.filter(
          (detection) => detection.confidence >= confidenceThreshold,
        )
      : allDetections;

    return {
      text: textParts.join(' ').trim(),
      confidence,
      detections,
      metadata: {
        processingTime: Date.now() - startTime,
        provider: this.name,
        detectionCount: allDetections.length,
        language: options?.language,
      },
    };
  }

  async checkDependencies(): Promise<DependencyCheckResult> {
    if (!nativeDependencyCheckPromise) {
      nativeDependencyCheckPromise = checkNativeDependencies();
    }
    const result = await nativeDependencyCheckPromise;
    return { ...result, details: { ...result.details } };
  }

  async checkCapabilities(): Promise<OCRCapabilities> {
    return {
      canPerformOCR: true,
      supportedLanguages: this.getSupportedLanguages(),
      maxImageSize: 4096 * 4096,
      hasBoundingBoxes: true,
    };
  }

  getSupportedLanguages(): string[] {
    return ['eng', 'chi_sim', 'chi_tra', 'fra', 'deu', 'jpn', 'kor'];
  }

  cleanup(): Promise<void> {
    if (this.cleanupPromise) return this.cleanupPromise;

    const cleanup = this.cleanupNativeResources();
    const trackedCleanup = cleanup.finally(() => {
      if (this.cleanupPromise === trackedCleanup) {
        this.cleanupPromise = null;
      }
    });
    this.cleanupPromise = trackedCleanup;
    return trackedCleanup;
  }

  private async cleanupNativeResources(): Promise<void> {
    await Promise.allSettled([...this.activeOperations]);

    try {
      await this.initializationPromise;
      await this.ocrInstance?.cleanup?.();
    } catch (error) {
      this.cleanupError = error;
      throw error;
    }

    this.ocrInstance = null;
    this.initialized = false;
    this.initializationPromise = null;
    this.cleanupError = null;
  }

  private toNativeInput(image: OCRImage): GutenyeImageInput | null {
    const data =
      image.data instanceof Buffer
        ? image.data
        : image.data instanceof Uint8Array
          ? Buffer.from(
              image.data.buffer,
              image.data.byteOffset,
              image.data.byteLength,
            )
          : null;
    if (!data || data.length === 0) {
      return null;
    }

    if (
      image.width &&
      image.height &&
      (image.channels === 3 || image.channels === 4) &&
      data.byteLength === image.width * image.height * image.channels
    ) {
      return {
        data,
        width: image.width,
        height: image.height,
        channels: image.channels,
      };
    }

    return data;
  }

  private collectDetections(
    detections: GutenyeDetection[] | undefined,
    textParts: string[],
    output: Array<{
      text: string;
      confidence: number;
      boundingBox?: { x: number; y: number; width: number; height: number };
    }>,
  ): void {
    if (!Array.isArray(detections)) return;

    for (const detection of detections) {
      if (!detection.text) continue;

      textParts.push(detection.text);
      output.push({
        text: detection.text,
        confidence: (detection.score ?? detection.mean ?? 0) * 100,
        boundingBox: detection.frame
          ? {
              x: detection.frame.left,
              y: detection.frame.top,
              width: detection.frame.width,
              height: detection.frame.height,
            }
          : boxToBoundingBox(detection.box),
      });
    }
  }
}

function boxToBoundingBox(
  box: number[][] | undefined,
): { x: number; y: number; width: number; height: number } | undefined {
  if (!box || box.length < 3) return undefined;
  return {
    x: box[0][0],
    y: box[0][1],
    width: box[1][0] - box[0][0],
    height: box[2][1] - box[0][1],
  };
}
