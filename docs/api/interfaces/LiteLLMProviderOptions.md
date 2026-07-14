[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / LiteLLMProviderOptions

# Interface: LiteLLMProviderOptions

Defined in: [src/shared/types.ts:314](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L314)

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

Defined in: [src/shared/types.ts:316](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L316)

LiteLLM/DeepSeek API base URL

***

### apiKey?

> `optional` **apiKey?**: `string`

Defined in: [src/shared/types.ts:318](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L318)

API key for authentication

***

### model?

> `optional` **model?**: `string`

Defined in: [src/shared/types.ts:320](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L320)

Model to use (e.g., 'deepseek-chat', 'gpt-4o')

***

### outputMode?

> `optional` **outputMode?**: `"simple"` \| `"structured"`

Defined in: [src/shared/types.ts:322](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L322)

Output mode: 'simple' for text-only, 'structured' for JSON with confidence

***

### systemPrompt?

> `optional` **systemPrompt?**: `string`

Defined in: [src/shared/types.ts:324](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L324)

Custom system prompt (overrides default)

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [src/shared/types.ts:326](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L326)

Request timeout in milliseconds
