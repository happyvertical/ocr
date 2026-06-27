/**
 * @happyvertical/ocr - Unlimited-OCR provider for served GPU inference
 *
 * This provider talks to a running baidu/Unlimited-OCR SGLang server using its
 * OpenAI-compatible chat completions endpoint. The endpoint can be reached
 * directly, or through Bifrost when Bifrost is configured to route the model.
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
 * Transport used by the Unlimited-OCR provider.
 *
 * - `direct` sends requests to a served SGLang endpoint.
 * - `bifrost` sends requests through a Bifrost-compatible gateway.
 */
export type UnlimitedOCRTransport = 'direct' | 'bifrost';

/**
 * Image processing mode sent to Unlimited-OCR.
 *
 * `auto` uses `gundam` for single-image requests and `base` for multi-image
 * or multi-page requests.
 */
export type UnlimitedOCRImageMode = 'auto' | 'gundam' | 'base';

/**
 * Configuration for the served Unlimited-OCR provider.
 */
export interface UnlimitedOCRProviderConfig {
  /** Direct SGLang URL or Bifrost gateway URL. */
  baseUrl?: string;
  /** Optional API key. Required for HappyVertical Bifrost virtual-key auth. */
  apiKey?: string;
  /** Served model name. The upstream SGLang example uses `Unlimited-OCR`. */
  model?: string;
  /** Whether the endpoint is direct SGLang or Bifrost-routed. */
  transport?: UnlimitedOCRTransport;
  /** Image mode sent to Unlimited-OCR. `auto` uses `gundam` for one image and `base` for multi-page. */
  imageMode?: UnlimitedOCRImageMode;
  /** Prompt for a single image. */
  prompt?: string;
  /** Prompt for multiple images/pages. */
  multiPagePrompt?: string;
  /** Whether to use SGLang streaming responses. */
  stream?: boolean;
  /** Request timeout in milliseconds. */
  timeout?: number;
  /** No-repeat ngram size for Unlimited-OCR custom params. */
  ngramSize?: number;
  /** Override no-repeat ngram window for all requests. */
  ngramWindow?: number;
  /** Window used for one-image `gundam` mode when ngramWindow is not set. */
  singleImageNgramWindow?: number;
  /** Window used for multi-image `base` mode when ngramWindow is not set. */
  multiImageNgramWindow?: number;
  /**
   * SGLang custom logit processor string.
   *
   * The upstream Python example uses:
   * `DeepseekOCRNoRepeatNGramLogitProcessor.to_str()`
   */
  customLogitProcessor?: string;
  /** Extra request body fields merged into the chat completions payload last. */
  extraRequestBody?: Record<string, unknown>;
}

interface ResolvedUnlimitedOCRConfig {
  baseUrl?: string;
  apiKey?: string;
  model: string;
  transport: UnlimitedOCRTransport;
  imageMode: UnlimitedOCRImageMode;
  prompt: string;
  multiPagePrompt: string;
  stream: boolean;
  timeout: number;
  ngramSize: number;
  ngramWindow?: number;
  singleImageNgramWindow: number;
  multiImageNgramWindow: number;
  customLogitProcessor?: string;
  extraRequestBody: Record<string, unknown>;
}

interface TextContentPart {
  type: 'text';
  text: string;
}

interface ImageContentPart {
  type: 'image_url';
  // biome-ignore lint/style/useNamingConvention: OpenAI API format
  image_url: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
}

type ContentPart = TextContentPart | ImageContentPart;

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  model?: string;
  usage?: Record<string, unknown>;
}

