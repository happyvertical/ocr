/**
 * @happyvertical/ocr - LiteLLM provider for vision-based OCR
 *
 * This provider uses vision-capable LLMs (like DeepSeek, GPT-4o, Claude) via LiteLLM
 * to perform OCR on images. It converts images to base64 and sends them to the LLM
 * for text extraction.
 */

import type { AIInterface } from '@happyvertical/ai';
import { getAI } from '@happyvertical/ai';

/**
 * Text content part for multimodal messages
 */
interface TextContentPart {
  type: 'text';
  text: string;
}

/**
 * Image content part for vision-capable models
 */
interface ImageContentPart {
  type: 'image_url';
  // biome-ignore lint/style/useNamingConvention: OpenAI API format
  image_url: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
}

/**
 * Union type for content parts in multimodal messages.
 * Defined locally since @happyvertical/ai doesn't export this yet.
 * The runtime behavior works correctly with the OpenAI-compatible API.
 */
type ContentPart = TextContentPart | ImageContentPart;

/**
 * Segment structure returned by LLM in structured output mode
 */
interface StructuredSegment {
  text: string;
  confidence?: number;
  type?: string;
}

/**
 * Parsed structured response from LLM
 */
interface StructuredOCRResponse {
  text: string;
  segments?: StructuredSegment[];
}

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
 * Output mode for LiteLLM OCR
 * - 'simple': Returns raw text with 100% confidence (LLMs don't provide OCR confidence)
 * - 'structured': Prompts LLM to return JSON with estimated confidence scores
 */
export type LiteLLMOutputMode = 'simple' | 'structured';

/**
 * Configuration for LiteLLM provider
 */
export interface LiteLLMProviderConfig {
  /** LiteLLM/DeepSeek API base URL */
  baseUrl?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Model to use (e.g., 'deepseek-chat', 'gpt-4o') */
  model?: string;
  /** Output mode: 'simple' for text-only, 'structured' for JSON with confidence */
  outputMode?: LiteLLMOutputMode;
  /** Custom system prompt for OCR (overrides default prompts) */
  systemPrompt?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Environment variable configuration mapping
 */
const ENV_VARS = {
  baseUrl: 'HAVE_OCR_LITELLM_BASE_URL',
  apiKey: 'HAVE_OCR_LITELLM_API_KEY',
  model: 'HAVE_OCR_LITELLM_MODEL',
  outputMode: 'HAVE_OCR_LITELLM_OUTPUT_MODE',
  timeout: 'HAVE_OCR_LITELLM_TIMEOUT',
} as const;

const DEFAULT_SYSTEM_PROMPT_SIMPLE = `You are an OCR assistant. Extract all visible text from the provided image(s).
Return ONLY the extracted text, preserving the original layout as much as possible.
Do not add any commentary, explanations, or formatting beyond what is in the image.
If there is no text in the image, return an empty string.`;

const DEFAULT_SYSTEM_PROMPT_STRUCTURED = `You are an OCR assistant. Extract all visible text from the provided image(s).

Return your response as a JSON object with the following structure:
{
  "text": "the full extracted text preserving layout",
  "segments": [
    {
      "text": "segment text",
      "confidence": 0.95,
      "type": "paragraph"
    }
  ]
}

For confidence scores, estimate based on text clarity:
- 0.95+ for clear, high-contrast text
- 0.80-0.95 for moderately clear text
- 0.60-0.80 for blurry or partially obscured text
- Below 0.60 for very unclear text

Valid segment types: "heading", "paragraph", "list", "table", "caption", "other"

Return ONLY valid JSON, no markdown code blocks or additional text.
If there is no text, return: {"text": "", "segments": []}`;

/**
 * LiteLLM OCR provider that uses vision-capable LLMs for text extraction.
 *
 * This provider works with any OpenAI-compatible API endpoint, including:
 * - LiteLLM proxy servers
 * - DeepSeek API
 * - OpenAI API directly
 * - Azure OpenAI
 * - Any other OpenAI-compatible vision model endpoint
 *
 * @example Basic usage
 * ```typescript
 * const provider = new LiteLLMProvider({
 *   baseUrl: 'http://localhost:4000/v1',
 *   apiKey: 'your-api-key',
 *   model: 'deepseek-ocr'
 * });
 *
 * const result = await provider.performOCR([{ data: imageBuffer }]);
 * console.log(result.text);
 * ```
 *
 * @example With structured output
 * ```typescript
 * const provider = new LiteLLMProvider({
 *   outputMode: 'structured',
 *   model: 'gpt-4o'
 * });
 *
 * const result = await provider.performOCR(images);
 * console.log('Confidence:', result.confidence);
 * console.log('Segments:', result.detections);
 * ```
 */
export class LiteLLMProvider implements OCRProvider {
  readonly name = 'litellm';

  private config: Required<LiteLLMProviderConfig>;
  private aiClient: AIInterface | null = null;

  constructor(config: LiteLLMProviderConfig = {}) {
    // Load from environment variables, with constructor options taking precedence
    const envOutputMode = process.env[ENV_VARS.outputMode];
    const envTimeout = process.env[ENV_VARS.timeout];

    this.config = {
      baseUrl:
        config.baseUrl ??
        process.env[ENV_VARS.baseUrl] ??
        'http://localhost:4000/v1',
      apiKey: config.apiKey ?? process.env[ENV_VARS.apiKey] ?? '',
      model: config.model ?? process.env[ENV_VARS.model] ?? 'deepseek-chat',
      outputMode:
        config.outputMode ??
        ((envOutputMode === 'structured'
          ? 'structured'
          : 'simple') as LiteLLMOutputMode),
      systemPrompt:
        config.systemPrompt ??
        ((config.outputMode ?? envOutputMode) === 'structured'
          ? DEFAULT_SYSTEM_PROMPT_STRUCTURED
          : DEFAULT_SYSTEM_PROMPT_SIMPLE),
      timeout:
        config.timeout ?? (envTimeout ? parseInt(envTimeout, 10) : 60000),
    };
  }

  /**
   * Initialize the AI client lazily
   */
  private async getAIClient(): Promise<AIInterface> {
    if (this.aiClient) {
      return this.aiClient;
    }

    this.aiClient = await getAI({
      type: 'openai', // LiteLLM is OpenAI-compatible
      baseUrl: this.config.baseUrl,
      apiKey: this.config.apiKey,
      defaultModel: this.config.model,
      timeout: this.config.timeout,
    });

    return this.aiClient;
  }

  /**
   * Convert OCRImage to base64 data URL for API transmission
   */
  private imageToDataUrl(image: OCRImage): string | null {
    const data = image.data;

    if (typeof data === 'string') {
      // Already a data URL
      if (data.startsWith('data:')) {
        return data;
      }
      // Assume base64, try to detect format from first bytes
      try {
        const decoded = Buffer.from(data, 'base64');
        const mimeType = this.detectMimeType(decoded);
        return `data:${mimeType};base64,${data}`;
      } catch {
        // If decoding fails, assume PNG
        return `data:image/png;base64,${data}`;
      }
    }

    // Buffer or Uint8Array
    const buffer = data instanceof Buffer ? data : Buffer.from(data);

    // Validate minimum size
    if (buffer.length < 100) {
      console.warn('LiteLLM provider: Image buffer too small, skipping');
      return null;
    }

    const mimeType = this.detectMimeType(buffer);
    if (!mimeType) {
      console.warn('LiteLLM provider: Unsupported image format, skipping');
      return null;
    }

    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Detect MIME type from buffer magic bytes
   */
  private detectMimeType(buffer: Buffer): string | null {
    if (buffer.length < 4) return null;

    // PNG: 89 50 4E 47
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return 'image/png';
    }

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    // GIF: 47 49 46 38
    if (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return 'image/gif';
    }

    // WebP: 52 49 46 46 ... 57 45 42 50
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

    // BMP: 42 4D
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return 'image/bmp';
    }

    return null;
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

    const startTime = Date.now();

    try {
      const client = await this.getAIClient();

      // Build content parts: images first, then instruction
      const contentParts: ContentPart[] = [];

      // Add images
      for (const image of images) {
        const dataUrl = this.imageToDataUrl(image);
        if (dataUrl) {
          // biome-ignore lint/style/useNamingConvention: OpenAI API format
          contentParts.push({
            type: 'image_url',
            image_url: { url: dataUrl, detail: 'high' },
          });
        }
      }

      if (contentParts.length === 0) {
        throw new OCRProcessingError(this.name, 'No valid images to process');
      }

      // Add text instruction
      let instruction = 'Extract all text from the image(s).';
      if (options?.language) {
        instruction = `Extract text in ${options.language} language(s). ${instruction}`;
      }
      contentParts.push({
        type: 'text',
        text: instruction,
      });

      // Determine which system prompt to use
      const systemPrompt =
        this.config.outputMode === 'structured'
          ? DEFAULT_SYSTEM_PROMPT_STRUCTURED
          : DEFAULT_SYSTEM_PROMPT_SIMPLE;

      // Note: We use type assertion here because the current @happyvertical/ai package
      // only accepts string content, but the underlying OpenAI SDK accepts arrays.
      // The AI package will be updated to support ContentPart[] natively.
      const response = await client.chat(
        [
          { role: 'system', content: systemPrompt },
          // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for vision support until AI package is updated
          { role: 'user', content: contentParts as any },
        ],
        {
          model: this.config.model,
          maxTokens: 4096,
          temperature: 0.1, // Low temperature for accuracy
        },
      );

      const processingTime = Date.now() - startTime;

      // Parse response based on output mode
      if (this.config.outputMode === 'structured') {
        return this.parseStructuredResponse(response.content, processingTime);
      }

      // Simple mode: text only, 100% confidence (LLMs don't have native OCR confidence)
      const text = response.content.trim();
      return {
        text,
        confidence: text.length > 0 ? 100 : 0,
        detections:
          text.length > 0
            ? [
                {
                  text,
                  confidence: 100,
                },
              ]
            : [],
        metadata: {
          processingTime,
          provider: this.name,
          model: this.config.model,
          outputMode: 'simple',
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('LiteLLM OCR failed:', error);

      if (error instanceof OCRProcessingError) {
        throw error;
      }

      throw new OCRProcessingError(
        this.name,
        `OCR processing failed: ${(error as Error).message}`,
        { processingTime, error },
      );
    }
  }

  /**
   * Parse structured JSON response from LLM
   */
  private parseStructuredResponse(
    content: string,
    processingTime: number,
  ): OCRResult {
    try {
      // Try to extract JSON from response (LLMs sometimes add markdown code blocks)
      let jsonStr = content.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
          jsonStr = match[1].trim();
        }
      }

      const parsed: StructuredOCRResponse = JSON.parse(jsonStr);

      // Calculate average confidence from segments
      const segments: StructuredSegment[] = parsed.segments || [];
      const avgConfidence =
        segments.length > 0
          ? (segments.reduce(
              (sum: number, s: StructuredSegment) =>
                sum + (s.confidence || 0.5),
              0,
            ) /
              segments.length) *
            100
          : parsed.text?.length > 0
            ? 80
            : 0; // Default 80% if text but no segments

      return {
        text: parsed.text || '',
        confidence: avgConfidence,
        detections: segments.map((s: StructuredSegment) => ({
          text: s.text,
          confidence: (s.confidence || 0.5) * 100,
          // LLMs don't provide bounding boxes
        })),
        metadata: {
          processingTime,
          provider: this.name,
          model: this.config.model,
          outputMode: 'structured',
          segmentCount: segments.length,
        },
      };
    } catch (parseError) {
      console.warn(
        'Failed to parse structured response, falling back to simple mode:',
        parseError,
      );

      // Fallback: treat the entire response as text
      const text = content.trim();
      return {
        text,
        confidence: text.length > 0 ? 75 : 0, // Lower confidence for fallback
        detections:
          text.length > 0
            ? [
                {
                  text,
                  confidence: 75,
                },
              ]
            : [],
        metadata: {
          processingTime,
          provider: this.name,
          model: this.config.model,
          outputMode: 'structured-fallback',
          parseError: (parseError as Error).message,
        },
      };
    }
  }

  async checkDependencies(): Promise<DependencyCheckResult> {
    // Check if API key is configured
    if (!this.config.apiKey) {
      return {
        available: false,
        error:
          'LiteLLM API key not configured. Set HAVE_OCR_LITELLM_API_KEY environment variable or pass apiKey in constructor options.',
        details: {
          apiKey: false,
          baseUrl: this.config.baseUrl,
          model: this.config.model,
        },
      };
    }

    // Try to initialize the client to verify connectivity
    try {
      await this.getAIClient();
      return {
        available: true,
        details: {
          apiKey: true,
          baseUrl: this.config.baseUrl,
          model: this.config.model,
          outputMode: this.config.outputMode,
        },
      };
    } catch (error) {
      return {
        available: false,
        error: `Failed to initialize LiteLLM client: ${(error as Error).message}`,
        details: {
          apiKey: !!this.config.apiKey,
          baseUrl: this.config.baseUrl,
          model: this.config.model,
        },
      };
    }
  }

  async checkCapabilities(): Promise<OCRCapabilities> {
    return {
      canPerformOCR: true,
      supportedLanguages: this.getSupportedLanguages(),
      maxImageSize: 4096 * 4096, // Depends on model, this is a reasonable default
      supportedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'],
      hasConfidenceScores: this.config.outputMode === 'structured',
      hasBoundingBoxes: false, // LLMs don't provide pixel-level bounding boxes
      providerSpecific: {
        llmBased: true,
        model: this.config.model,
        outputMode: this.config.outputMode,
        baseUrl: this.config.baseUrl,
      },
    };
  }

  getSupportedLanguages(): string[] {
    // Vision LLMs generally support most written languages
    return [
      'eng', // English
      'chi_sim', // Chinese Simplified
      'chi_tra', // Chinese Traditional
      'jpn', // Japanese
      'kor', // Korean
      'fra', // French
      'deu', // German
      'spa', // Spanish
      'ita', // Italian
      'por', // Portuguese
      'rus', // Russian
      'ara', // Arabic
      'hin', // Hindi
      'ben', // Bengali
      'vie', // Vietnamese
      'tha', // Thai
      'pol', // Polish
      'nld', // Dutch
      'swe', // Swedish
      'dan', // Danish
      'nor', // Norwegian
      'fin', // Finnish
      'tur', // Turkish
      'heb', // Hebrew
      'ukr', // Ukrainian
      'ces', // Czech
      'ell', // Greek
      'hun', // Hungarian
      'ron', // Romanian
      'ind', // Indonesian
      'msa', // Malay
    ];
  }

  async cleanup(): Promise<void> {
    this.aiClient = null;
  }
}
