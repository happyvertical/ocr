[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRFactoryOptions

# Interface: OCRFactoryOptions

Defined in: [src/shared/types.ts:188](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L188)

OCR factory configuration options

## Properties

### provider?

> `optional` **provider?**: `string`

Defined in: [src/shared/types.ts:190](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L190)

Primary provider to use ('auto', 'tesseract', 'onnx', 'litellm')

***

### fallbackProviders?

> `optional` **fallbackProviders?**: `string`[]

Defined in: [src/shared/types.ts:192](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L192)

Fallback providers to try if primary fails

***

### defaultOptions?

> `optional` **defaultOptions?**: [`OCROptions`](OCROptions.md)

Defined in: [src/shared/types.ts:194](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L194)

Default options for OCR operations

***

### providerConfig?

> `optional` **providerConfig?**: `Record`\<`string`, `any`\>

Defined in: [src/shared/types.ts:201](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L201)

Reserved for provider-specific configuration.

Built-in providers currently use constructor options or environment
variables for provider-specific configuration.
