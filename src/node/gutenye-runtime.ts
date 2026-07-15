/**
 * Node backend for the portable Gutenye PaddleOCR engine.
 *
 * `@gutenye/ocr-node` hard-codes an out-of-range Sharp dependency, so this
 * package owns the small Node adapter and declares its native dependencies
 * directly. Model files remain supplied by `@gutenye/ocr-models`.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import GutenyeOcr, {
  FileUtilsBase,
  ImageRawBase,
  type ImageRawData,
  type LineImage,
  type ModelCreateOptions,
  registerBackend,
  type SizeOption,
} from '@gutenye/ocr-common';
import { splitIntoLineImages } from '@gutenye/ocr-common/splitIntoLineImages';
import { env, InferenceSession } from 'onnxruntime-node';
import sharp from 'sharp';

type SharpPipeline = ReturnType<typeof sharp>;
type SharpFormat = Parameters<SharpPipeline['toFormat']>[0];

const modelsDirectory = dirname(
  fileURLToPath(import.meta.resolve('@gutenye/ocr-models/node')),
);
const defaultModels = {
  detectionPath: join(modelsDirectory, 'assets/ch_PP-OCRv4_det_infer.onnx'),
  recognitionPath: join(modelsDirectory, 'assets/ch_PP-OCRv4_rec_infer.onnx'),
  dictionaryPath: join(modelsDirectory, 'assets/ppocr_keys_v1.txt'),
};
const sessionContext = new AsyncLocalStorage<Set<InferenceSession>>();
const TrackedInferenceSession = {
  async create(...args: unknown[]): Promise<InferenceSession> {
    const session = (await Reflect.apply(
      InferenceSession.create,
      InferenceSession,
      args,
    )) as InferenceSession;
    sessionContext.getStore()?.add(session);
    return session;
  },
} as unknown as typeof InferenceSession;

/** Raw RGB or RGBA pixels accepted by the native backend. */
export interface GutenyeRawImageInput {
  data: Buffer;
  width: number;
  height: number;
  channels: 3 | 4;
}

/** Encoded file data, a file path, or raw pixels accepted by native OCR. */
export type GutenyeImageInput = string | Buffer | GutenyeRawImageInput;

/** Native OCR surface used by the provider. */
export interface GutenyeDetection {
  text?: string;
  mean?: number;
  score?: number;
  box?: number[][];
  frame?: { left: number; top: number; width: number; height: number };
}

/** Native OCR surface used by the provider. */
export interface GutenyeOCR {
  detect(
    image: GutenyeImageInput,
    options?: { language?: string },
  ): Promise<GutenyeDetection[]>;
  cleanup?(): Promise<void> | void;
}

class NodeFileUtils extends FileUtilsBase {
  static override async read(path: string): Promise<string> {
    return readFile(path, 'utf8');
  }
}

/** Sharp-backed image implementation required by the Gutenye engine. */
export class SharpImageRaw extends ImageRawBase {
  private pipeline: SharpPipeline;

  static async open(input: GutenyeImageInput): Promise<SharpImageRaw> {
    const pipeline = isRawImageInput(input)
      ? sharp(input.data, {
          raw: {
            width: input.width,
            height: input.height,
            channels: input.channels,
          },
        })
      : sharp(input);

    return new SharpImageRaw(await toImageRaw(pipeline));
  }

  constructor(image: ImageRawData) {
    super(image);
    this.pipeline = toSharp(image);
  }

  async write(path: string): Promise<void> {
    const extension = extname(path).slice(1).toLowerCase();
    const format = normalizeFormat(extension);
    await this.pipeline.toFormat(format).toFile(path);
  }

  async resize(size: SizeOption): Promise<this> {
    return this.apply(
      this.pipeline.resize({
        width: size.width,
        height: size.height,
        fit: size.fit ?? 'contain',
      }),
    );
  }

