[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRFactoryOptions

# Interface: OCRFactoryOptions

Defined in: [src/shared/types.ts:189](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L189)

OCR factory configuration options

## Properties

### provider?

> `optional` **provider?**: `string`

Defined in: [src/shared/types.ts:191](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L191)

Primary provider to use ('auto', 'tesseract', 'onnx')

***

### fallbackProviders?

> `optional` **fallbackProviders?**: `string`[]

Defined in: [src/shared/types.ts:193](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L193)

Fallback providers to try if primary fails

***

### defaultOptions?

> `optional` **defaultOptions?**: [`OCROptions`](OCROptions.md)

Defined in: [src/shared/types.ts:195](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L195)

Default options for OCR operations

***

### providerConfig?

> `optional` **providerConfig?**: `Record`\<`string`, `any`\>

Defined in: [src/shared/types.ts:197](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L197)

Provider-specific configuration
