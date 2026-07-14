[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRFactory

# Class: OCRFactory

Defined in: [src/shared/factory.ts:100](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L100)

Main factory class for managing OCR providers with intelligent selection and fallback.

The OCRFactory handles the complexities of multiple OCR providers by:
- Automatically detecting the best available provider for the current environment
- Providing seamless fallback when primary providers fail or are unavailable
- Offering a unified API that abstracts away provider-specific differences
- Managing provider lifecycles including initialization and cleanup
- Handling dependency checking and providing detailed error information

## Examples

**Basic usage with auto provider selection**

```typescript
const factory = new OCRFactory();
const result = await factory.performOCR([
  { data: imageBuffer, format: 'png' }
]);
console.log('Extracted text:', result.text);
```

**Specific provider with fallback**

```typescript
const factory = new OCRFactory({
  provider: 'onnx',
  fallbackProviders: ['tesseract'],
  defaultOptions: {
    language: 'eng',
    confidenceThreshold: 80
  }
});
```

**Multi-language processing**

```typescript
const factory = new OCRFactory({
  defaultOptions: {
    language: 'eng+chi_sim+jpn'
  }
});

const result = await factory.performOCR(images);
if (result.detections) {
  for (const detection of result.detections) {
    console.log(`"${detection.text}" (${detection.confidence}%)`);
  }
}
```

## Constructors

### Constructor

> **new OCRFactory**(`options?`): `OCRFactory`

Defined in: [src/shared/factory.ts:147](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L147)

Create a new OCR factory instance.

Environment variables are loaded using the pattern HAVE_OCR_{FIELD}:
- HAVE_OCR_PROVIDER → provider
- HAVE_OCR_LANGUAGE → defaultOptions.language
- HAVE_OCR_CONFIDENCE_THRESHOLD → defaultOptions.confidenceThreshold
- HAVE_OCR_TIMEOUT → defaultOptions.timeout

User-provided options always take precedence over environment variables.

#### Parameters

##### options?

[`OCRFactoryOptions`](../interfaces/OCRFactoryOptions.md) = `{}`

Configuration options for the factory

#### Returns

`OCRFactory`

#### Examples

**Auto-selection with defaults**

```typescript
const factory = new OCRFactory();
```

**Specific provider configuration**

```typescript
const factory = new OCRFactory({
  provider: 'tesseract',
  fallbackProviders: ['onnx'],
  defaultOptions: {
    language: 'eng',
    confidenceThreshold: 75
  }
});
```

**Using environment variables**

```typescript
// Set: HAVE_OCR_PROVIDER=onnx
// Set: HAVE_OCR_LANGUAGE=eng+chi_sim
// Set: HAVE_OCR_CONFIDENCE_THRESHOLD=85
const factory = new OCRFactory(); // Uses env vars
```

## Methods

### getBestProvider()

> **getBestProvider**(): `Promise`\<[`OCRProvider`](../interfaces/OCRProvider.md) \| `null`\>

Defined in: [src/shared/factory.ts:303](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L303)

Get the best available OCR provider for the current environment.

Evaluates all available providers based on:
- User preference (if a specific provider was requested)
- Provider availability (dependency checks)
- Environment compatibility
- Default priority order for auto-selection

#### Returns

`Promise`\<[`OCRProvider`](../interfaces/OCRProvider.md) \| `null`\>

Promise resolving to the best provider, or null if none are available

#### Example

```typescript
const provider = await factory.getBestProvider();
if (provider) {
  console.log('Using provider:', provider.name);
} else {
  console.log('No OCR providers available');
}
```

***

### performOCR()

> **performOCR**(`images`, `options?`): `Promise`\<[`OCRResult`](../interfaces/OCRResult.md)\>

Defined in: [src/shared/factory.ts:450](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L450)

Perform OCR processing on one or more images.

This is the main method for extracting text from images. It automatically
selects the best available provider and handles fallback if the primary
provider fails or returns empty results.

#### Parameters

##### images

[`OCRImage`](../interfaces/OCRImage.md)[]

Array of images to process

##### options?

[`OCROptions`](../interfaces/OCROptions.md)

Optional processing configuration (merged with factory defaults)

#### Returns

`Promise`\<[`OCRResult`](../interfaces/OCRResult.md)\>

Promise resolving to OCR results with extracted text and metadata

#### Throws

When no OCR providers are available

#### Throws

When processing fails across all providers

#### Examples

**Basic text extraction**

```typescript
const result = await factory.performOCR([
  { data: fs.readFileSync('document.png') }
]);
console.log('Text:', result.text);
console.log('Confidence:', result.confidence);
```

**Advanced processing with options**

```typescript
const result = await factory.performOCR(images, {
  language: 'eng+chi_sim',
  confidenceThreshold: 80
});

// Access detailed detections
if (result.detections) {
  result.detections.forEach(detection => {
    if (detection.boundingBox) {
      console.log(`"${detection.text}" at (${detection.boundingBox.x}, ${detection.boundingBox.y})`);
    }
  });
}
```

**Handling errors**

```typescript
try {
  const result = await factory.performOCR(images);
  console.log('Success:', result.text);
} catch (error) {
  if (error instanceof OCRDependencyError) {
    console.log('No OCR providers available');
  } else if (error instanceof OCRError) {
    console.log('OCR processing failed:', error.message);
  }
}
```

***

### getProvidersInfo()

> **getProvidersInfo**(): `Promise`\<[`OCRProviderInfo`](../interfaces/OCRProviderInfo.md)[]\>

Defined in: [src/shared/factory.ts:546](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L546)

Get detailed information about all OCR providers.

Returns comprehensive information about each provider including
availability status, dependency checks, and capabilities. Useful
for diagnostics and provider selection.

#### Returns

`Promise`\<[`OCRProviderInfo`](../interfaces/OCRProviderInfo.md)[]\>

Promise resolving to array of provider information

#### Example

```typescript
const providers = await factory.getProvidersInfo();
providers.forEach(provider => {
  console.log(`${provider.name}: ${provider.available ? 'Available' : 'Unavailable'}`);
  if (!provider.available) {
    console.log(`  Error: ${provider.dependencies.error}`);
  } else if (provider.capabilities) {
    console.log(`  Languages: ${provider.capabilities.supportedLanguages.length}`);
    console.log(`  Bounding boxes: ${provider.capabilities.hasBoundingBoxes}`);
  }
});
```

***

### isOCRAvailable()

> **isOCRAvailable**(): `Promise`\<`boolean`\>

Defined in: [src/shared/factory.ts:598](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L598)

Check if OCR functionality is available in the current environment.

This is a quick check to determine if any OCR provider can be used
before attempting to process images.

#### Returns

`Promise`\<`boolean`\>

Promise resolving to true if OCR is available, false otherwise

#### Example

```typescript
if (await factory.isOCRAvailable()) {
  const result = await factory.performOCR(images);
} else {
  console.log('OCR not available - check dependencies');
}
```

***

### getSupportedLanguages()

> **getSupportedLanguages**(): `Promise`\<`string`[]\>

Defined in: [src/shared/factory.ts:623](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L623)

Get array of supported language codes from the best available provider.

Returns language codes that can be used in the language option
for OCR processing. The list depends on which provider is selected.

#### Returns

`Promise`\<`string`[]\>

Promise resolving to array of language codes

#### Example

```typescript
const languages = await factory.getSupportedLanguages();
console.log('Supported languages:', languages);
// ['eng', 'chi_sim', 'chi_tra', 'jpn', 'kor', 'fra', ...]

// Use in OCR processing
const result = await factory.performOCR(images, {
  language: languages.includes('jpn') ? 'eng+jpn' : 'eng'
});
```

***

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Defined in: [src/shared/factory.ts:660](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L660)

Clean up all OCR providers and release their resources.

This method should be called when the factory is no longer needed
to properly dispose of resources like workers, models, and memory.
Failure to call cleanup may result in resource leaks.

#### Returns

`Promise`\<`void`\>

#### Examples

```typescript
const factory = new OCRFactory();
try {
  const result = await factory.performOCR(images);
  // Process results...
} finally {
  await factory.cleanup();
}
```

**Using in Node.js process cleanup**

```typescript
const factory = new OCRFactory();

process.on('SIGINT', async () => {
  await factory.cleanup();
  process.exit(0);
});
```

***

### addProvider()

> **addProvider**(`name`, `provider`): `void`

Defined in: [src/shared/factory.ts:698](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L698)

Add a custom OCR provider to the factory.

Allows extending the factory with additional OCR providers
beyond the built-in ones. Custom providers must implement
the OCRProvider interface.

#### Parameters

##### name

`string`

Unique name for the provider

##### provider

[`OCRProvider`](../interfaces/OCRProvider.md)

Provider instance implementing OCRProvider interface

#### Returns

`void`

#### Example

```typescript
class CustomOCRProvider implements OCRProvider {
  readonly name = 'custom';
  // ... implement required methods
}

const factory = new OCRFactory();
factory.addProvider('custom', new CustomOCRProvider());

// Now can use custom provider
const customFactory = new OCRFactory({ provider: 'custom' });
```

***

### removeProvider()

> **removeProvider**(`name`): `Promise`\<`void`\>

Defined in: [src/shared/factory.ts:716](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L716)

Remove an OCR provider from the factory.

Removes the provider and calls its cleanup method if available
to properly dispose of resources.

#### Parameters

##### name

`string`

Name of the provider to remove

#### Returns

`Promise`\<`void`\>

#### Example

```typescript
await factory.removeProvider('custom');
// Provider cleaned up and removed
```

***

### getAvailableProviderNames()

> **getAvailableProviderNames**(): `string`[]

Defined in: [src/shared/factory.ts:741](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L741)

Get array of provider names that have been loaded in the current environment.

This returns the names of providers that were successfully imported,
but doesn't guarantee they have all required dependencies available.
Use getProvidersInfo() for detailed availability information.

#### Returns

`string`[]

Array of loaded provider names

#### Example

```typescript
const providerNames = factory.getAvailableProviderNames();
console.log('Loaded providers:', providerNames);
// ['tesseract', 'onnx'] in Node.js
// ['tesseract', 'web-ocr'] in browser
```

***

### getEnvironment()

> **getEnvironment**(): [`OCREnvironment`](../type-aliases/OCREnvironment.md)

Defined in: [src/shared/factory.ts:760](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L760)

Get the detected runtime environment.

#### Returns

[`OCREnvironment`](../type-aliases/OCREnvironment.md)

The environment where the factory is running

#### Example

```typescript
const env = factory.getEnvironment();
if (env === 'node') {
  console.log('Running in Node.js - full provider support');
} else if (env === 'browser') {
  console.log('Running in browser - limited to web-compatible providers');
}
```
