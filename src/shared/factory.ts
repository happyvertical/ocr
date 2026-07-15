/**
 * @happyvertical/ocr - OCR factory for managing multiple providers with intelligent fallback
 *
 * This module provides the main factory class and utility functions for
 * OCR operations with automatic provider selection, fallback handling,
 * and environment detection.
 */

import { loadEnvConfig } from '@happyvertical/utils';
import type {
  OCREnvironment,
  OCRFactoryOptions,
  OCRImage,
  OCROptions,
  OCRProvider,
  OCRProviderInfo,
  OCRResult,
} from './types';
import { OCRDependencyError, OCRError } from './types';

/**
 * Detect the current runtime environment (Node.js, browser, or unknown).
 *
 * Uses feature detection to determine where the code is running,
 * which affects provider availability and capabilities.
 *
 * @returns The detected environment type
 *
 * @example
 * ```typescript
 * const env = detectEnvironment();
 * console.log('Running in:', env); // 'node', 'browser', or 'unknown'
 * ```
 *
 * @internal
 */
function detectEnvironment(): OCREnvironment {
  // Use globalThis to avoid TypeScript issues with global objects
  const globalObj = globalThis as any;

  if (
    typeof globalObj.window !== 'undefined' &&
    typeof globalObj.document !== 'undefined'
  ) {
    return 'browser';
  }
  if (globalObj.process?.versions?.node) {
    return 'node';
  }
  return 'unknown';
}

/**
 * Main factory class for managing OCR providers with intelligent selection and fallback.
 *
 * The OCRFactory handles the complexities of multiple OCR providers by:
 * - Automatically detecting the best available provider for the current environment
 * - Providing seamless fallback when primary providers fail or are unavailable
 * - Offering a unified API that abstracts away provider-specific differences
 * - Managing provider lifecycles including initialization and cleanup
 * - Handling dependency checking and providing detailed error information
 *
 * @example Basic usage with auto provider selection
 * ```typescript
 * const factory = new OCRFactory();
 * const result = await factory.performOCR([
 *   { data: imageBuffer, format: 'png' }
 * ]);
 * console.log('Extracted text:', result.text);
 * ```
 *
 * @example Specific provider with fallback
 * ```typescript
 * const factory = new OCRFactory({
 *   provider: 'onnx',
 *   fallbackProviders: ['tesseract'],
 *   defaultOptions: {
 *     language: 'eng',
 *     confidenceThreshold: 80
 *   }
 * });
 * ```
 *
 * @example Multi-language processing
 * ```typescript
 * const factory = new OCRFactory({
 *   defaultOptions: {
 *     language: 'eng+chi_sim+jpn'
 *   }
 * });
 *
 * const result = await factory.performOCR(images);
 * if (result.detections) {
 *   for (const detection of result.detections) {
 *     console.log(`"${detection.text}" (${detection.confidence}%)`);
 *   }
 * }
 * ```
 */
export class OCRFactory {
  private providers = new Map<string, OCRProvider>();
  private primaryProvider = 'auto';
  private fallbackProviders: string[] = [];
  private defaultOptions?: OCROptions;
  private providerConfig: Record<string, unknown>;
  private environment: OCREnvironment;
  private initialized = false;