const ENV_VARS = {
  transport: 'HAVE_OCR_UNLIMITED_TRANSPORT',
  baseUrl: 'HAVE_OCR_UNLIMITED_BASE_URL',
  apiKey: 'HAVE_OCR_UNLIMITED_API_KEY',
  model: 'HAVE_OCR_UNLIMITED_MODEL',
  imageMode: 'HAVE_OCR_UNLIMITED_IMAGE_MODE',
  prompt: 'HAVE_OCR_UNLIMITED_PROMPT',
  multiPagePrompt: 'HAVE_OCR_UNLIMITED_MULTI_PAGE_PROMPT',
  stream: 'HAVE_OCR_UNLIMITED_STREAM',
  timeout: 'HAVE_OCR_UNLIMITED_TIMEOUT',
  ngramSize: 'HAVE_OCR_UNLIMITED_NGRAM_SIZE',
  ngramWindow: 'HAVE_OCR_UNLIMITED_NGRAM_WINDOW',
  singleImageNgramWindow: 'HAVE_OCR_UNLIMITED_SINGLE_IMAGE_NGRAM_WINDOW',
  multiImageNgramWindow: 'HAVE_OCR_UNLIMITED_MULTI_IMAGE_NGRAM_WINDOW',
  customLogitProcessor: 'HAVE_OCR_UNLIMITED_CUSTOM_LOGIT_PROCESSOR',
  bifrostBaseUrl: 'HAVE_OCR_BIFROST_BASE_URL',
  bifrostApiKey: 'HAVE_OCR_BIFROST_API_KEY',
  bifrostModel: 'HAVE_OCR_BIFROST_MODEL',
} as const;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function parseTransport(value?: string): UnlimitedOCRTransport | undefined {
  if (value === 'direct' || value === 'bifrost') {
    return value;
  }
  return undefined;
}

