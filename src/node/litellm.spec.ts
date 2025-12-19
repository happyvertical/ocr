/**
 * Unit tests for LiteLLM OCR provider
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LiteLLMProvider } from './litellm';

// Mock @happyvertical/ai
vi.mock('@happyvertical/ai', () => ({
  getAI: vi.fn().mockResolvedValue({
    chat: vi.fn().mockResolvedValue({
      content: 'Extracted text from image',
    }),
  }),
}));

describe('LiteLLMProvider', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Configuration', () => {
    test('should use default configuration when no options provided', () => {
      const provider = new LiteLLMProvider();
      expect(provider.name).toBe('litellm');
    });

    test('should load configuration from environment variables', async () => {
      process.env.HAVE_OCR_LITELLM_BASE_URL = 'https://custom.api.com/v1';
      process.env.HAVE_OCR_LITELLM_API_KEY = 'test-api-key';
      process.env.HAVE_OCR_LITELLM_MODEL = 'custom-model';
      process.env.HAVE_OCR_LITELLM_OUTPUT_MODE = 'structured';

      const provider = new LiteLLMProvider();
      const deps = await provider.checkDependencies();

      expect(deps.details.baseUrl).toBe('https://custom.api.com/v1');
      expect(deps.details.model).toBe('custom-model');
    });

    test('should prefer constructor options over environment variables', async () => {
      process.env.HAVE_OCR_LITELLM_API_KEY = 'env-key';
      process.env.HAVE_OCR_LITELLM_MODEL = 'env-model';

      const provider = new LiteLLMProvider({
        apiKey: 'constructor-key',
        model: 'constructor-model',
      });

      const deps = await provider.checkDependencies();
      expect(deps.details.model).toBe('constructor-model');
    });

    test('should support outputMode configuration', async () => {
      const simpleProvider = new LiteLLMProvider({
        apiKey: 'test-key',
        outputMode: 'simple',
      });

      const structuredProvider = new LiteLLMProvider({
        apiKey: 'test-key',
        outputMode: 'structured',
      });

      const simpleCaps = await simpleProvider.checkCapabilities();
      const structuredCaps = await structuredProvider.checkCapabilities();

      expect(simpleCaps.hasConfidenceScores).toBe(false);
      expect(structuredCaps.hasConfidenceScores).toBe(true);
    });
  });

  describe('Dependency Checking', () => {
    test('should return unavailable when API key is not configured', async () => {
      delete process.env.HAVE_OCR_LITELLM_API_KEY;

      const provider = new LiteLLMProvider();
      const deps = await provider.checkDependencies();

      expect(deps.available).toBe(false);
      expect(deps.error).toContain('API key not configured');
    });

    test('should return available when API key is configured', async () => {
      const provider = new LiteLLMProvider({
        apiKey: 'test-api-key',
      });

      const deps = await provider.checkDependencies();
      expect(deps.available).toBe(true);
      expect(deps.details.apiKey).toBe(true);
    });
  });

  describe('Capabilities', () => {
    test('should report correct capabilities', async () => {
      const provider = new LiteLLMProvider({
        apiKey: 'test-key',
        outputMode: 'structured',
      });

      const caps = await provider.checkCapabilities();

      expect(caps.canPerformOCR).toBe(true);
      expect(caps.supportedFormats).toContain('png');
      expect(caps.supportedFormats).toContain('jpg');
      expect(caps.hasBoundingBoxes).toBe(false); // LLMs don't provide bounding boxes
      expect(caps.hasConfidenceScores).toBe(true); // structured mode
      expect(caps.providerSpecific?.llmBased).toBe(true);
    });

    test('should report no confidence scores in simple mode', async () => {
      const provider = new LiteLLMProvider({
        apiKey: 'test-key',
        outputMode: 'simple',
      });

      const caps = await provider.checkCapabilities();
      expect(caps.hasConfidenceScores).toBe(false);
    });
  });

  describe('Supported Languages', () => {
    test('should return a comprehensive list of supported languages', () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });
      const languages = provider.getSupportedLanguages();

      expect(languages).toContain('eng');
      expect(languages).toContain('chi_sim');
      expect(languages).toContain('jpn');
      expect(languages).toContain('kor');
      expect(languages).toContain('fra');
      expect(languages).toContain('deu');
      expect(languages.length).toBeGreaterThan(20);
    });
  });

  describe('OCR Processing', () => {
    test('should return empty result for empty images array', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });
      const result = await provider.performOCR([]);

      expect(result.text).toBe('');
      expect(result.confidence).toBe(0);
      expect(result.detections).toEqual([]);
      expect(result.metadata?.provider).toBe('litellm');
    });

    test('should process PNG image correctly', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });

      // PNG magic bytes
      const pngBuffer = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        ...Array(100).fill(0), // Minimal valid-ish PNG
      ]);

      const result = await provider.performOCR([{ data: pngBuffer }]);

      expect(result.text).toBe('Extracted text from image');
      expect(result.confidence).toBe(100); // Simple mode returns 100%
      expect(result.metadata?.provider).toBe('litellm');
      expect(result.metadata?.outputMode).toBe('simple');
    });

    test('should process JPEG image correctly', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });

      // JPEG magic bytes
      const jpegBuffer = Buffer.from([
        0xff,
        0xd8,
        0xff,
        0xe0,
        ...Array(100).fill(0), // Minimal valid-ish JPEG
      ]);

      const result = await provider.performOCR([{ data: jpegBuffer }]);

      expect(result.text).toBe('Extracted text from image');
    });

    test('should skip unsupported image formats', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });

      // Unknown format (not PNG, JPEG, GIF, WebP, or BMP)
      const unknownBuffer = Buffer.from([
        0x00,
        0x01,
        0x02,
        0x03,
        ...Array(100).fill(0),
      ]);

      await expect(
        provider.performOCR([{ data: unknownBuffer }]),
      ).rejects.toThrow('No valid images to process');
    });

    test('should skip buffers that are too small', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });

      // Valid PNG magic but too small
      const tinyBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

      await expect(provider.performOCR([{ data: tinyBuffer }])).rejects.toThrow(
        'No valid images to process',
      );
    });

    test('should handle base64 string input', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });

      // PNG as base64
      const pngBytes = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        ...Array(100).fill(0),
      ]);
      const base64 = pngBytes.toString('base64');

      const result = await provider.performOCR([{ data: base64 }]);
      expect(result.text).toBe('Extracted text from image');
    });

    test('should handle data URL input', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });

      const dataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await provider.performOCR([{ data: dataUrl }]);
      expect(result.text).toBe('Extracted text from image');
    });
  });

  describe('Structured Output Mode', () => {
    test('should parse valid structured JSON response', async () => {
      const { getAI } = await import('@happyvertical/ai');
      vi.mocked(getAI).mockResolvedValue({
        chat: vi.fn().mockResolvedValue({
          content: JSON.stringify({
            text: 'Hello World',
            segments: [
              { text: 'Hello', confidence: 0.95, type: 'heading' },
              { text: 'World', confidence: 0.9, type: 'paragraph' },
            ],
          }),
        }),
      } as any);

      const provider = new LiteLLMProvider({
        apiKey: 'test-key',
        outputMode: 'structured',
      });

      const pngBuffer = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        ...Array(100).fill(0),
      ]);

      const result = await provider.performOCR([{ data: pngBuffer }]);

      expect(result.text).toBe('Hello World');
      expect(result.confidence).toBeCloseTo(92.5, 1); // Average of 95 and 90
      expect(result.detections).toHaveLength(2);
      expect(result.detections?.[0].text).toBe('Hello');
      expect(result.detections?.[0].confidence).toBe(95);
      expect(result.metadata?.outputMode).toBe('structured');
    });

    test('should handle JSON wrapped in markdown code block', async () => {
      const { getAI } = await import('@happyvertical/ai');
      vi.mocked(getAI).mockResolvedValue({
        chat: vi.fn().mockResolvedValue({
          content: '```json\n{"text": "Test", "segments": []}\n```',
        }),
      } as any);

      const provider = new LiteLLMProvider({
        apiKey: 'test-key',
        outputMode: 'structured',
      });

      const pngBuffer = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        ...Array(100).fill(0),
      ]);

      const result = await provider.performOCR([{ data: pngBuffer }]);

      expect(result.text).toBe('Test');
    });

    test('should fallback gracefully when JSON parsing fails', async () => {
      const { getAI } = await import('@happyvertical/ai');
      vi.mocked(getAI).mockResolvedValue({
        chat: vi.fn().mockResolvedValue({
          content: 'This is not valid JSON, just plain text response',
        }),
      } as any);

      const provider = new LiteLLMProvider({
        apiKey: 'test-key',
        outputMode: 'structured',
      });

      const pngBuffer = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        ...Array(100).fill(0),
      ]);

      const result = await provider.performOCR([{ data: pngBuffer }]);

      expect(result.text).toBe(
        'This is not valid JSON, just plain text response',
      );
      expect(result.confidence).toBe(75); // Fallback confidence
      expect(result.metadata?.outputMode).toBe('structured-fallback');
      expect(result.metadata?.parseError).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    test('should clean up AI client on cleanup', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });

      // Access client to initialize it
      const pngBuffer = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        ...Array(100).fill(0),
      ]);
      await provider.performOCR([{ data: pngBuffer }]);

      // Cleanup should not throw
      await expect(provider.cleanup()).resolves.not.toThrow();
    });
  });

  describe('Image Format Detection', () => {
    test('should detect PNG format', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });

      const pngBuffer = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        ...Array(100).fill(0),
      ]);

      const result = await provider.performOCR([{ data: pngBuffer }]);
      expect(result.text).toBeDefined();
    });

    test('should detect JPEG format', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });

      const jpegBuffer = Buffer.from([
        0xff,
        0xd8,
        0xff,
        0xe0,
        ...Array(100).fill(0),
      ]);

      const result = await provider.performOCR([{ data: jpegBuffer }]);
      expect(result.text).toBeDefined();
    });

    test('should detect GIF format', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });

      // GIF89a header
      const gifBuffer = Buffer.from([
        0x47,
        0x49,
        0x46,
        0x38,
        0x39,
        0x61,
        ...Array(100).fill(0),
      ]);

      const result = await provider.performOCR([{ data: gifBuffer }]);
      expect(result.text).toBeDefined();
    });

    test('should detect WebP format', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });

      // RIFF....WEBP header
      const webpBuffer = Buffer.from([
        0x52,
        0x49,
        0x46,
        0x46, // RIFF
        0x00,
        0x00,
        0x00,
        0x00, // File size
        0x57,
        0x45,
        0x42,
        0x50, // WEBP
        ...Array(100).fill(0),
      ]);

      const result = await provider.performOCR([{ data: webpBuffer }]);
      expect(result.text).toBeDefined();
    });

    test('should detect BMP format', async () => {
      const provider = new LiteLLMProvider({ apiKey: 'test-key' });

      const bmpBuffer = Buffer.from([
        0x42,
        0x4d, // BM header
        ...Array(100).fill(0),
      ]);

      const result = await provider.performOCR([{ data: bmpBuffer }]);
      expect(result.text).toBeDefined();
    });
  });
});
