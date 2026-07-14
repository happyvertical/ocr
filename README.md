---
id: ocr
title: "@happyvertical/ocr: Optical Character Recognition"
sidebar_label: "@happyvertical/ocr"
sidebar_position: 7
---

# @happyvertical/ocr

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Node-first OCR interface with multi-provider support for server-side text extraction. Part of the HAVE SDK ecosystem.

## Overview

The `@happyvertical/ocr` package provides a unified Node.js interface for Optical Character Recognition (OCR) operations with provider selection and fallback support. It abstracts away the complexities of different OCR engines while keeping the package entrypoint optimized for server-side use.

## Features

- **Multi-Provider Support**: Unified API for Tesseract.js, ONNX-based OCR engines (PaddleOCR PP-OCRv4), HappyVertical AI-backed vision OCR, and served Unlimited-OCR endpoints
- **Intelligent Fallback**: Automatic provider selection and fallback when primary providers fail
- **Node-First Runtime**: Optimized for Node.js packages and server-side workflows
- **Environment Detection**: Selects compatible OCR providers based on runtime environment
- **Performance Optimized**: Lazy loading of OCR dependencies and efficient provider management
- **Multi-Language Support**: 60+ languages with Tesseract, 7 core languages with ONNX
- **Bounding Box Detection**: Word-level and line-level text positioning
- **Confidence Scoring**: Per-detection and overall confidence scores (0-100)
- **Format Support**: PNG, JPEG, BMP, TIFF, raw RGB data, base64 strings, and served vision-model OCR

## Installation

```bash
# npm
npm install @happyvertical/ocr

# pnpm
pnpm add @happyvertical/ocr

# yarn
yarn add @happyvertical/ocr

# bun
bun add @happyvertical/ocr
```

The package includes Tesseract.js by default, ONNX provider support through `@gutenye/ocr-node`, LLM-backed OCR through `@happyvertical/ai`, and a Node.js provider for Baidu Unlimited-OCR when you run it behind SGLang or Bifrost.

## Quick Start

```typescript
import { getOCR } from '@happyvertical/ocr';

// Get OCR factory with automatic provider selection
const ocrFactory = getOCR();

// Check if OCR is available
const available = await ocrFactory.isOCRAvailable();

if (available) {
  // Perform OCR on images
  const result = await ocrFactory.performOCR([
    { data: imageBuffer, format: 'png' }
  ], {
    language: 'eng',
    confidenceThreshold: 70
  });

  console.log('Extracted text:', result.text);
  console.log('Confidence:', result.confidence);
  console.log('Processing time:', result.metadata?.processingTime);
}
```

## Providers

### ONNX Provider (Node.js)

High-accuracy OCR using PaddleOCR PP-OCRv4 models with ONNX Runtime. Provides superior performance on both printed and handwritten text.

**Features:**
- Highest accuracy (90%+)
- Precise bounding box detection
- Automatic image format conversion
- 7 core languages: English, Chinese (Simplified/Traditional), Japanese, Korean, French, German

**Example:**
```typescript
import { getOCR } from '@happyvertical/ocr';

const onnxFactory = getOCR({ provider: 'onnx' });

const result = await onnxFactory.performOCR(images, {
  language: 'eng',
  confidenceThreshold: 85
});

// Access bounding box information
result.detections?.forEach((detection) => {
  console.log(`Text: "${detection.text}"`);
  console.log(`Confidence: ${detection.confidence.toFixed(1)}%`);
  if (detection.boundingBox) {
    const bbox = detection.boundingBox;
    console.log(`Position: (${bbox.x}, ${bbox.y})`);
    console.log(`Size: ${bbox.width}x${bbox.height}`);
  }
});
```

### Tesseract Provider (Node.js)

Node.js OCR using Tesseract.js with wide language support. Good accuracy on machine-printed text.

**Features:**
- 60+ languages with automatic model downloading
- Word-level confidence scores and bounding boxes
- Zero system dependencies
- Works in Node.js without system OCR dependencies

**Example:**
```typescript
import { getOCR } from '@happyvertical/ocr';

const tesseractFactory = getOCR({ provider: 'tesseract' });

const result = await tesseractFactory.performOCR(images, {
  language: 'eng+chi_sim+jpn',  // Multi-language support
  confidenceThreshold: 70
});

console.log('Text extracted:', result.text);
console.log('Languages used:', result.metadata?.language);
```

### LLM OCR Provider (Node.js)

Vision-model OCR uses `@happyvertical/ai` for the underlying AI client so OCR callers do not instantiate model SDKs directly.

**Features:**
- Works with HappyVertical AI-compatible vision models
- Supports API-key or OAuth2-backed endpoints
- Can return plain text or structured text segments

**Example:**
```typescript
import { LiteLLMProvider } from '@happyvertical/ocr';

const provider = new LiteLLMProvider({
  baseUrl: 'https://litellm.example.com/v1',
  apiKey: process.env.HAVE_OCR_LITELLM_API_KEY,
  model: 'gpt-4o',
  outputMode: 'structured'
});

const result = await provider.performOCR(images, {
  language: 'eng'
});

console.log('LLM OCR completed:', result.text);
```

