/**
 * @happyvertical/ocr - PaddleOCR-VL provider for a served layout-parsing pipeline
 *
 * Sends each image page to a PaddleOCR-VL `/layout-parsing` service (the full
 * pipeline: layout detection plus the VL recognizer), the same service
 * `@happyvertical/pdf` reads PDFs through. It is never part of `auto`
 * selection: images leave the process, so a caller must name it.
 */

import { existsSync, readFileSync } from 'node:fs';

import type {
  DependencyCheckResult,
  OCRCapabilities,
  OCRImage,
  OCROptions,
  OCRProvider,
  OCRResult,
} from '../shared/types';
import { OCRProcessingError } from '../shared/types';

/**
 * Configuration for the PaddleOCR-VL provider. Each field falls back to
 * `HAVE_OCR_PADDLEOCR_*`, then to the `HAVE_PDF_PADDLEOCR_*` setting
 * `@happyvertical/pdf` uses, so one service setting serves both packages.
 */
export interface PaddleOCRVLProviderConfig {
  /** Service root, e.g. `http://paddleocr-vl:8080` (the `/layout-parsing` path is appended). */
  baseUrl?: string;
  /** Optional bearer token for deployments behind an authenticating proxy. */
  apiKey?: string;
  /**
   * Deadline for each page request, including an on-demand cold start and the
   * response body. Default: 65 minutes.
   */
  timeout?: number;
}

const DEFAULT_TIMEOUT_MS = 65 * 60 * 1000;
const PASSTHROUGH = new Set(['image/png', 'image/jpeg']);

