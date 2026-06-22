[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / LiteLLMProviderOptions

# Interface: LiteLLMProviderOptions

Defined in: [src/shared/types.ts:317](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L317)

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

Defined in: [src/shared/types.ts:319](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L319)

LiteLLM/DeepSeek API base URL

***

### apiKey?

> `optional` **apiKey?**: `string`

Defined in: [src/shared/types.ts:321](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L321)

API key for authentication

***

### model?

> `optional` **model?**: `string`

Defined in: [src/shared/types.ts:323](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L323)

Model to use (e.g., 'deepseek-chat', 'gpt-4o')

***

### outputMode?

> `optional` **outputMode?**: `"simple"` \| `"structured"`

Defined in: [src/shared/types.ts:325](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L325)

Output mode: 'simple' for text-only, 'structured' for JSON with confidence

***

### systemPrompt?

> `optional` **systemPrompt?**: `string`

Defined in: [src/shared/types.ts:327](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L327)

Custom system prompt (overrides default)

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [src/shared/types.ts:329](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L329)

Request timeout in milliseconds