function parseImageMode(value?: string): UnlimitedOCRImageMode | undefined {
  if (value === 'auto' || value === 'gundam' || value === 'base') {
    return value;
  }
  return undefined;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function parseInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalInteger(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeMimeFromFormat(format?: string): string | null {
  if (!format) return null;
  const normalized = format.toLowerCase().replace(/^\./, '');
  if (normalized === 'jpg' || normalized === 'jpeg') return 'image/jpeg';
  if (normalized === 'png') return 'image/png';
  if (normalized === 'gif') return 'image/gif';
  if (normalized === 'webp') return 'image/webp';
  if (normalized === 'bmp') return 'image/bmp';
  return normalized.startsWith('image/') ? normalized : null;
}

/**
 * OCR provider for baidu/Unlimited-OCR when served by SGLang.
 */
export class UnlimitedOCRProvider implements OCRProvider {
  readonly name = 'unlimited-ocr';

  private config: ResolvedUnlimitedOCRConfig;

  constructor(config: UnlimitedOCRProviderConfig = {}) {
    const envTransport = parseTransport(env(ENV_VARS.transport));
    const hasBifrostSignal = Boolean(
      env(ENV_VARS.bifrostBaseUrl) ||
        env(ENV_VARS.bifrostApiKey) ||
        env('BIFROST_BASE_URL') ||
        env('BIFROST_API_KEY'),
    );
    const transport =
      config.transport ??
      envTransport ??
      (hasBifrostSignal ? 'bifrost' : 'direct');

    this.config = {
      transport,
      baseUrl:
        config.baseUrl ??
        env(ENV_VARS.baseUrl) ??
        (transport === 'bifrost'
          ? (env(ENV_VARS.bifrostBaseUrl) ?? env('BIFROST_BASE_URL'))
          : undefined),
      apiKey:
        config.apiKey ??
        env(ENV_VARS.apiKey) ??
        (transport === 'bifrost'
          ? (env(ENV_VARS.bifrostApiKey) ??
            env('BIFROST_API_KEY') ??
            env('HAVE_AI_API_KEY'))
          : undefined),
      model:
        config.model ??
        env(ENV_VARS.model) ??
        (transport === 'bifrost' ? env(ENV_VARS.bifrostModel) : undefined) ??
        'Unlimited-OCR',
      imageMode:
        config.imageMode ?? parseImageMode(env(ENV_VARS.imageMode)) ?? 'auto',
      prompt: config.prompt ?? env(ENV_VARS.prompt) ?? 'document parsing.',
      multiPagePrompt:
        config.multiPagePrompt ??
        env(ENV_VARS.multiPagePrompt) ??
        'Multi page parsing.',
      stream: config.stream ?? parseBoolean(env(ENV_VARS.stream), true),
      timeout:
        config.timeout ?? parseInteger(env(ENV_VARS.timeout), 20 * 60 * 1000),
      ngramSize: config.ngramSize ?? parseInteger(env(ENV_VARS.ngramSize), 35),
      ngramWindow:
        config.ngramWindow ?? parseOptionalInteger(env(ENV_VARS.ngramWindow)),
      singleImageNgramWindow:
        config.singleImageNgramWindow ??
        parseInteger(env(ENV_VARS.singleImageNgramWindow), 128),
      multiImageNgramWindow:
        config.multiImageNgramWindow ??
        parseInteger(env(ENV_VARS.multiImageNgramWindow), 1024),
      customLogitProcessor:
        config.customLogitProcessor ?? env(ENV_VARS.customLogitProcessor),
      extraRequestBody: config.extraRequestBody ?? {},
    };
  }

  async performOCR(
    images: OCRImage[],
    options?: OCROptions,
  ): Promise<OCRResult> {
    if (!images || images.length === 0) {
      return {
        text: '',
        confidence: 0,
        detections: [],
        metadata: { processingTime: 0, provider: this.name },
      };
    }

    if (!this.config.baseUrl) {
      throw new OCRProcessingError(
        this.name,
        'Unlimited-OCR base URL is not configured',
      );
    }

    if (this.config.transport === 'bifrost' && !this.config.apiKey) {
      throw new OCRProcessingError(
        this.name,
        'Bifrost API key is not configured for Unlimited-OCR',
      );
    }

    const startTime = Date.now();
    const contentParts = this.buildContentParts(images, options);
    if (contentParts.length <= 1) {
      throw new OCRProcessingError(this.name, 'No valid images to process');
    }

    const imageCount = contentParts.filter(
      (part) => part.type === 'image_url',
    ).length;
    const payload = this.buildPayload(contentParts, imageCount);
    const requestTimeout = options?.timeout ?? this.config.timeout;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeout);

    try {
      const response = await fetch(this.getChatCompletionsUrl(), {
        method: 'POST',
        headers: this.getRequestHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new OCRProcessingError(
          this.name,
          `Unlimited-OCR request failed: ${response.status} ${response.statusText}`,
          {
            status: response.status,
            statusText: response.statusText,
            body: errorText.slice(0, 1000),
          },
        );
      }

      const text = await this.readResponseText(response);
      const trimmedText = text.trim();
      const processingTime = Date.now() - startTime;

      return {
        text: trimmedText,
        confidence: trimmedText.length > 0 ? 100 : 0,
        detections:
          trimmedText.length > 0
            ? [{ text: trimmedText, confidence: 100 }]
            : [],
        metadata: {
          processingTime,
          provider: this.name,
          model: this.config.model,
          transport: this.config.transport,
          imageMode: this.resolveImageMode(imageCount),
          outputMode: 'text',
        },
      };
    } catch (error) {
      if (error instanceof OCRProcessingError) {
        throw error;
      }

      const message =
        error instanceof Error && error.name === 'AbortError'
          ? `Unlimited-OCR request timed out after ${requestTimeout}ms`
          : `Unlimited-OCR request failed: ${(error as Error).message}`;
      throw new OCRProcessingError(this.name, message, {
        processingTime: Date.now() - startTime,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async checkDependencies(): Promise<DependencyCheckResult> {
    if (!this.config.baseUrl) {
      return {
        available: false,
        error:
          'Unlimited-OCR base URL is not configured. Set HAVE_OCR_UNLIMITED_BASE_URL or HAVE_OCR_BIFROST_BASE_URL.',
        details: {
          transport: this.config.transport,
          baseUrl: false,
          model: this.config.model,
        },
      };
    }

    if (this.config.transport === 'bifrost' && !this.config.apiKey) {
      return {
        available: false,
        error:
          'Bifrost API key is not configured. Set HAVE_OCR_UNLIMITED_API_KEY, HAVE_OCR_BIFROST_API_KEY, or BIFROST_API_KEY.',
        details: {
          transport: this.config.transport,
          baseUrl: this.config.baseUrl,
          apiKey: false,
          model: this.config.model,
        },
      };
    }

    return {
      available: true,
      details: {
        transport: this.config.transport,
        baseUrl: this.config.baseUrl,
        apiKey: Boolean(this.config.apiKey),
        model: this.config.model,
        imageMode: this.config.imageMode,
        stream: this.config.stream,
      },
    };
  }

  async checkCapabilities(): Promise<OCRCapabilities> {
    return {
      canPerformOCR: true,
      supportedLanguages: this.getSupportedLanguages(),
      supportedFormats: ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'],
      hasConfidenceScores: false,
      hasBoundingBoxes: false,
      providerSpecific: {
        model: this.config.model,
        transport: this.config.transport,
        servedEndpoint: true,
        multiImage: true,
        imageMode: this.config.imageMode,
      },
    };
  }

  getSupportedLanguages(): string[] {
    return [
      'eng',
      'chi_sim',
      'chi_tra',
      'jpn',
      'kor',
      'fra',
      'deu',
      'spa',
      'ita',
      'por',
      'rus',
      'ara',
      'hin',
      'ben',
      'vie',
      'tha',
      'pol',
      'nld',
      'swe',
      'dan',
      'nor',
      'fin',
      'tur',
      'heb',
      'ukr',
      'ces',
      'ell',
      'hun',
      'ron',
      'ind',
      'msa',
    ];
  }

  async cleanup(): Promise<void> {
    // Stateless HTTP provider; nothing to dispose.
  }

  private buildContentParts(
    images: OCRImage[],
    options?: OCROptions,
  ): ContentPart[] {
    const validImages = images
      .map((image) => this.imageToDataUrl(image))
      .filter((dataUrl): dataUrl is string => Boolean(dataUrl));
    const prompt =
      validImages.length > 1 ? this.config.multiPagePrompt : this.config.prompt;
    const languageHint = options?.language
      ? ` Preferred OCR language(s): ${options.language}.`
      : '';

    return [
      {
        type: 'text',
        text: `${prompt}${languageHint}`,
      },
      ...validImages.map(
        (url): ImageContentPart => ({
          type: 'image_url',
          // biome-ignore lint/style/useNamingConvention: OpenAI API format
          image_url: { url, detail: 'high' },
        }),
      ),
    ];
  }

  private buildPayload(contentParts: ContentPart[], imageCount: number) {
    const imageMode = this.resolveImageMode(imageCount);
    const ngramWindow =
      this.config.ngramWindow ??
      (imageCount > 1
        ? this.config.multiImageNgramWindow
        : this.config.singleImageNgramWindow);
    const customParams = Object.fromEntries([
      ['ngram_size', this.config.ngramSize],
      ['window_size', ngramWindow],
    ]);
    const payload: Record<string, unknown> = {
      model: this.config.model,
      messages: [{ role: 'user', content: contentParts }],
      temperature: 0,
      // biome-ignore lint/style/useNamingConvention: SGLang/OpenAI-compatible field
      skip_special_tokens: false,
      // biome-ignore lint/style/useNamingConvention: SGLang field
      images_config: { image_mode: imageMode },
      // biome-ignore lint/style/useNamingConvention: SGLang field
      custom_params: customParams,
      stream: this.config.stream,
    };

    if (this.config.customLogitProcessor) {
      payload.custom_logit_processor = this.config.customLogitProcessor;
    }

    return {
      ...payload,
      ...this.config.extraRequestBody,
    };
  }

  private resolveImageMode(imageCount: number): 'gundam' | 'base' {
    if (
      this.config.imageMode === 'gundam' ||
      this.config.imageMode === 'base'
    ) {
      return this.config.imageMode;
    }
    return imageCount > 1 ? 'base' : 'gundam';
  }

  private getChatCompletionsUrl(): string {
    const baseUrl = this.config.baseUrl?.replace(/\/+$/, '');
    if (!baseUrl) {
      throw new OCRProcessingError(
        this.name,
        'Unlimited-OCR base URL is not configured',
      );
    }

    if (/\/chat\/completions$/.test(baseUrl)) {
      return baseUrl;
    }

    if (/\/(?:v1|openai|pydanticai\/v1)$/.test(baseUrl)) {
      return `${baseUrl}/chat/completions`;
    }

    const gatewayPrefix =
      this.config.transport === 'bifrost' ? '/openai' : '/v1';
    return `${baseUrl}${gatewayPrefix}/chat/completions`;
  }

  private getRequestHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
      if (this.config.transport === 'bifrost') {
        headers['x-bf-vk'] = this.config.apiKey;
        headers['x-api-key'] = this.config.apiKey;
      }
    }

    return headers;
  }

  private imageToDataUrl(image: OCRImage): string | null {
    const data = image.data;

    if (typeof data === 'string') {
      if (data.startsWith('data:') || /^https?:\/\//i.test(data)) {
        return data;
      }

      if (existsSync(data)) {
        const buffer = readFileSync(data);
        const mimeType =
          this.detectMimeType(buffer) ?? normalizeMimeFromFormat(image.format);
        return mimeType ? this.bufferToDataUrl(buffer, mimeType) : null;
      }

      const decoded = Buffer.from(data, 'base64');
      const mimeType =
        this.detectMimeType(decoded) ??
        normalizeMimeFromFormat(image.format) ??
        'image/png';
      return `data:${mimeType};base64,${data}`;
    }

    const buffer = data instanceof Buffer ? data : Buffer.from(data);
    if (buffer.length < 100) {
      console.warn('Unlimited-OCR provider: Image buffer too small, skipping');
      return null;
    }

    const mimeType =
      this.detectMimeType(buffer) ?? normalizeMimeFromFormat(image.format);
    if (!mimeType) {
      console.warn(
        'Unlimited-OCR provider: Unsupported image format, skipping',
      );
      return null;
    }

    return this.bufferToDataUrl(buffer, mimeType);
  }

  private bufferToDataUrl(buffer: Buffer, mimeType: string): string {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }

  private detectMimeType(buffer: Buffer): string | null {
    if (buffer.length < 4) return null;

    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }

    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return 'image/gif';
    }

    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer.length > 11 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return 'image/webp';
    }

    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return 'image/bmp';
    }

    return null;
  }

  private async readJsonText(response: Response): Promise<string> {
    const data = (await response.json()) as ChatCompletionResponse;
    return data.choices?.[0]?.message?.content ?? '';
  }

  private async readResponseText(response: Response): Promise<string> {
    const contentType = response.headers.get('content-type') ?? '';
    if (!this.config.stream || contentType.includes('application/json')) {
      return this.readJsonText(response);
    }

    return this.readStreamingText(response);
  }

  private async readStreamingText(response: Response): Promise<string> {
    if (!response.body) {
      return this.readJsonText(response);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    const rawChunks: string[] = [];
    let pending = '';

    while (true) {
      const { done, value } = await reader.read();
      const decoded = decoder.decode(value, { stream: !done });
      pending += decoded;
      rawChunks.push(decoded);

      const lines = pending.split(/\r?\n/);
      pending = done ? '' : (lines.pop() ?? '');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const data = trimmed.slice('data:'.length).trim();
        if (!data || data === '[DONE]') continue;

        try {
          const event = JSON.parse(data);
          const choice = event.choices?.[0];
          const content =
            choice?.delta?.content ?? choice?.message?.content ?? choice?.text;
          if (typeof content === 'string') {
            chunks.push(content);
          }
        } catch {
          // Ignore malformed stream events and keep reading.
        }
      }

      if (done) break;
    }

    if (chunks.length === 0) {
      try {
        const data = JSON.parse(rawChunks.join('')) as ChatCompletionResponse;
        return data.choices?.[0]?.message?.content ?? '';
      } catch {
        // Not a JSON fallback response.
      }
    }

    return chunks.join('');
  }
}