  /**
   * Create a new OCR factory instance.
   *
   * Environment variables are loaded using the pattern HAVE_OCR_{FIELD}:
   * - HAVE_OCR_PROVIDER → provider
   * - HAVE_OCR_LANGUAGE → defaultOptions.language
   * - HAVE_OCR_CONFIDENCE_THRESHOLD → defaultOptions.confidenceThreshold
   * - HAVE_OCR_TIMEOUT → defaultOptions.timeout
   *
   * User-provided options always take precedence over environment variables.
   *
   * @param options - Configuration options for the factory
   *
   * @example Auto-selection with defaults
   * ```typescript
   * const factory = new OCRFactory();
   * ```
   *
   * @example Specific provider configuration
   * ```typescript
   * const factory = new OCRFactory({
   *   provider: 'tesseract',
   *   fallbackProviders: ['onnx'],
   *   defaultOptions: {
   *     language: 'eng',
   *     confidenceThreshold: 75
   *   }
   * });
   * ```
   *
   * @example Using environment variables
   * ```typescript
   * // Set: HAVE_OCR_PROVIDER=onnx
   * // Set: HAVE_OCR_LANGUAGE=eng+chi_sim
   * // Set: HAVE_OCR_CONFIDENCE_THRESHOLD=85
   * const factory = new OCRFactory(); // Uses env vars
   * ```
   */
  constructor(options: OCRFactoryOptions = {}) {
    // Load configuration from environment variables
    // We define a flattened config interface for loading env vars
    interface FlatOCRConfig {
      provider?: string;
      language?: string;
      confidenceThreshold?: number;
      timeout?: number;
    }

    // Create flattened user options for env loading
    // Only include fields that are actually defined to avoid blocking env var loading
    const flatUserOptions: FlatOCRConfig = {};
    if (options.provider !== undefined) {
      flatUserOptions.provider = options.provider;
    }
    if (options.defaultOptions?.language !== undefined) {
      flatUserOptions.language = options.defaultOptions.language;
    }
    if (options.defaultOptions?.confidenceThreshold !== undefined) {
      flatUserOptions.confidenceThreshold =
        options.defaultOptions.confidenceThreshold;
    }
    if (options.defaultOptions?.timeout !== undefined) {
      flatUserOptions.timeout = options.defaultOptions.timeout;
    }

    // Load config with env vars merged
    const config = loadEnvConfig<FlatOCRConfig>(flatUserOptions, {
      packageName: 'ocr',
      schema: {
        provider: 'string',
        language: 'string',
        confidenceThreshold: 'number',
        timeout: 'number',
      },
    });

    // Set provider configuration
    this.primaryProvider = config.provider || 'auto';
    this.fallbackProviders = options.fallbackProviders || [];
    this.providerConfig = options.providerConfig || {};

    // Build defaultOptions from both config and user options
    // User-provided defaultOptions take precedence over env vars
    // Use explicit undefined checks to handle falsy values like 0
    this.defaultOptions = {
      ...(config.language !== undefined && { language: config.language }),
      ...(config.confidenceThreshold !== undefined && {
        confidenceThreshold: config.confidenceThreshold,
      }),
      ...(config.timeout !== undefined && { timeout: config.timeout }),
      ...options.defaultOptions,
    };

    this.environment = detectEnvironment();
  }

  /**
   * Initialize available OCR providers based on the current environment.
   *
   * This method dynamically imports and instantiates providers that are
   * compatible with the current runtime environment. It's called automatically
   * when OCR operations are first requested.
   *
   * @private
   */
  public async initializeProviders(): Promise<void> {
    if (this.initialized) return;

    try {
      // Always try to load Tesseract.js (works in both environments)
      try {
        const { TesseractProvider } = await import('../node/tesseract.js');
        this.providers.set('tesseract', new TesseractProvider());
      } catch {
        // Ignore if tesseract provider fails to load
      }

      // Environment-specific providers
      if (this.environment === 'node') {
        // ONNX provider (Node.js only) with package-owned native dependencies
        try {
          const { ONNXGutenyeProvider } = await import(
            '../node/onnx-gutenye.js'
          );
          this.providers.set('onnx', new ONNXGutenyeProvider());
        } catch {
          // Ignore if ONNX provider fails to load
        }

        // LiteLLM provider (Node.js only) - uses vision LLMs for OCR
        try {
          const { LiteLLMProvider } = await import('../node/litellm.js');
          const providerOptions = this.providerConfig.litellm as
            | ConstructorParameters<typeof LiteLLMProvider>[0]
            | undefined;
          this.providers.set('litellm', new LiteLLMProvider(providerOptions));
        } catch {
          // Ignore if LiteLLM provider fails to load
        }

        // Unlimited-OCR provider (Node.js only) - uses served GPU inference
        try {
          const { UnlimitedOCRProvider } = await import(
            '../node/unlimited-ocr.js'
          );
          const providerOptions = (this.providerConfig['unlimited-ocr'] ??
            this.providerConfig.unlimitedOCR) as
            | ConstructorParameters<typeof UnlimitedOCRProvider>[0]
            | undefined;
          this.providers.set(
            'unlimited-ocr',
            new UnlimitedOCRProvider(providerOptions),
          );
        } catch {
          // Ignore if Unlimited-OCR provider fails to load
        }
      } else if (this.environment === 'browser') {
        // Browser-specific providers
        try {
          const { WebOCRProvider } = await import('../browser/web-ocr.js');
          this.providers.set('web-ocr', new WebOCRProvider());
        } catch {
          // Ignore if Web OCR provider fails to load
        }
      }

      this.initialized = true;
    } catch (error) {
      console.warn('OCR factory initialization failed:', error);
      this.initialized = true; // Continue with whatever providers loaded
    }
  }