  async drawBox(lineImages: LineImage[]): Promise<this> {
    const polygons = lineImages
      .map(({ box }) => {
        const [p1, p2, p3, p4] = box;
        return `<polygon points="${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]}" fill="none" stroke="red" />`;
      })
      .join('\n');
    const svg = `<svg width="${this.width}" height="${this.height}">${polygons}</svg>`;

    return this.apply(
      this.pipeline.composite([{ input: Buffer.from(svg), left: 0, top: 0 }]),
    );
  }

  private async apply(pipeline: SharpPipeline): Promise<this> {
    const image = await toImageRaw(pipeline);
    this.data = image.data;
    this.width = image.width;
    this.height = image.height;
    this.pipeline = toSharp(image);
    return this;
  }
}

registerBackend({
  // biome-ignore lint/style/useNamingConvention: required external backend key
  FileUtils: NodeFileUtils,
  // biome-ignore lint/style/useNamingConvention: required external backend key
  ImageRaw: SharpImageRaw,
  // biome-ignore lint/style/useNamingConvention: required external backend key
  InferenceSession: TrackedInferenceSession,
  splitIntoLineImages,
  defaultModels,
});

/** Versions exposed for native-path and dependency validation. */
export const nativeDependencyVersions = Object.freeze({
  sharp: sharp.versions.sharp,
  onnxRuntime: env.versions.node,
});

/** Create a PaddleOCR instance backed by this package's native dependencies. */
export async function createGutenyeOCR(
  options: ModelCreateOptions = {},
): Promise<GutenyeOCR> {
  if (options.debugOutputDir) {
    await mkdir(options.debugOutputDir, { recursive: true });
  }

  const sessions = new Set<InferenceSession>();

  try {
    const ocr = await sessionContext.run(sessions, () =>
      GutenyeOcr.create(options),
    );
    let cleanupPromise: Promise<void> | null = null;

    return {
      // Gutenye's portable declaration accepts paths, while the registered
      // Node backend intentionally widens that input to buffers and raw pixels.
      detect: (image, detectOptions) =>
        ocr.detect(image as string, detectOptions) as Promise<
          GutenyeDetection[]
        >,
      cleanup: () => {
        if (cleanupPromise) return cleanupPromise;

        const cleanup = releaseSessions(sessions);
        const trackedCleanup = cleanup.finally(() => {
          if (cleanupPromise === trackedCleanup) cleanupPromise = null;
        });
        cleanupPromise = trackedCleanup;
        return trackedCleanup;
      },
    };
  } catch (error) {
    await releaseSessions(sessions).catch(() => undefined);
    throw error;
  }
}

async function releaseSessions(sessions: Set<InferenceSession>): Promise<void> {
  const activeSessions = [...sessions];
  const results = await Promise.allSettled(
    activeSessions.map((session) => session.release()),
  );
  const failures: unknown[] = [];

  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      sessions.delete(activeSessions[index]);
    } else {
      failures.push(result.reason);
    }
  }

  if (failures.length > 0) {
    throw new AggregateError(
      failures,
      'Failed to release ONNX Runtime sessions',
    );
  }
}

function isRawImageInput(
  input: GutenyeImageInput,
): input is GutenyeRawImageInput {
  return (
    typeof input === 'object' &&
    !Buffer.isBuffer(input) &&
    Buffer.isBuffer(input.data)
  );
}

async function toImageRaw(pipeline: SharpPipeline): Promise<ImageRawData> {
  const result = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    data: result.data,
    width: result.info.width,
    height: result.info.height,
  };
}

function toSharp(image: ImageRawData): SharpPipeline {
  return sharp(Buffer.from(image.data), {
    raw: {
      width: image.width,
      height: image.height,
      channels: 4,
    },
  });
}

function normalizeFormat(extension: string): SharpFormat {
  if (extension === 'jpg') return 'jpeg';
  if (extension === 'tif') return 'tiff';
  return extension as SharpFormat;
}
