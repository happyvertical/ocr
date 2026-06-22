[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRFactoryOptions

# Interface: OCRFactoryOptions

Defined in: [src/shared/types.ts:201](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L201)

OCR factory configuration options

## Properties

### provider?

> `optional` **provider?**: `string`

Defined in: [src/shared/types.ts:203](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L203)

Primary provider to use ('auto', 'tesseract', 'onnx', 'litellm')

***

### fallbackProviders?

> `optional` **fallbackProviders?**: `string`[]

Defined in: [src/shared/types.ts:205](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L205)

Fallback providers to try if primary fails

***

### defaultOptions?

> `optional` **defaultOptions?**: [`OCROptions`](OCROptions.md)

Defined in: [src/shared/types.ts:207](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L207)

Default options for OCR operations

***

### providerConfig?

> `optional` **providerConfig?**: `Record`\<`string`, `any`\>

Defined in: [src/shared/types.ts:214](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L214)

Reserved for provider-specific configuration.

Built-in providers currently use constructor options or environment
variables for provider-specific configuration.