function env(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type Sharp = typeof import('sharp').default;

/**
 * Load sharp only when processing images, so provider discovery never loads
 * the native addon. PNG/JPEG decoding validates input without rewriting it. The specifier is kept opaque so
 * browser and SSR bundlers do not pull sharp into a consumer's graph (the same
 * pattern as the factory's `loadNodeOCRModule`).
 */
async function loadSharp(): Promise<Sharp> {
  const specifier = ['sh', 'arp'].join('');
  const mod = (await import(/* @vite-ignore */ specifier)) as {
    default?: Sharp;
  } & Sharp;
  return mod.default ?? mod;
}

/** Recognize an encoded image by its signature. */
function sniff(data: Uint8Array): string | null {
  const at = (i: number) => data[i];
  if (
    data.length >= 8 &&
    at(0) === 0x89 &&
    at(1) === 0x50 &&
    at(2) === 0x4e &&
    at(3) === 0x47
  ) {
    return 'image/png';
  }
  if (data.length >= 3 && at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff)
    return 'image/jpeg';
  if (
    data.length >= 4 &&
    ((at(0) === 0x49 && at(1) === 0x49 && at(2) === 0x2a && at(3) === 0x00) ||
      (at(0) === 0x4d && at(1) === 0x4d && at(2) === 0x00 && at(3) === 0x2a))
  ) {
    return 'image/tiff';
  }
  if (
    data.length >= 12 &&
    at(0) === 0x52 &&
    at(1) === 0x49 &&
    at(2) === 0x46 &&
    at(3) === 0x46 &&
    at(8) === 0x57 &&
    at(9) === 0x45 &&
    at(10) === 0x42 &&
    at(11) === 0x50
  ) {
    return 'image/webp';
  }
  if (
    data.length >= 4 &&
    at(0) === 0x47 &&
    at(1) === 0x49 &&
    at(2) === 0x46 &&
    at(3) === 0x38
  ) {
    return 'image/gif';
  }
  if (data.length >= 2 && at(0) === 0x42 && at(1) === 0x4d) return 'image/bmp';
  return null;
}

/**
 * OCR provider for a PaddleOCR-VL `/layout-parsing` service.
 *
 * Each image page is one request (`fileType: 1`); results are joined in
 * order. PNG and JPEG are sent unchanged; TIFF (every page), WebP, GIF, BMP
 * and raw pixel buffers are converted to PNG first (`bmp-ts` decodes BMP;
 * `sharp` encodes PNG). Requests are
 * not retried: a dropped connection can leave a GPU parse running.
 */
export class PaddleOCRVLProvider implements OCRProvider {
  readonly name = 'paddleocr-vl';

  private readonly baseUrl?: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

  constructor(config: PaddleOCRVLProviderConfig = {}) {
    this.baseUrl =
      config.baseUrl ?? env('HAVE_OCR_PADDLEOCR_URL', 'HAVE_PDF_PADDLEOCR_URL');
    this.apiKey =
      config.apiKey ??
      env('HAVE_OCR_PADDLEOCR_API_KEY', 'HAVE_PDF_PADDLEOCR_API_KEY');
    const timeout =
      config.timeout ??
      Number.parseInt(env('HAVE_OCR_PADDLEOCR_TIMEOUT') ?? '', 10);
    this.timeout =
      Number.isInteger(timeout) && timeout > 0 && timeout <= 2_147_483_647
        ? timeout
        : DEFAULT_TIMEOUT_MS;
  }

  /**
   * `options` carries nothing this service uses: it needs no language hint,
   * and `options.timeout` is ignored because the factory fills it from
   * `HAVE_OCR_TIMEOUT`, a limit sized for local engines that would cut off a
   * cold start. Use the provider's own `timeout`.
   */
  async performOCR(
    images: OCRImage[],
    _options?: OCROptions,
  ): Promise<OCRResult> {
    const started = Date.now();
    if (!images || images.length === 0) {
      return {
        text: '',
        confidence: 0,
        detections: [],
        metadata: { processingTime: 0, provider: this.name, pages: 0 },
      };
    }

    const endpoint = this.endpoint();
    const pages: Uint8Array[] = [];
    for (const image of images) {
      pages.push(...(await this.toPages(image)));
    }

    const texts: string[] = [];
    for (const page of pages) {
      texts.push(await this.parsePage(endpoint, page));
    }

    const text = texts.join('\n\n').trim();
    return {
      text,
      confidence: text ? 100 : 0,
      detections: texts
        .map((pageText) => pageText.trim())
        .map((pageText) => ({
          text: pageText,
          confidence: pageText ? 100 : 0,
        })),
      metadata: {
        processingTime: Date.now() - started,
        provider: this.name,
        pages: pages.length,
        outputMode: 'markdown',
      },
    };
  }

  /**
   * Configuration only. The service is not probed: a proxy `/health` success
   * does not mean the model is loaded.
   */
  async checkDependencies(): Promise<DependencyCheckResult> {
    if (!this.baseUrl) {
      return {
        available: false,
        error:
          'PaddleOCR-VL base URL is not configured. Set HAVE_OCR_PADDLEOCR_URL or HAVE_PDF_PADDLEOCR_URL.',
        details: { baseUrl: false },
      };
    }
    try {
      this.endpoint();
    } catch (error) {
      return {
        available: false,
        error: (error as Error).message,
        details: { baseUrl: false },
      };
    }
    return {
      available: true,
      details: {
        baseUrl: true,
        apiKey: Boolean(this.apiKey),
        timeout: this.timeout,
      },
    };
  }

  async checkCapabilities(): Promise<OCRCapabilities> {
    return {
      canPerformOCR: true,
      supportedLanguages: this.getSupportedLanguages(),
      supportedFormats: [
        'png',
        'jpg',
        'jpeg',
        'tiff',
        'tif',
        'webp',
        'gif',
        'bmp',
      ],
      hasConfidenceScores: false,
      hasBoundingBoxes: false,
      providerSpecific: {
        servedEndpoint: true,
        layoutParsing: true,
        outputMode: 'markdown',
      },
    };
  }

  /** PaddleOCR-VL recognizes 100+ languages and needs no language hint. */
  getSupportedLanguages(): string[] {
    return ['eng', 'fra', 'spa', 'deu', 'chi_sim', 'chi_tra', 'jpn', 'kor'];
  }

  async cleanup(): Promise<void> {
    // Stateless HTTP provider; nothing to dispose.
  }

  private endpoint(): URL {
    if (!this.baseUrl) {
      throw new OCRProcessingError(
        this.name,
        'PaddleOCR-VL base URL is not configured',
      );
    }
    let url: URL;
    try {
      url = new URL(this.baseUrl);
    } catch {
      url = new URL('invalid:');
    }
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new OCRProcessingError(
        this.name,
        'PaddleOCR-VL base URL must be an HTTP(S) service root without credentials, query or fragment',
      );
    }
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/layout-parsing`;
    return url;
  }

  /** Bytes of one input image, before any conversion. */
  private bytesOf(image: OCRImage): Uint8Array {
    const { data } = image;
    if (typeof data !== 'string') return data;
    if (data.startsWith('data:')) {
      return Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
    }
    if (/^https?:\/\//i.test(data)) {
      // Remote URLs are never fetched: the provider must not reach out on a
      // caller's behalf beyond the configured service.
      throw new OCRProcessingError(
        this.name,
        'Image URLs are not supported; pass bytes, base64 or a local path',
      );
    }
    try {
      if (existsSync(data)) return readFileSync(data);
    } catch {
      throw new OCRProcessingError(this.name, 'Image file could not be read');
    }
    return Buffer.from(data, 'base64');
  }

  /** One PNG or JPEG per page: multi-page TIFFs expand to every page. */
  private async toPages(image: OCRImage): Promise<Uint8Array[]> {
    const bytes = this.bytesOf(image);
    const { width, height, channels } = image;

    // Raw pixels are identified by their declared shape, not by sniffing:
    // a pixel buffer can start with bytes that look like a BMP or GIF header.
    const declaresRaw =
      typeof width === 'number' &&
      typeof height === 'number' &&
      typeof channels === 'number';
    const isRaw =
      declaresRaw &&
      [1, 2, 3, 4].includes(channels) &&
      bytes.byteLength === width * height * channels &&
      (image.bitsPerComponent === undefined || image.bitsPerComponent === 8);
    const type = isRaw ? null : sniff(bytes);
    if (!type && !isRaw) {
      throw new OCRProcessingError(
        this.name,
        declaresRaw
          ? 'Unsupported raw pixels: expected 8-bit samples, 1 to 4 channels, and width x height x channels bytes'
          : 'Unsupported image: expected PNG, JPEG, TIFF, WebP, GIF, BMP or raw pixels with dimensions',
      );
    }

    try {
      const sharp = await loadSharp();
      if (type && PASSTHROUGH.has(type)) {
        // Decode fully to reject corrupt/truncated input before transmission,
        // but preserve the original encoded bytes and metadata on the wire.
        await sharp(Buffer.from(bytes)).stats();
        return [bytes];
      }
      if (isRaw) {
        return [
          await sharp(Buffer.from(bytes), {
            raw: {
              width: width as number,
              height: height as number,
              channels: channels as 1 | 2 | 3 | 4,
            },
          })
            .png()
            .toBuffer(),
        ];
      }
      if (type === 'image/bmp') {
        const buffer = Buffer.from(bytes);
        // Validate dimensions before the BMP decoder allocates a pixel buffer.
        // Match sharp's default pixel limit; malformed/truncated headers fail
        // inside this same sanitized decoder-error boundary.
        const width = buffer.readInt32LE(18);
        const height = Math.abs(buffer.readInt32LE(22));
        const offset = buffer.readUInt32LE(10);
        const bitDepth = buffer.readUInt16LE(28);
        const compression = buffer.readUInt32LE(30);
        const stride = Math.ceil((width * bitDepth) / 32) * 4;
        if (
          width <= 0 ||
          height <= 0 ||
          width * height > 268_402_689 ||
          ![1, 4, 8, 16, 24, 32].includes(bitDepth) ||
          ![0, 1, 2, 3, 6].includes(compression) ||
          offset < 54 ||
          offset >= buffer.length ||
          ([0, 3, 6].includes(compression) &&
            offset + stride * height > buffer.length)
        )
          throw new Error('Invalid BMP dimensions or pixel data');
        const specifier = ['bmp', 'ts'].join('-');
        const { decode } = (await import(
          /* @vite-ignore */ specifier
        )) as typeof import('bmp-ts');
        const decoded = decode(buffer, { toRGBA: true });
        return [
          await sharp(decoded.data, {
            raw: { width: decoded.width, height: decoded.height, channels: 4 },
          })
            .png()
            .toBuffer(),
        ];
      }
      // Only TIFF pages are document pages. For animated GIF or WebP,
      // `pages` counts frames, so only the first frame is sent.
      const { pages = 1 } =
        type === 'image/tiff'
          ? await sharp(Buffer.from(bytes)).metadata()
          : { pages: 1 };
      const out: Uint8Array[] = [];
      for (let page = 0; page < pages; page++) {
        out.push(await sharp(Buffer.from(bytes), { page }).png().toBuffer());
      }
      return out;
    } catch {
      // Decoder messages can name file details; report a plain refusal.
      throw new OCRProcessingError(
        this.name,
        `Image could not be decoded (${type ?? 'raw pixels'})`,
      );
    }
  }

  private async parsePage(endpoint: URL, page: Uint8Array): Promise<string> {
    const timeout = this.timeout;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    timer.unref?.();
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        redirect: 'error',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          file: Buffer.from(
            page.buffer,
            page.byteOffset,
            page.byteLength,
          ).toString('base64'),
          fileType: 1,
          useLayoutDetection: true,
          visualize: false,
        }),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new OCRProcessingError(
          this.name,
          `PaddleOCR-VL request failed (${response.status})`,
          { status: response.status },
        );
      }
      return this.readMarkdown(await response.json().catch(() => undefined));
    } catch (error) {
      if (controller.signal.aborted) {
        throw new OCRProcessingError(
          this.name,
          `PaddleOCR-VL request timed out after ${timeout}ms`,
        );
      }
      if (error instanceof OCRProcessingError) throw error;
      // Network causes can carry URLs or payload fragments.
      throw new OCRProcessingError(this.name, 'PaddleOCR-VL request failed');
    } finally {
      clearTimeout(timer);
    }
  }

  /** Validate the service envelope and return the page's Markdown. */
  private readMarkdown(value: unknown): string {
    const invalid = () =>
      new OCRProcessingError(this.name, 'Invalid PaddleOCR-VL response');
    if (!record(value) || typeof value.errorCode !== 'number') throw invalid();
    if (value.errorCode !== 0) {
      // Never echo the service's message: it can contain document text.
      throw new OCRProcessingError(
        this.name,
        'PaddleOCR-VL reported a parsing failure',
      );
    }
    const result = value.result;
    if (
      !record(result) ||
      !Array.isArray(result.layoutParsingResults) ||
      result.layoutParsingResults.length !== 1
    ) {
      throw invalid();
    }
    return result.layoutParsingResults
      .map((page) => {
        if (
          !record(page) ||
          !record(page.markdown) ||
          typeof page.markdown.text !== 'string'
        ) {
          throw invalid();
        }
        return page.markdown.text;
      })
      .join('\n\n');
  }
}
