[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / LiteLLMProviderConfig

# Interface: LiteLLMProviderConfig

Defined in: [src/node/litellm.ts:97](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L97)

Configuration for LiteLLM provider

## Properties

### baseUrl?

> `optional` **baseUrl?**: `string`

Defined in: [src/node/litellm.ts:99](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L99)

LiteLLM/DeepSeek API base URL

***

### authType?

> `optional` **authType?**: [`LiteLLMAuthType`](../type-aliases/LiteLLMAuthType.md)

Defined in: [src/node/litellm.ts:101](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L101)

Authentication type: 'api_key' (default) or 'oauth2'

***

### apiKey?

> `optional` **apiKey?**: `string`

Defined in: [src/node/litellm.ts:103](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L103)

API key for authentication (when authType is 'api_key')

***

### oauth2?

> `optional` **oauth2?**: [`OAuth2Config`](OAuth2Config.md)

Defined in: [src/node/litellm.ts:105](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L105)

OAuth2 configuration (when authType is 'oauth2')

***

### model?

> `optional` **model?**: `string`

Defined in: [src/node/litellm.ts:107](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L107)

Model to use (e.g., 'deepseek-chat', 'gpt-4o')

***

### outputMode?

> `optional` **outputMode?**: [`LiteLLMOutputMode`](../type-aliases/LiteLLMOutputMode.md)

Defined in: [src/node/litellm.ts:109](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L109)

Output mode: 'simple' for text-only, 'structured' for JSON with confidence

***

### systemPrompt?

> `optional` **systemPrompt?**: `string`

Defined in: [src/node/litellm.ts:111](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L111)

Custom system prompt for OCR (overrides default prompts)

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [src/node/litellm.ts:113](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L113)

Request timeout in milliseconds
