[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / LiteLLMOutputMode

# Type Alias: LiteLLMOutputMode

> **LiteLLMOutputMode** = `"simple"` \| `"structured"`

Defined in: [src/node/litellm.ts:71](https://github.com/happyvertical/ocr/blob/main/src/node/litellm.ts#L71)

Output mode for LiteLLM OCR
- 'simple': Returns raw text with 100% confidence (LLMs don't provide OCR confidence)
- 'structured': Prompts LLM to return JSON with estimated confidence scores
