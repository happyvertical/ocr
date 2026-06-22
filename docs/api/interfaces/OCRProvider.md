[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRProvider

# Interface: OCRProvider

Defined in: [src/shared/types.ts:168](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L168)

Core interface that all OCR providers must implement.

This interface standardizes OCR operations across different engines
providing a consistent API for text extraction.

## Properties

### name

> `readonly` **name**: `string`

Defined in: [src/shared/types.ts:170](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L170)

Provider name identifier

## Methods

### performOCR()

> **performOCR**(`images`, `options?`): `Promise`\<[`OCRResult`](OCRResult.md)\>

Defined in: [src/shared/types.ts:175](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L175)

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

Defined in: [src/shared/types.ts:180](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L180)

Check if provider dependencies are available

#### Returns

`Promise`\<[`DependencyCheckResult`](DependencyCheckResult.md)\>

***

### checkCapabilities()

> **checkCapabilities**(): `Promise`\<[`OCRCapabilities`](OCRCapabilities.md)\>

Defined in: [src/shared/types.ts:185](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L185)

Get provider capabilities

#### Returns

`Promise`\<[`OCRCapabilities`](OCRCapabilities.md)\>

***

### getSupportedLanguages()

> **getSupportedLanguages**(): `string`[]

Defined in: [src/shared/types.ts:190](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L190)

Get supported languages

#### Returns

`string`[]

***

### cleanup()?

> `optional` **cleanup**(): `Promise`\<`void`\>

Defined in: [src/shared/types.ts:195](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L195)

Clean up provider resources (optional)

#### Returns

`Promise`\<`void`\>