  /**
   * Get the best available OCR provider for the current environment.
   *
   * Evaluates all available providers based on:
   * - User preference (if a specific provider was requested)
   * - Provider availability (dependency checks)
   * - Environment compatibility
   * - Default priority order for auto-selection
   *
   * @returns Promise resolving to the best provider, or null if none are available
   *
   * @example
   * ```typescript
   * const provider = await factory.getBestProvider();
   * if (provider) {
   *   console.log('Using provider:', provider.name);
   * } else {
   *   console.log('No OCR providers available');
   * }
   * ```
   */
  async getBestProvider(): Promise<OCRProvider | null> {
    const providers = await this.getAvailableProviderChain();
    if (providers.length > 0) {
      return providers[0];
    }

    console.warn(
      'No OCR providers are available. OCR functionality will be disabled.',
    );
    return null;
  }

  /**
   * Get the default provider priority order based on environment.
   *
   * Returns an ordered list of provider names to try when using
   * auto-selection. Providers are ordered by expected performance
   * and reliability in each environment.
   *
   * @returns Array of provider names in priority order
   * @private
   */
  private getDefaultProviderPriority(): string[] {
    if (this.environment === 'node') {
      // LiteLLM last since it's API-based (network latency, costs money)
      return ['onnx', 'tesseract', 'unlimited-ocr', 'litellm'];
    }
    if (this.environment === 'browser') {
      return ['tesseract', 'web-ocr'];
    }
    return ['tesseract'];
  }

  private getProviderPriority(): string[] {
    const priority =
      this.primaryProvider === 'auto'
        ? [...this.getDefaultProviderPriority(), ...this.fallbackProviders]
        : [this.primaryProvider, ...this.fallbackProviders];

    return [...new Set(priority)];
  }

  private async getAvailableProviderChain(): Promise<OCRProvider[]> {
    await this.initializeProviders();

    const providerPriority = this.getProviderPriority();
    const providerChecks = providerPriority.map(async (providerName) => {
      const provider = this.providers.get(providerName);
      if (!provider)
        return { name: providerName, available: false, provider: null };

      try {
        const deps = await provider.checkDependencies();
        return {
          name: providerName,
          available: deps.available,
          provider: deps.available ? provider : null,
          error: deps.error,
        };
      } catch (error) {
        return { name: providerName, available: false, provider: null, error };
      }
    });

    const results = await Promise.all(providerChecks);
    const hasAvailableProvider = results.some((result) => result.available);
    const providers: OCRProvider[] = [];

    for (const providerName of providerPriority) {
      const result = results.find((r) => r.name === providerName);
      if (result?.available && result.provider) {
        providers.push(result.provider);
        continue;
      }

      if (
        result &&
        !result.available &&
        result.error &&
        this.shouldLogUnavailableProvider(providerName, hasAvailableProvider)
      ) {
        const log =
          this.primaryProvider !== 'auto' &&
          providerName === this.primaryProvider
            ? console.warn
            : console.debug;
        log(`OCR provider '${providerName}' not available:`, result.error);
      }
    }

    return providers;
  }

