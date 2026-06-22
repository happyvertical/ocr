[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / LiteLLMProvider

# Class: LiteLLMProvider

Defined in: [src/node/litellm.ts:230](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L230)

LiteLLM OCR provider that uses vision-capable LLMs for text extraction.

This provider works with any OpenAI-compatible API endpoint, including:
- LiteLLM proxy servers
- DeepSeek API
- OpenAI API directly
- Azure OpenAI
- Any other OpenAI-compatible vision model endpoint

## Examples

**Basic usage with API key**

```typescript
const provider = new LiteLLMProvider({
  baseUrl: 'http://localhost:4000/v1',
  apiKey: 'your-api-key',
  model: 'deepseek-ocr'
});

const result = await provider.performOCR([{ data: imageBuffer }]);
console.log(result.text);
```

**With OAuth2 authentication (Keycloak)**

```typescript
const provider = new LiteLLMProvider({
  baseUrl: 'https://litellm.example.com/v1',
  authType: 'oauth2',
  oauth2: {
    tokenUrl: 'https://auth.example.com/realms/myrealm/protocol/openid-connect/token',
    clientId: 'my-client',
    clientSecret: 'my-secret'
  },
  model: 'deepseek-ocr'
});
```

**With structured output**

```typescript
const provider = new LiteLLMProvider({
  outputMode: 'structured',
  model: 'gpt-4o'
});

const result = await provider.performOCR(images);
console.log('Confidence:', result.confidence);
console.log('Segments:', result.detections);
```

## Implements

- [`OCRProvider`](../interfaces/OCRProvider.md)

## Constructors

### Constructor

> **new LiteLLMProvider**(`config?`): `LiteLLMProvider`

Defined in: [src/node/litellm.ts:239](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L239)

#### Parameters

##### config?

[`LiteLLMProviderConfig`](../interfaces/LiteLLMProviderConfig.md) = `{}`

#### Returns

`LiteLLMProvider`

## Properties

### name

> `readonly` **name**: `"litellm"` = `'litellm'`

Defined in: [src/node/litellm.ts:231](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L231)

Provider name identifier

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`name`](../interfaces/OCRProvider.md#name)

## Methods

### performOCR()

> **performOCR**(`images`, `options?`): `Promise`\<[`OCRResult`](../interfaces/OCRResult.md)\>

Defined in: [src/node/litellm.ts:502](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L502)

Extract visible text from one or more images using the configured vision model.

Images are sent as OpenAI-compatible multimodal message parts. Simple mode
returns plain text, while structured mode attempts to parse confidence
estimates from a JSON response.

#### Parameters

##### images

[`OCRImage`](../interfaces/OCRImage.md)[]

Images to process.

##### options?

[`OCROptions`](../interfaces/OCROptions.md)

OCR options such as language hints.

#### Returns

`Promise`\<[`OCRResult`](../interfaces/OCRResult.md)\>

Text, confidence, detections, and provider metadata.

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`performOCR`](../interfaces/OCRProvider.md#performocr)

***

### checkDependencies()

> **checkDependencies**(): `Promise`\<[`DependencyCheckResult`](../interfaces/DependencyCheckResult.md)\>

Defined in: [src/node/litellm.ts:703](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L703)

Check whether authentication and the underlying AI client can be initialized.

#### Returns

`Promise`\<[`DependencyCheckResult`](../interfaces/DependencyCheckResult.md)\>

Dependency status with auth mode, model, and endpoint details.

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`checkDependencies`](../interfaces/OCRProvider.md#checkdependencies)

***

### checkCapabilities()

> **checkCapabilities**(): `Promise`\<[`OCRCapabilities`](../interfaces/OCRCapabilities.md)\>

Defined in: [src/node/litellm.ts:773](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L773)

Describe the LiteLLM provider's OCR capabilities.

#### Returns

`Promise`\<[`OCRCapabilities`](../interfaces/OCRCapabilities.md)\>

Supported formats, language coverage, and provider-specific details.

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`checkCapabilities`](../interfaces/OCRProvider.md#checkcapabilities)

***

### getSupportedLanguages()

> **getSupportedLanguages**(): `string`[]

Defined in: [src/node/litellm.ts:795](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L795)

Get language codes that vision LLMs are expected to handle.

#### Returns

`string`[]

Common OCR language codes accepted as language hints.

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`getSupportedLanguages`](../interfaces/OCRProvider.md#getsupportedlanguages)

***

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Defined in: [src/node/litellm.ts:835](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L835)

Clear cached AI clients and OAuth2 tokens.

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`cleanup`](../interfaces/OCRProvider.md#cleanup)
