**@happyvertical/ocr**

***

# @happyvertical/ocr

@happyvertical/ocr - Node-first OCR interface with multi-provider support

This package provides a unified interface for Optical Character Recognition (OCR)
operations across Node.js providers with intelligent fallback and environment detection.

## Features

- **Multi-Provider Support**: Tesseract.js, ONNX Runtime (PaddleOCR), and HappyVertical AI-backed vision OCR
- **Intelligent Fallback**: Automatic provider selection with graceful degradation
- **Node-First**: Optimized for server-side packages and workflows
- **Rich Output**: Text extraction with confidence scores and bounding boxes
- **Multi-Language**: Support for 100+ languages depending on provider
- **TypeScript**: Full type safety with comprehensive interfaces

## Quick Start

```typescript
import { getOCR } from '@happyvertical/ocr';

// Get OCR factory with automatic provider selection
const ocrFactory = getOCR();

// Process images
const result = await ocrFactory.performOCR([
  { data: fs.readFileSync('document.png') }
], {
  language: 'eng',
  confidenceThreshold: 70
});

console.log('Extracted text:', result.text);
console.log('Confidence:', result.confidence + '%');
```

## Provider Selection

```typescript
// Automatic selection (recommended)
const factory = getOCR();

// Specific provider with fallback
const factory = getOCR({
  provider: 'onnx',
  fallbackProviders: ['tesseract']
});

// Check what's available
const providers = await getAvailableProviders();
console.log('Available providers:', providers);
```

## Multi-Language Support

```typescript
const result = await factory.performOCR(images, {
  language: 'eng+chi_sim+jpn' // English + Chinese + Japanese
});

// Access detailed detections with bounding boxes
result.detections?.forEach(detection => {
  console.log(`"${detection.text}" at (${detection.boundingBox?.x}, ${detection.boundingBox?.y})`);
});
```

## Classes

- [LiteLLMProvider](classes/LiteLLMProvider.md)
- [UnlimitedOCRProvider](classes/UnlimitedOCRProvider.md)
- [OCRFactory](classes/OCRFactory.md)
- [OCRError](classes/OCRError.md)
- [OCRDependencyError](classes/OCRDependencyError.md)
- [OCRUnsupportedError](classes/OCRUnsupportedError.md)
- [OCRProcessingError](classes/OCRProcessingError.md)

## Interfaces

- [OAuth2Config](interfaces/OAuth2Config.md)
- [LiteLLMProviderConfig](interfaces/LiteLLMProviderConfig.md)
- [UnlimitedOCRProviderConfig](interfaces/UnlimitedOCRProviderConfig.md)
- [OCROptions](interfaces/OCROptions.md)
- [OCRImage](interfaces/OCRImage.md)
- [OCRResult](interfaces/OCRResult.md)
- [DependencyCheckResult](interfaces/DependencyCheckResult.md)
- [OCRCapabilities](interfaces/OCRCapabilities.md)
- [OCRProvider](interfaces/OCRProvider.md)
- [OCRFactoryOptions](interfaces/OCRFactoryOptions.md)
- [OCRProviderInfo](interfaces/OCRProviderInfo.md)
- [ProviderCompatibility](interfaces/ProviderCompatibility.md)
- [LiteLLMProviderOptions](interfaces/LiteLLMProviderOptions.md)

## Type Aliases

- [LiteLLMOutputMode](type-aliases/LiteLLMOutputMode.md)
- [LiteLLMAuthType](type-aliases/LiteLLMAuthType.md)
- [UnlimitedOCRTransport](type-aliases/UnlimitedOCRTransport.md)
- [UnlimitedOCRImageMode](type-aliases/UnlimitedOCRImageMode.md)
- [OCREnvironment](type-aliases/OCREnvironment.md)

## Functions

- [getOCR](functions/getOCR.md)
- [resetOCRFactory](functions/resetOCRFactory.md)
- [getAvailableProviders](functions/getAvailableProviders.md)
- [isProviderAvailable](functions/isProviderAvailable.md)
- [getProviderInfo](functions/getProviderInfo.md)

## References

### default

Renames and re-exports [getOCR](functions/getOCR.md)
