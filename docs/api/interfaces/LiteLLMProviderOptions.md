[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / LiteLLMProviderOptions

# Interface: LiteLLMProviderOptions

Defined in: [src/shared/types.ts:300](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L300)

LiteLLM provider configuration options

Configuration for the LiteLLM OCR provider which uses vision-capable LLMs
for text extraction. Works with any OpenAI-compatible API endpoint.

## Example

```typescript
const options: LiteLLMProviderOptions = {
  baseUrl: 'http://localhost:4000/v1',
  apiKey: 'your-api-key',
  model: 'deepseek-ocr',
  outputMode: 'structured'
};
```

## Properties

### baseUrl?

> `optional` **baseUrl?**: `string`

Defined in: [src/shared/types.ts:302](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L302)

LiteLLM/DeepSeek API base URL

***

### apiKey?

> `optional` **apiKey?**: `string`

Defined in: [src/shared/types.ts:304](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L304)

API key for authentication

***

### model?

> `optional` **model?**: `string`

Defined in: [src/shared/types.ts:306](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L306)

Model to use (e.g., 'deepseek-chat', 'gpt-4o')

***

### outputMode?

> `optional` **outputMode?**: `"simple"` \| `"structured"`

Defined in: [src/shared/types.ts:308](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L308)

Output mode: 'simple' for text-only, 'structured' for JSON with confidence

***

### systemPrompt?

> `optional` **systemPrompt?**: `string`

Defined in: [src/shared/types.ts:310](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L310)

Custom system prompt (overrides default)

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [src/shared/types.ts:312](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L312)

Request timeout in milliseconds
