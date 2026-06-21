[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRProvider

# Interface: OCRProvider

Defined in: [src/shared/types.ts:156](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L156)

Core interface that all OCR providers must implement.

This interface standardizes OCR operations across different engines
providing a consistent API for text extraction.

## Properties

### name

> `readonly` **name**: `string`

Defined in: [src/shared/types.ts:158](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L158)

Provider name identifier

## Methods

### performOCR()

> **performOCR**(`images`, `options?`): `Promise`\<[`OCRResult`](OCRResult.md)\>

Defined in: [src/shared/types.ts:163](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L163)

Perform OCR on image data

#### Parameters

##### images

[`OCRImage`](OCRImage.md)[]

##### options?

[`OCROptions`](OCROptions.md)

#### Returns

`Promise`\<[`OCRResult`](OCRResult.md)\>

***

### checkDependencies()

> **checkDependencies**(): `Promise`\<[`DependencyCheckResult`](DependencyCheckResult.md)\>

Defined in: [src/shared/types.ts:168](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L168)

Check if provider dependencies are available

#### Returns

`Promise`\<[`DependencyCheckResult`](DependencyCheckResult.md)\>

***

### checkCapabilities()

> **checkCapabilities**(): `Promise`\<[`OCRCapabilities`](OCRCapabilities.md)\>

Defined in: [src/shared/types.ts:173](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L173)

Get provider capabilities

#### Returns

`Promise`\<[`OCRCapabilities`](OCRCapabilities.md)\>

***

### getSupportedLanguages()

> **getSupportedLanguages**(): `string`[]

Defined in: [src/shared/types.ts:178](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L178)

Get supported languages

#### Returns

`string`[]

***

### cleanup()?

> `optional` **cleanup**(): `Promise`\<`void`\>

Defined in: [src/shared/types.ts:183](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L183)

Clean up provider resources (optional)

#### Returns

`Promise`\<`void`\>
