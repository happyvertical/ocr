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

Primary provider to use ('auto', 'tesseract', 'onnx', 'litellm', 'unlimited-ocr', etc.)

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

> `optional` **providerConfig?**: `Record`\<`string`, `unknown`\>

Defined in: [src/shared/types.ts:211](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L211)

Provider-specific configuration.
