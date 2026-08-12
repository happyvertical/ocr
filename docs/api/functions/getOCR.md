[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / getOCR

# Function: getOCR()

> **getOCR**(`options?`): [`OCRFactory`](../classes/OCRFactory.md)

Defined in: [src/shared/factory.ts:851](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L851)

Get or create an OCR factory instance with automatic provider selection.

This is the recommended way to get an OCR factory. When called without
options, it returns a global singleton for efficient resource usage.
When called with options, it creates a new instance with custom configuration.

Environment variables are loaded using the pattern HAVE_OCR_{FIELD}:
- HAVE_OCR_PROVIDER → provider
- HAVE_OCR_LANGUAGE → defaultOptions.language
- HAVE_OCR_CONFIDENCE_THRESHOLD → defaultOptions.confidenceThreshold
- HAVE_OCR_TIMEOUT → defaultOptions.timeout

User-provided options always take precedence over environment variables.

## Parameters

### options?

[`OCRFactoryOptions`](../interfaces/OCRFactoryOptions.md)

Optional factory configuration. If provided, creates a new instance.

## Returns

[`OCRFactory`](../classes/OCRFactory.md)

OCR factory instance ready for use

## Examples

**Simple usage (global singleton)**

```typescript
import { getOCR } from '@happyvertical/ocr';

const factory = getOCR();
const result = await factory.performOCR(images);
```

**Custom configuration (new instance)**

```typescript
const factory = getOCR({
  provider: 'onnx',
  fallbackProviders: ['tesseract'],
  defaultOptions: {
    language: 'eng+chi_sim',
    confidenceThreshold: 80
  }
});
```

**Using environment variables**

```typescript
// Set: HAVE_OCR_PROVIDER=onnx
// Set: HAVE_OCR_LANGUAGE=eng+chi_sim
// Set: HAVE_OCR_CONFIDENCE_THRESHOLD=85
const factory = getOCR(); // Uses env vars for defaults
```

**Environment-specific usage**

```typescript
const factory = getOCR();
const env = factory.getEnvironment();

if (env !== 'node') {
  throw new Error('@happyvertical/ocr is intended for Node.js runtimes');
}

const result = await factory.performOCR(images, { language: 'eng+chi_sim' });
```