  /**
   * Perform OCR processing on one or more images.
   *
   * This is the main method for extracting text from images. It automatically
   * selects the best available provider and handles fallback if the primary
   * provider fails or returns empty results.
   *
   * @param images - Array of images to process
   * @param options - Optional processing configuration (merged with factory defaults)
   * @returns Promise resolving to OCR results with extracted text and metadata
   *
   * @throws {OCRDependencyError} When no OCR providers are available
   * @throws {OCRError} When processing fails across all providers
   *
   * @example Basic text extraction
   * ```typescript
   * const result = await factory.performOCR([
   *   { data: fs.readFileSync('document.png') }
   * ]);
   * console.log('Text:', result.text);
   * console.log('Confidence:', result.confidence);
   * ```
   *
   * @example Advanced processing with options
   * ```typescript
   * const result = await factory.performOCR(images, {
   *   language: 'eng+chi_sim',
   *   confidenceThreshold: 80
   * });
   *
   * // Access detailed detections
   * if (result.detections) {
   *   result.detections.forEach(detection => {
   *     if (detection.boundingBox) {
   *       console.log(`"${detection.text}" at (${detection.boundingBox.x}, ${detection.boundingBox.y})`);
   *     }
   *   });
   * }
   * ```
   *
   * @example Handling errors
   * ```typescript
   * try {
   *   const result = await factory.performOCR(images);
   *   console.log('Success:', result.text);
   * } catch (error) {
   *   if (error instanceof OCRDependencyError) {
   *     console.log('No OCR providers available');
   *   } else if (error instanceof OCRError) {
   *     console.log('OCR processing failed:', error.message);
   *   }
   * }
   * ```
   */
  async performOCR(
    images: OCRImage[],
    options?: OCROptions,
  ): Promise<OCRResult> {
    if (!images || images.length === 0) {
      return {
        text: '',
        confidence: 0,
        detections: [],
        metadata: {
          processingTime: 0,
          provider: 'none',
        },
      };
    }

    // Merge default options with provided options
    const mergedOptions = { ...this.defaultOptions, ...options };

    const providers = await this.getAvailableProviderChain();
    if (providers.length === 0) {
      throw new OCRDependencyError('none', 'No OCR providers are available');
    }

    let firstEmptyResult: OCRResult | null = null;
    let firstProviderName: string | undefined;
    let lastError: unknown;

    for (const provider of providers) {
      firstProviderName ??= provider.name;

      try {
        const startTime = Date.now();
        const result = await provider.performOCR(images, mergedOptions);
        const processingTime = Date.now() - startTime;

        // Enhance result with metadata
        result.metadata = {
          ...result.metadata,
          processingTime,
          provider: provider.name,
          language: mergedOptions.language,
        };

        if (result.text?.trim()) {
          if (provider.name !== firstProviderName) {
            console.info(
              `OCR fallback to '${provider.name}' provider succeeded`,
            );
            result.metadata.fallbackFrom = firstProviderName;
          }

          return result;
        }

        firstEmptyResult ??= result;
      } catch (error) {
        console.error(`OCR provider '${provider.name}' failed:`, error);
        lastError = error;
      }
    }

    if (firstEmptyResult) {
      return firstEmptyResult;
    }

    throw new OCRError(
      `OCR processing failed: ${(lastError as Error)?.message ?? 'all providers failed'}`,
      firstProviderName,
      lastError,
    );
  }

  /**
   * Get detailed information about all OCR providers.
   *
   * Returns comprehensive information about each provider including
   * availability status, dependency checks, and capabilities. Useful
   * for diagnostics and provider selection.
   *
   * @returns Promise resolving to array of provider information
   *
   * @example
   * ```typescript
   * const providers = await factory.getProvidersInfo();
   * providers.forEach(provider => {
   *   console.log(`${provider.name}: ${provider.available ? 'Available' : 'Unavailable'}`);
   *   if (!provider.available) {
   *     console.log(`  Error: ${provider.dependencies.error}`);
   *   } else if (provider.capabilities) {
   *     console.log(`  Languages: ${provider.capabilities.supportedLanguages.length}`);
   *     console.log(`  Bounding boxes: ${provider.capabilities.hasBoundingBoxes}`);
   *   }
   * });
   * ```
   */
  async getProvidersInfo(): Promise<OCRProviderInfo[]> {
    await this.initializeProviders();

    const info: OCRProviderInfo[] = [];

    for (const [name, provider] of this.providers) {
      try {
        const [dependencies, capabilities] = await Promise.all([
          provider.checkDependencies(),
          provider.checkCapabilities(),
        ]);

        info.push({
          name,
          available: dependencies.available,
          dependencies,
          capabilities,
        });
      } catch (error) {
        info.push({
          name,
          available: false,
          dependencies: {
            available: false,
            error: (error as Error).message,
            details: {},
          },
          capabilities: null,
        });
      }
    }

    return info;
  }