### Unlimited-OCR Provider (Node.js, Served GPU Model)

The `unlimited-ocr` provider talks to a running [baidu/Unlimited-OCR](https://huggingface.co/baidu/Unlimited-OCR) SGLang server through an OpenAI-compatible chat completions endpoint. The endpoint can be direct, or routed through HappyVertical Bifrost.

When `transport` is not set explicitly, the provider stays on `direct` whenever an Unlimited-OCR base URL is supplied (`baseUrl` or `HAVE_OCR_UNLIMITED_BASE_URL`); Bifrost is inferred from Bifrost environment variables only when no direct endpoint is configured.

This provider does not load the Python/CUDA model inside Node.js. You still need to run the model server somewhere with GPU access.

**Direct SGLang endpoint:**

```bash
export HAVE_OCR_PROVIDER=unlimited-ocr
export HAVE_OCR_UNLIMITED_TRANSPORT=direct
export HAVE_OCR_UNLIMITED_BASE_URL=http://127.0.0.1:10000
export HAVE_OCR_UNLIMITED_MODEL=Unlimited-OCR
```

```typescript
import { getOCR } from '@happyvertical/ocr';

const ocr = getOCR({ provider: 'unlimited-ocr' });

const result = await ocr.performOCR([
  { data: imageBuffer, format: 'png' }
]);

console.log(result.text);
```

**Bifrost-routed endpoint:**

```bash
export HAVE_OCR_PROVIDER=unlimited-ocr
export HAVE_OCR_UNLIMITED_TRANSPORT=bifrost
export HAVE_OCR_BIFROST_BASE_URL=https://bifrost.happyvertical.com
export HAVE_OCR_BIFROST_API_KEY=<virtual-key>
export HAVE_OCR_BIFROST_MODEL=Unlimited-OCR
```

```typescript
import { getOCR } from '@happyvertical/ocr';

const ocr = getOCR({
  provider: 'unlimited-ocr',
  fallbackProviders: ['tesseract']
});

const result = await ocr.performOCR([
  { data: imageBuffer, format: 'png' }
]);
```

**Programmatic configuration:**

```typescript
import { getOCR } from '@happyvertical/ocr';

const ocr = getOCR({
  provider: 'unlimited-ocr',
  providerConfig: {
    'unlimited-ocr': {
      transport: 'direct',
      baseUrl: 'http://127.0.0.1:10000',
      model: 'Unlimited-OCR',
      stream: true
    }
  }
});
```

**Running the model server:**

Follow the Unlimited-OCR model card for the exact SGLang environment. The documented server shape is:

```bash
python -m sglang.launch_server \
  --model baidu/Unlimited-OCR \
  --served-model-name Unlimited-OCR \
  --attention-backend fa3 \
  --page-size 1 \
  --mem-fraction-static 0.8 \
  --context-length 32768 \
  --enable-custom-logit-processor \
  --disable-overlap-schedule \
  --skip-server-warmup \
  --host 0.0.0.0 \
  --port 10000
```

For best long-document output, Unlimited-OCR also supports SGLang's `custom_logit_processor`. If your gateway/proxy injects it, no library config is needed. If the client must send it, set `HAVE_OCR_UNLIMITED_CUSTOM_LOGIT_PROCESSOR` to the value produced by:

```bash
python - <<'PY'
from sglang.srt.sampling.custom_logit_processor import DeepseekOCRNoRepeatNGramLogitProcessor
print(DeepseekOCRNoRepeatNGramLogitProcessor.to_str())
PY
```

The provider sends `gundam` image mode for one image and `base` image mode for multi-image/multi-page requests by default. Override with `HAVE_OCR_UNLIMITED_IMAGE_MODE=base` or `gundam` when needed.

## Advanced Usage

### Multi-Language OCR

```typescript
import { getOCR } from '@happyvertical/ocr';

const ocrFactory = getOCR();

// Single language
const englishResult = await ocrFactory.performOCR(images, {
  language: 'eng'
});

// Multiple languages
const multilingualResult = await ocrFactory.performOCR(images, {
  language: 'eng+chi_sim+jpn+kor',
  confidenceThreshold: 60
});

// Get supported languages from active provider
const supportedLanguages = await ocrFactory.getSupportedLanguages();
console.log('Supported languages:', supportedLanguages);
```

### Environment-Specific Configuration

```typescript
import { getOCR } from '@happyvertical/ocr';

const ocrFactory = getOCR();
const environment = ocrFactory.getEnvironment();

if (environment !== 'node') {
  throw new Error('@happyvertical/ocr is intended for Node.js runtimes');
}

const result = await ocrFactory.performOCR(images, {
  language: 'eng',
  confidenceThreshold: 85
});
```

### Custom Factory Configuration

```typescript
import { OCRFactory } from '@happyvertical/ocr';

const customFactory = new OCRFactory({
  provider: 'onnx',                   // Force specific provider
  fallbackProviders: ['tesseract'],   // Fallback chain
  defaultOptions: {
    language: 'eng',
    confidenceThreshold: 85
  }
});

// Check provider availability and capabilities
const providersInfo = await customFactory.getProvidersInfo();
for (const provider of providersInfo) {
  console.log(`Provider: ${provider.name}`);
  console.log(`Available: ${provider.available}`);
  if (provider.capabilities) {
    console.log(`Languages: ${provider.capabilities.supportedLanguages.length}`);
    console.log(`Bounding boxes: ${provider.capabilities.hasBoundingBoxes}`);
  }
}

// Process images
try {
  const result = await customFactory.performOCR(images);
  console.log('OCR completed:', result.text);
} finally {
  await customFactory.cleanup();  // Important for resource cleanup
}
```

### Error Handling

```typescript
import {
  OCRError,
  OCRDependencyError,
  OCRProcessingError,
  OCRUnsupportedError
} from '@happyvertical/ocr';

try {
  const result = await ocrFactory.performOCR(images);
  console.log('OCR successful:', result.text);
} catch (error) {
  if (error instanceof OCRDependencyError) {
    console.error('OCR dependencies missing:', error.message);
    console.log('Provider:', error.provider);
  } else if (error instanceof OCRProcessingError) {
    console.error('OCR processing failed:', error.message);
    console.log('Provider:', error.provider);
    console.log('Context:', error.context);
  } else if (error instanceof OCRUnsupportedError) {
    console.error('Unsupported operation:', error.message);
    console.log('Provider:', error.provider);
  } else if (error instanceof OCRError) {
    console.error('General OCR error:', error.message);
  }
}
```

## Writing Custom Providers

You can extend the OCR package with custom providers by implementing the `OCRProvider` interface:

```typescript
import {
  OCRProvider,
  OCRImage,
  OCRResult,
  OCROptions,
  DependencyCheckResult,
  OCRCapabilities
} from '@happyvertical/ocr';

export class MyOCRProvider implements OCRProvider {
  readonly name = 'my-provider';

  async performOCR(images: OCRImage[], options?: OCROptions): Promise<OCRResult> {
    // Process images and return OCR results
    const text = ''; // Extract text from images
    const confidence = 0; // Calculate average confidence
    const detections = []; // Optional: word/line detections with bounding boxes

    return {
      text,
      confidence,
      detections,
      metadata: {
        provider: this.name,
        processingTime: 0,
        language: options?.language || 'eng',
        detectionCount: detections.length
      }
    };
  }

  async checkDependencies(): Promise<DependencyCheckResult> {
    // Check if provider is available
    try {
      // Verify dependencies are installed and functional
      return {
        available: true,
        details: { version: '1.0.0' }
      };
    } catch (error: any) {
      return {
        available: false,
        error: error.message,
        details: { reason: 'Dependencies not installed' }
      };
    }
  }

  async checkCapabilities(): Promise<OCRCapabilities> {
    // Return provider capabilities
    return {
      supportedLanguages: ['eng', 'spa', 'fra'],
      supportedFormats: ['png', 'jpeg'],
      maxImageSize: 4096,
      hasBoundingBoxes: true,
      hasConfidenceScores: true
    };
  }

  getSupportedLanguages(): string[] {
    return ['eng', 'spa', 'fra'];
  }

  async cleanup?(): Promise<void> {
    // Optional: Clean up resources
    // Terminate workers, clear caches, etc.
  }
}
```

### Registering Custom Providers

```typescript
import { OCRFactory } from '@happyvertical/ocr';
import { MyOCRProvider } from './my-ocr-provider';

// Create factory with custom provider
const factory = new OCRFactory({
  provider: 'my-provider'
});

// Manually register provider
factory.addProvider('my-provider', new MyOCRProvider());

// Use custom provider
const result = await factory.performOCR(images);
```

### Implementation Guidelines

When implementing a custom provider:

1. **Handle dependencies gracefully**: Never throw during `checkDependencies()` - return `{ available: false }` instead
2. **Support multiple image formats**: Handle Buffer, Uint8Array, string (base64), and raw RGB data
3. **Provide meaningful error messages**: Use typed error classes (OCRDependencyError, OCRProcessingError, OCRUnsupportedError)
4. **Implement cleanup methods**: Properly dispose of resources (workers, instances, caches)
5. **Validate image formats**: Check file signatures before processing
6. **Calculate confidence scores**: Provide meaningful confidence scores (0-100)
7. **Return bounding boxes**: Include precise text positioning when available
8. **Map language codes**: Support common language code formats

## Development

Common local quality checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm docs:api
pnpm docs:api:check
pnpm test:coverage
pnpm pack --dry-run
```

Coverage uses Vitest V8 coverage and gates statements, branches, functions, and
lines at `80/65/80/80`.

Releases publish to the public npm registry (`registry.npmjs.org`) through the
Changesets publish workflow. The workflow expects the repository `NPM_TOKEN`
secret to be configured.

## API Reference

Generated API reference documentation lives in `docs/api/` and is built from
public JSDoc comments with TypeDoc.

```bash
pnpm docs:api
pnpm docs:api:check
```

`docs:api:check` regenerates the API reference and fails if `docs/api/` is not
up to date.

## License

MIT
