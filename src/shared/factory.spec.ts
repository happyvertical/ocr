/**
 * @happyvertical/ocr - Environment variable configuration tests
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getOCR, OCRFactory, resetOCRFactory } from './factory';
import type { OCRProvider } from './types';

const createMockProvider = (
  overrides: Partial<OCRProvider> = {},
): OCRProvider => ({
  name: 'mock',
  performOCR: vi.fn().mockResolvedValue({
    text: 'mock text',
    confidence: 90,
    detections: [],
  }),
  checkDependencies: vi.fn().mockResolvedValue({
    available: true,
    details: {},
  }),
  checkCapabilities: vi.fn().mockResolvedValue({
    canPerformOCR: true,
    supportedLanguages: ['eng'],
  }),
  getSupportedLanguages: vi.fn().mockReturnValue(['eng']),
  cleanup: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('OCRFactory environment variable configuration', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset factory before each test
    resetOCRFactory();
  });

  afterEach(() => {
    // Restore original env vars
    process.env = { ...originalEnv };
    // Reset factory after each test
    resetOCRFactory();
    vi.restoreAllMocks();
  });

  test('should load provider from HAVE_OCR_PROVIDER', () => {
    process.env.HAVE_OCR_PROVIDER = 'onnx';
    const factory = new OCRFactory();

    // Access private property via any cast for testing
    const primaryProvider = (factory as any).primaryProvider;
    expect(primaryProvider).toBe('onnx');
  });

  test('should load language from HAVE_OCR_LANGUAGE', () => {
    process.env.HAVE_OCR_LANGUAGE = 'eng+chi_sim';
    const factory = new OCRFactory();

    const defaultOptions = (factory as any).defaultOptions;
    expect(defaultOptions?.language).toBe('eng+chi_sim');
  });

  test('should load confidenceThreshold from HAVE_OCR_CONFIDENCE_THRESHOLD', () => {
    process.env.HAVE_OCR_CONFIDENCE_THRESHOLD = '85';
    const factory = new OCRFactory();

    const defaultOptions = (factory as any).defaultOptions;
    expect(defaultOptions?.confidenceThreshold).toBe(85);
  });

  test('should load timeout from HAVE_OCR_TIMEOUT', () => {
    process.env.HAVE_OCR_TIMEOUT = '45000';
    const factory = new OCRFactory();

    const defaultOptions = (factory as any).defaultOptions;
    expect(defaultOptions?.timeout).toBe(45000);
  });

  test('should load all environment variables together', () => {
    process.env.HAVE_OCR_PROVIDER = 'tesseract';
    process.env.HAVE_OCR_LANGUAGE = 'eng+jpn';
    process.env.HAVE_OCR_CONFIDENCE_THRESHOLD = '90';
    process.env.HAVE_OCR_TIMEOUT = '60000';

    const factory = new OCRFactory();

    const primaryProvider = (factory as any).primaryProvider;
    const defaultOptions = (factory as any).defaultOptions;

    expect(primaryProvider).toBe('tesseract');
    expect(defaultOptions?.language).toBe('eng+jpn');
    expect(defaultOptions?.confidenceThreshold).toBe(90);
    expect(defaultOptions?.timeout).toBe(60000);
  });

  test('user options should take precedence over env vars', () => {
    process.env.HAVE_OCR_PROVIDER = 'onnx';
    process.env.HAVE_OCR_LANGUAGE = 'eng';
    process.env.HAVE_OCR_CONFIDENCE_THRESHOLD = '70';
    process.env.HAVE_OCR_TIMEOUT = '30000';

    const factory = new OCRFactory({
      provider: 'tesseract',
      defaultOptions: {
        language: 'jpn',
        confidenceThreshold: 95,
        timeout: 50000,
      },
    });

    const primaryProvider = (factory as any).primaryProvider;
    const defaultOptions = (factory as any).defaultOptions;

    expect(primaryProvider).toBe('tesseract');
    expect(defaultOptions?.language).toBe('jpn');
    expect(defaultOptions?.confidenceThreshold).toBe(95);
    expect(defaultOptions?.timeout).toBe(50000);
  });

  test('partial user options should merge with env vars', () => {
    process.env.HAVE_OCR_PROVIDER = 'onnx';
    process.env.HAVE_OCR_LANGUAGE = 'eng';
    process.env.HAVE_OCR_CONFIDENCE_THRESHOLD = '80';
    process.env.HAVE_OCR_TIMEOUT = '40000';

    const factory = new OCRFactory({
      defaultOptions: {
        language: 'chi_sim', // Override only language
      },
    });

    const primaryProvider = (factory as any).primaryProvider;
    const defaultOptions = (factory as any).defaultOptions;

    expect(primaryProvider).toBe('onnx'); // From env
    expect(defaultOptions?.language).toBe('chi_sim'); // From user
    expect(defaultOptions?.confidenceThreshold).toBe(80); // From env
    expect(defaultOptions?.timeout).toBe(40000); // From env
  });

  test('getOCR should use env vars for global singleton', () => {
    process.env.HAVE_OCR_PROVIDER = 'onnx';
    process.env.HAVE_OCR_LANGUAGE = 'eng+chi_sim';

    const factory = getOCR();

    const primaryProvider = (factory as any).primaryProvider;
    const defaultOptions = (factory as any).defaultOptions;

    expect(primaryProvider).toBe('onnx');
    expect(defaultOptions?.language).toBe('eng+chi_sim');
  });

  test('getOCR with options should create new instance with those options', () => {
    process.env.HAVE_OCR_PROVIDER = 'onnx';
    process.env.HAVE_OCR_LANGUAGE = 'eng';

    const factory = getOCR({
      provider: 'tesseract',
      defaultOptions: { language: 'jpn' },
    });

    const primaryProvider = (factory as any).primaryProvider;
    const defaultOptions = (factory as any).defaultOptions;

    expect(primaryProvider).toBe('tesseract');
    expect(defaultOptions?.language).toBe('jpn');
  });

  test('should handle invalid confidence threshold gracefully', () => {
    process.env.HAVE_OCR_CONFIDENCE_THRESHOLD = 'not-a-number';

    // Should not throw, but log warning
    const factory = new OCRFactory();

    const defaultOptions = (factory as any).defaultOptions;
    // Invalid value should be skipped
    expect(defaultOptions?.confidenceThreshold).toBeUndefined();
  });

  test('should handle invalid timeout gracefully', () => {
    process.env.HAVE_OCR_TIMEOUT = 'invalid';

    // Should not throw, but log warning
    const factory = new OCRFactory();

    const defaultOptions = (factory as any).defaultOptions;
    // Invalid value should be skipped
    expect(defaultOptions?.timeout).toBeUndefined();
  });

  test('should default to auto provider when no env var set', () => {
    delete process.env.HAVE_OCR_PROVIDER;

    const factory = new OCRFactory();

    const primaryProvider = (factory as any).primaryProvider;
    expect(primaryProvider).toBe('auto');
  });

  test('should handle empty string env vars', () => {
    process.env.HAVE_OCR_PROVIDER = '';
    process.env.HAVE_OCR_LANGUAGE = '';

    const factory = new OCRFactory();

    const primaryProvider = (factory as any).primaryProvider;
    const defaultOptions = (factory as any).defaultOptions;

    // Empty string should default to 'auto' for provider
    expect(primaryProvider).toBe('auto');
    // Empty string for language is loaded as empty string by loadEnvConfig
    expect(defaultOptions?.language).toBe('');
  });

  test('should support all valid provider values', () => {
    const validProviders = ['auto', 'tesseract', 'onnx', 'web-ocr'];

    for (const provider of validProviders) {
      process.env.HAVE_OCR_PROVIDER = provider;
      const factory = new OCRFactory();
      const primaryProvider = (factory as any).primaryProvider;
      expect(primaryProvider).toBe(provider);
    }
  });

  test('should handle edge case confidence threshold values', () => {
    // Test minimum value
    process.env.HAVE_OCR_CONFIDENCE_THRESHOLD = '0';
    let factory = new OCRFactory();
    let defaultOptions = (factory as any).defaultOptions;
    expect(defaultOptions?.confidenceThreshold).toBe(0);

    // Test maximum value
    process.env.HAVE_OCR_CONFIDENCE_THRESHOLD = '100';
    factory = new OCRFactory();
    defaultOptions = (factory as any).defaultOptions;
    expect(defaultOptions?.confidenceThreshold).toBe(100);

    // Test negative value (should parse as number but may be filtered by provider)
    process.env.HAVE_OCR_CONFIDENCE_THRESHOLD = '-10';
    factory = new OCRFactory();
    defaultOptions = (factory as any).defaultOptions;
    expect(defaultOptions?.confidenceThreshold).toBe(-10);

    // Test value over 100 (should parse as number but may be clamped by provider)
    process.env.HAVE_OCR_CONFIDENCE_THRESHOLD = '150';
    factory = new OCRFactory();
    defaultOptions = (factory as any).defaultOptions;
    expect(defaultOptions?.confidenceThreshold).toBe(150);
  });

  test('should handle very large timeout values', () => {
    process.env.HAVE_OCR_TIMEOUT = '999999';
    const factory = new OCRFactory();
    const defaultOptions = (factory as any).defaultOptions;
    expect(defaultOptions?.timeout).toBe(999999);
  });

  test('should handle multi-language format in env var', () => {
    const multiLangFormats = [
      'eng+chi_sim',
      'eng+chi_sim+jpn',
      'eng+chi_sim+jpn+kor',
      'fra+deu+eng',
    ];

    for (const lang of multiLangFormats) {
      process.env.HAVE_OCR_LANGUAGE = lang;
      const factory = new OCRFactory();
      const defaultOptions = (factory as any).defaultOptions;
      expect(defaultOptions?.language).toBe(lang);
    }
  });

  test('should use fallback providers when the primary result is empty', async () => {
    const primary = createMockProvider({
      name: 'primary',
      performOCR: vi.fn().mockResolvedValue({
        text: '',
        confidence: 0,
        detections: [],
      }),
    });
    const fallback = createMockProvider({
      name: 'fallback',
      performOCR: vi.fn().mockResolvedValue({
        text: 'fallback text',
        confidence: 75,
        detections: [],
      }),
    });
    const factory = new OCRFactory({
      provider: 'primary',
      fallbackProviders: ['fallback'],
      defaultOptions: { language: 'eng' },
    });
    (factory as any).initialized = true;
    factory.addProvider('primary', primary);
    factory.addProvider('fallback', fallback);

    const result = await factory.performOCR([{ data: Buffer.alloc(128) }]);

    expect(result.text).toBe('fallback text');
    expect(result.metadata?.provider).toBe('fallback');
    expect(result.metadata?.fallbackFrom).toBe('primary');
    expect(primary.performOCR).toHaveBeenCalledTimes(1);
    expect(fallback.performOCR).toHaveBeenCalledTimes(1);
  });

  test('should continue through auto providers when the best result is empty', async () => {
    const onnx = createMockProvider({
      name: 'onnx',
      performOCR: vi.fn().mockResolvedValue({
        text: '',
        confidence: 0,
        detections: [],
      }),
    });
    const tesseract = createMockProvider({
      name: 'tesseract',
      performOCR: vi.fn().mockResolvedValue({
        text: 'tesseract text',
        confidence: 82,
        detections: [],
      }),
    });
    const factory = new OCRFactory({
      provider: 'auto',
      defaultOptions: { language: 'eng' },
    });
    (factory as any).initialized = true;
    factory.addProvider('onnx', onnx);
    factory.addProvider('tesseract', tesseract);

    const result = await factory.performOCR([{ data: Buffer.alloc(128) }]);

    expect(result.text).toBe('tesseract text');
    expect(result.metadata?.provider).toBe('tesseract');
    expect(result.metadata?.fallbackFrom).toBe('onnx');
    expect(onnx.performOCR).toHaveBeenCalledTimes(1);
    expect(tesseract.performOCR).toHaveBeenCalledTimes(1);
  });

  test('should suppress unavailable auto provider logs when another provider is available', async () => {
    const debug = vi
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const onnx = createMockProvider({ name: 'onnx' });
    const tesseract = createMockProvider({
      name: 'tesseract',
      checkDependencies: vi.fn().mockResolvedValue({
        available: false,
        error: 'Tesseract missing',
        details: {},
      }),
    });
    const litellm = createMockProvider({
      name: 'litellm',
      checkDependencies: vi.fn().mockResolvedValue({
        available: false,
        error: 'LiteLLM API key not configured',
        details: {},
      }),
    });
    const factory = new OCRFactory({ provider: 'auto' });
    (factory as any).initialized = true;
    factory.addProvider('onnx', onnx);
    factory.addProvider('tesseract', tesseract);
    factory.addProvider('litellm', litellm);

    const providers = await (factory as any).getAvailableProviderChain();

    expect(providers.map((provider: OCRProvider) => provider.name)).toEqual([
      'onnx',
    ]);
    expect(debug).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  test('should log unavailable auto providers when no providers are available', async () => {
    const debug = vi
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);
    const onnx = createMockProvider({
      name: 'onnx',
      checkDependencies: vi.fn().mockResolvedValue({
        available: false,
        error: 'ONNX missing',
        details: {},
      }),
    });
    const tesseract = createMockProvider({
      name: 'tesseract',
      checkDependencies: vi.fn().mockResolvedValue({
        available: false,
        error: 'Tesseract missing',
        details: {},
      }),
    });
    const factory = new OCRFactory({ provider: 'auto' });
    (factory as any).initialized = true;
    factory.addProvider('onnx', onnx);
    factory.addProvider('tesseract', tesseract);

    const providers = await (factory as any).getAvailableProviderChain();

    expect(providers).toEqual([]);
    expect(debug).toHaveBeenCalledWith(
      "OCR provider 'onnx' not available:",
      'ONNX missing',
    );
    expect(debug).toHaveBeenCalledWith(
      "OCR provider 'tesseract' not available:",
      'Tesseract missing',
    );
  });

  test('should warn when the requested primary provider is unavailable', async () => {
    const debug = vi
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const onnx = createMockProvider({
      name: 'onnx',
      checkDependencies: vi.fn().mockResolvedValue({
        available: false,
        error: 'ONNX missing',
        details: {},
      }),
    });
    const tesseract = createMockProvider({ name: 'tesseract' });
    const factory = new OCRFactory({
      provider: 'onnx',
      fallbackProviders: ['tesseract'],
    });
    (factory as any).initialized = true;
    factory.addProvider('onnx', onnx);
    factory.addProvider('tesseract', tesseract);

    const providers = await (factory as any).getAvailableProviderChain();

    expect(providers.map((provider: OCRProvider) => provider.name)).toEqual([
      'tesseract',
    ]);
    expect(warn).toHaveBeenCalledWith(
      "OCR provider 'onnx' not available:",
      'ONNX missing',
    );
    expect(debug).not.toHaveBeenCalled();
  });

  test('should ignore unavailable or failing fallback providers', async () => {
    const primary = createMockProvider({
      name: 'primary',
      performOCR: vi.fn().mockResolvedValue({
        text: '',
        confidence: 0,
        detections: [],
      }),
    });
    const unavailableFallback = createMockProvider({
      name: 'unavailable',
      checkDependencies: vi.fn().mockResolvedValue({
        available: false,
        details: {},
      }),
    });
    const failingFallback = createMockProvider({
      name: 'failing',
      checkDependencies: vi.fn().mockRejectedValue(new Error('boom')),
    });
    const factory = new OCRFactory({
      provider: 'primary',
      fallbackProviders: ['primary', 'missing', 'unavailable', 'failing'],
    });
    (factory as any).initialized = true;
    factory.addProvider('primary', primary);
    factory.addProvider('unavailable', unavailableFallback);
    factory.addProvider('failing', failingFallback);

    const result = await factory.performOCR([{ data: Buffer.alloc(128) }]);

    expect(result.text).toBe('');
    expect(unavailableFallback.performOCR).not.toHaveBeenCalled();
    expect(failingFallback.performOCR).not.toHaveBeenCalled();
  });

  test('should report provider info failures without throwing', async () => {
    const provider = createMockProvider({
      name: 'broken-info',
      checkCapabilities: vi.fn().mockRejectedValue(new Error('bad caps')),
    });
    const factory = new OCRFactory({ provider: 'broken-info' });
    (factory as any).initialized = true;
    factory.addProvider('broken-info', provider);

    const info = await factory.getProvidersInfo();

    expect(info).toEqual([
      {
        name: 'broken-info',
        available: false,
        dependencies: {
          available: false,
          error: 'bad caps',
          details: {},
        },
        capabilities: null,
      },
    ]);
  });

  test('should throw when no provider is available for non-empty OCR', async () => {
    const factory = new OCRFactory({ provider: 'missing' });
    (factory as any).initialized = true;

    await expect(
      factory.performOCR([{ data: Buffer.alloc(128) }]),
    ).rejects.toThrow('No OCR providers are available');
  });

  test('should return no languages when no provider is available', async () => {
    const factory = new OCRFactory({ provider: 'missing' });
    (factory as any).initialized = true;

    await expect(factory.getSupportedLanguages()).resolves.toEqual([]);
    await expect(factory.isOCRAvailable()).resolves.toBe(false);
  });

  test('should remove providers and run cleanup', async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    const provider = createMockProvider({ name: 'custom', cleanup });
    const factory = new OCRFactory();
    (factory as any).initialized = true;
    factory.addProvider('custom', provider);

    await factory.removeProvider('custom');

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(factory.getAvailableProviderNames()).toEqual([]);
  });

  test('resetOCRFactory should ignore async cleanup failures', () => {
    const factory = getOCR();
    factory.cleanup = vi.fn().mockRejectedValue(new Error('cleanup failed'));

    expect(() => resetOCRFactory()).not.toThrow();
    expect(getOCR()).not.toBe(factory);
  });
});