  /**
   * Check if OCR functionality is available in the current environment.
   *
   * This is a quick check to determine if any OCR provider can be used
   * before attempting to process images.
   *
   * @returns Promise resolving to true if OCR is available, false otherwise
   *
   * @example
   * ```typescript
   * if (await factory.isOCRAvailable()) {
   *   const result = await factory.performOCR(images);
   * } else {
   *   console.log('OCR not available - check dependencies');
   * }
   * ```
   */
  async isOCRAvailable(): Promise<boolean> {
    const provider = await this.getBestProvider();
    return provider !== null;
  }

  /**
   * Get array of supported language codes from the best available provider.
   *
   * Returns language codes that can be used in the language option
   * for OCR processing. The list depends on which provider is selected.
   *
   * @returns Promise resolving to array of language codes
   *
   * @example
   * ```typescript
   * const languages = await factory.getSupportedLanguages();
   * console.log('Supported languages:', languages);
   * // ['eng', 'chi_sim', 'chi_tra', 'jpn', 'kor', 'fra', ...]
   *
   * // Use in OCR processing
   * const result = await factory.performOCR(images, {
   *   language: languages.includes('jpn') ? 'eng+jpn' : 'eng'
   * });
   * ```
   */
  async getSupportedLanguages(): Promise<string[]> {
    const provider = await this.getBestProvider();
    if (!provider) {
      return [];
    }

    return provider.getSupportedLanguages();
  }

  /**
   * Clean up all OCR providers and release their resources.
   *
   * This method should be called when the factory is no longer needed
   * to properly dispose of resources like workers, models, and memory.
   * Failure to call cleanup may result in resource leaks.
   *
   * @example
   * ```typescript
   * const factory = new OCRFactory();
   * try {
   *   const result = await factory.performOCR(images);
   *   // Process results...
   * } finally {
   *   await factory.cleanup();
   * }
   * ```
   *
   * @example Using in Node.js process cleanup
   * ```typescript
   * const factory = new OCRFactory();
   *
   * process.on('SIGINT', async () => {
   *   await factory.cleanup();
   *   process.exit(0);
   * });
   * ```
   */
  async cleanup(): Promise<void> {
    const cleanupPromises: Promise<void>[] = [];

    for (const provider of this.providers.values()) {
      if (provider.cleanup) {
        cleanupPromises.push(provider.cleanup());
      }
    }

    if (cleanupPromises.length > 0) {
      await Promise.allSettled(cleanupPromises);
    }
  }

