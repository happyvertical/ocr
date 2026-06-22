/**
 * @happyvertical/ocr - Node-first OCR interface with multi-provider support
 *
 * This package provides a unified interface for Optical Character Recognition (OCR)
 * operations across Node.js providers with intelligent fallback and environment detection.
 *
 * ## Features
 *
 * - **Multi-Provider Support**: Tesseract.js, ONNX Runtime (PaddleOCR), and HappyVertical AI-backed vision OCR
 * - **Intelligent Fallback**: Automatic provider selection with graceful degradation
 * - **Node-First**: Optimized for server-side packages and workflows
 * - **Rich Output**: Text extraction with confidence scores and bounding boxes
 * - **Multi-Language**: Support for 100+ languages depending on provider
 * - **TypeScript**: Full type safety with comprehensive interfaces
 *
 * ## Quick Start
 *
 * ```typescript
 * import { getOCR } from '@happyvertical/ocr';
 *
 * // Get OCR factory with automatic provider selection
 * const ocrFactory = getOCR();
 *
 * // Process images
 * const result = await ocrFactory.performOCR([
 *   { data: fs.readFileSync('document.png') }
 * ], {
 *   language: 'eng',
 *   confidenceThreshold: 70
 * });
 *
 * console.log('Extracted text:', result.text);
 * console.log('Confidence:', result.confidence + '%');
 * ```
 *
 * ## Provider Selection
 *
 * ```typescript
 * // Automatic selection (recommended)
 * const factory = getOCR();
 *
 * // Specific provider with fallback
 * const factory = getOCR({
 *   provider: 'onnx',
 *   fallbackProviders: ['tesseract']
 * });
 *
 * // Check what's available
 * const providers = await getAvailableProviders();
 * console.log('Available providers:', providers);
 * ```
 *
 * ## Multi-Language Support
 *
 * ```typescript
 * const result = await factory.performOCR(images, {
 *   language: 'eng+chi_sim+jpn' // English + Chinese + Japanese
 * });
 *
 * // Access detailed detections with bounding boxes
 * result.detections?.forEach(detection => {
 *   console.log(`"${detection.text}" at (${detection.boundingBox?.x}, ${detection.boundingBox?.y})`);
 * });
 * ```
 *
 * @packageDocumentation
 */

// Export main factory function and utilities
export {
  getAvailableProviders,
  getOCR,
  getProviderInfo,
  isProviderAvailable,
  OCRFactory,
  resetOCRFactory,
} from './shared/factory';

// Export all types
export * from './shared/types';

// Re-export the HappyVertical AI-backed provider for direct instantiation.

export type {
  LiteLLMAuthType,
  LiteLLMOutputMode,
  LiteLLMProviderConfig,
  OAuth2Config,
} from './node/litellm';
// Export LiteLLM provider for direct instantiation
export { LiteLLMProvider } from './node/litellm';

// Default export for convenience
export { getOCR as default } from './shared/factory';

/** @internal */
export const PACKAGE_VERSION_INITIALIZED = true;
