/**
 * ONNX OCR provider using the portable Gutenye PaddleOCR engine with a
 * package-owned Sharp and ONNX Runtime backend.
 */

import type {
  DependencyCheckResult,
  OCRCapabilities,
  OCRImage,
  OCROptions,
  OCRProvider,
  OCRResult,
} from '../shared/types';
import { OCRDependencyError } from '../shared/types';
import {
  createGutenyeOCR,
  type GutenyeDetection,
  type GutenyeImageInput,
  type GutenyeOCR,
  nativeDependencyVersions,
} from './gutenye-runtime';

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
      const initialization = createGutenyeOCR()
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
    return {
      available: Boolean(
        nativeDependencyVersions.sharp && nativeDependencyVersions.onnxRuntime,
      ),
      details: {
        sharp: Boolean(nativeDependencyVersions.sharp),
        'onnxruntime-node': Boolean(nativeDependencyVersions.onnxRuntime),
        'gutenye-ocr-common': true,
      },
      version: `Sharp ${nativeDependencyVersions.sharp}, ONNX Runtime ${nativeDependencyVersions.onnxRuntime}`,
    };
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
    if (!(image.data instanceof Buffer) || image.data.length === 0) {
      return null;
    }

    if (
      image.width &&
      image.height &&
      (image.channels === 3 || image.channels === 4) &&
      image.data.byteLength === image.width * image.height * image.channels
    ) {
      return {
        data: image.data,
        width: image.width,
        height: image.height,
        channels: image.channels,
      };
    }

    return image.data;
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