  /**
   * Add a custom OCR provider to the factory.
   *
   * Allows extending the factory with additional OCR providers
   * beyond the built-in ones. Custom providers must implement
   * the OCRProvider interface.
   *
   * @param name - Unique name for the provider
   * @param provider - Provider instance implementing OCRProvider interface
   *
   * @example
   * ```typescript
   * class CustomOCRProvider implements OCRProvider {
   *   readonly name = 'custom';
   *   // ... implement required methods
   * }
   *
   * const factory = new OCRFactory();
   * factory.addProvider('custom', new CustomOCRProvider());
   *
   * // Now can use custom provider
   * const customFactory = new OCRFactory({ provider: 'custom' });
   * ```
   */
  addProvider(name: string, provider: OCRProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Remove an OCR provider from the factory.
   *
   * Removes the provider and calls its cleanup method if available
   * to properly dispose of resources.
   *
   * @param name - Name of the provider to remove
   *
   * @example
   * ```typescript
   * await factory.removeProvider('custom');
   * // Provider cleaned up and removed
   * ```
   */
  async removeProvider(name: string): Promise<void> {
    const provider = this.providers.get(name);
    if (provider?.cleanup) {
      await provider.cleanup();
    }
    this.providers.delete(name);
  }

  /**
   * Get array of provider names that have been loaded in the current environment.
   *
   * This returns the names of providers that were successfully imported,
   * but doesn't guarantee they have all required dependencies available.
   * Use getProvidersInfo() for detailed availability information.
   *
   * @returns Array of loaded provider names
   *
   * @example
   * ```typescript
   * const providerNames = factory.getAvailableProviderNames();
   * console.log('Loaded providers:', providerNames);
   * // ['tesseract', 'onnx'] in Node.js
   * // ['tesseract', 'web-ocr'] in browser
   * ```
   */
  getAvailableProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get the detected runtime environment.
   *
   * @returns The environment where the factory is running
   *
   * @example
   * ```typescript
   * const env = factory.getEnvironment();
   * if (env === 'node') {
   *   console.log('Running in Node.js - full provider support');
   * } else if (env === 'browser') {
   *   console.log('Running in browser - limited to web-compatible providers');
   * }
   * ```
   */
  getEnvironment(): OCREnvironment {
    return this.environment;
  }

  private shouldLogUnavailableProvider(
    providerName: string,
    hasAvailableProvider: boolean,
  ): boolean {
    if (
      this.primaryProvider !== 'auto' &&
      providerName === this.primaryProvider
    ) {
      return true;
    }

    return !hasAvailableProvider;
  }
}

// Global factory instance
let globalOCRFactory: OCRFactory | null = null;

/**
 * Get or create an OCR factory instance with automatic provider selection.
 *
 * This is the recommended way to get an OCR factory. When called without
 * options, it returns a global singleton for efficient resource usage.
 * When called with options, it creates a new instance with custom configuration.
 *
 * Environment variables are loaded using the pattern HAVE_OCR_{FIELD}:
 * - HAVE_OCR_PROVIDER → provider
 * - HAVE_OCR_LANGUAGE → defaultOptions.language
 * - HAVE_OCR_CONFIDENCE_THRESHOLD → defaultOptions.confidenceThreshold
 * - HAVE_OCR_TIMEOUT → defaultOptions.timeout
 *
 * User-provided options always take precedence over environment variables.
 *
 * @param options - Optional factory configuration. If provided, creates a new instance.
 * @returns OCR factory instance ready for use
 *
 * @example Simple usage (global singleton)
 * ```typescript
 * import { getOCR } from '@happyvertical/ocr';
 *
 * const factory = getOCR();
 * const result = await factory.performOCR(images);
 * ```
 *
 * @example Custom configuration (new instance)
 * ```typescript
 * const factory = getOCR({
 *   provider: 'onnx',
 *   fallbackProviders: ['tesseract'],
 *   defaultOptions: {
 *     language: 'eng+chi_sim',
 *     confidenceThreshold: 80
 *   }
 * });
 * ```
 *
 * @example Using environment variables
 * ```typescript
 * // Set: HAVE_OCR_PROVIDER=onnx
 * // Set: HAVE_OCR_LANGUAGE=eng+chi_sim
 * // Set: HAVE_OCR_CONFIDENCE_THRESHOLD=85
 * const factory = getOCR(); // Uses env vars for defaults
 * ```
 *
 * @example Environment-specific usage
 * ```typescript
 * const factory = getOCR();
 * const env = factory.getEnvironment();
 *
 * if (env !== 'node') {
 *   throw new Error('@happyvertical/ocr is intended for Node.js runtimes');
 * }
 *
 * const result = await factory.performOCR(images, { language: 'eng+chi_sim' });
 * ```
 */
export function getOCR(options?: OCRFactoryOptions): OCRFactory {
  // If specific options are provided, create a new instance
  if (options && Object.keys(options).length > 0) {
    return new OCRFactory(options);
  }

  // Otherwise, use the global singleton
  if (!globalOCRFactory) {
    globalOCRFactory = new OCRFactory();
  }
  return globalOCRFactory;
}

/**
 * Reset the global OCR factory instance.
 *
 * Cleans up the current global factory and forces creation of a new one
 * on the next call to getOCR(). Primarily useful for testing or when
 * you need to ensure a fresh factory state.
 *
 * @example
 * ```typescript
 * // In test setup/teardown
 * afterEach(async () => {
 *   resetOCRFactory();
 * });
 * ```
 *
 * @example Force re-initialization
 * ```typescript
 * resetOCRFactory();
 * const factory = getOCR(); // Creates new factory instance
 * ```
 */
export function resetOCRFactory(): void {
  if (globalOCRFactory) {
    globalOCRFactory.cleanup().catch(() => {
      // Ignore cleanup errors during reset
    });
  }
  globalOCRFactory = null;
}

/**
 * Get list of OCR provider names available in the current environment.
 *
 * This function provides a quick way to check which providers can be loaded
 * without creating a full factory instance. The returned providers may still
 * require dependency checks before use.
 *
 * @returns Promise resolving to array of available provider names
 *
 * @example
 * ```typescript
 * const providers = await getAvailableProviders();
 * console.log('Available providers:', providers);
 * // Node.js: ['tesseract', 'onnx']
 * // Browser: ['tesseract', 'web-ocr']
 *
 * if (providers.includes('onnx')) {
 *   console.log('High-accuracy ONNX OCR is available');
 * }
 * ```
 */
export async function getAvailableProviders(): Promise<string[]> {
  const factory = getOCR();
  await factory.initializeProviders(); // Access private method for initialization
  return factory.getAvailableProviderNames();
}

/**
 * Check if a specific OCR provider is available and ready to use.
 *
 * Performs a complete availability check including dependency validation
 * for the specified provider.
 *
 * @param providerName - Name of the provider to check
 * @returns Promise resolving to true if provider is available and functional
 *
 * @example
 * ```typescript
 * const onnxAvailable = await isProviderAvailable('onnx');
 * const tesseractAvailable = await isProviderAvailable('tesseract');
 *
 * console.log('ONNX available:', onnxAvailable);
 * console.log('Tesseract available:', tesseractAvailable);
 *
 * // Choose provider based on availability
 * const provider = onnxAvailable ? 'onnx' : 'tesseract';
 * const factory = getOCR({ provider });
 * ```
 */
export async function isProviderAvailable(
  providerName: string,
): Promise<boolean> {
  const factory = getOCR();
  const providersInfo = await factory.getProvidersInfo();
  const providerInfo = providersInfo.find((p) => p.name === providerName);
  return providerInfo?.available ?? false;
}

/**
 * Get detailed information about a specific OCR provider.
 *
 * Returns comprehensive information about the provider including
 * availability, dependencies, and capabilities. Returns null if
 * the provider doesn't exist.
 *
 * @param providerName - Name of the provider to query
 * @returns Promise resolving to provider information or null if not found
 *
 * @example
 * ```typescript
 * const info = await getProviderInfo('tesseract');
 * if (info) {
 *   console.log('Provider available:', info.available);
 *   if (info.available && info.capabilities) {
 *     console.log('Supported languages:', info.capabilities.supportedLanguages.length);
 *     console.log('Has bounding boxes:', info.capabilities.hasBoundingBoxes);
 *   } else {
 *     console.log('Dependency error:', info.dependencies.error);
 *   }
 * } else {
 *   console.log('Provider "tesseract" not found');
 * }
 * ```
 *
 * @example Compare multiple providers
 * ```typescript
 * const providers = ['tesseract', 'onnx', 'web-ocr'];
 * for (const name of providers) {
 *   const info = await getProviderInfo(name);
 *   if (info?.available && info.capabilities) {
 *     console.log(`${name}: ${info.capabilities.supportedLanguages.length} languages`);
 *   }
 * }
 * ```
 */
export async function getProviderInfo(
  providerName: string,
): Promise<OCRProviderInfo | null> {
  const factory = getOCR();
  const providersInfo = await factory.getProvidersInfo();
  return providersInfo.find((p) => p.name === providerName) ?? null;
}
