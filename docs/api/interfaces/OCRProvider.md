[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRProvider

# Interface: OCRProvider

Defined in: [src/shared/types.ts:155](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L155)

Core interface that all OCR providers must implement.

This interface standardizes OCR operations across different engines
providing a consistent API for text extraction.

## Properties

### name

> `readonly` **name**: `string`

Defined in: [src/shared/types.ts:157](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L157)

Provider name identifier

## Methods

### performOCR()

> **performOCR**(`images`, `options?`): `Promise`\<[`OCRResult`](OCRResult.md)\>

Defined in: [src/shared/types.ts:162](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L162)

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

Defined in: [src/shared/types.ts:167](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L167)

Check if provider dependencies are available

#### Returns

`Promise`\<[`DependencyCheckResult`](DependencyCheckResult.md)\>

***

### checkCapabilities()

> **checkCapabilities**(): `Promise`\<[`OCRCapabilities`](OCRCapabilities.md)\>

Defined in: [src/shared/types.ts:172](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L172)

Get provider capabilities

#### Returns

`Promise`\<[`OCRCapabilities`](OCRCapabilities.md)\>

***

### getSupportedLanguages()

> **getSupportedLanguages**(): `string`[]

Defined in: [src/shared/types.ts:177](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L177)

Get supported languages

#### Returns

`string`[]

***

### cleanup()?

> `optional` **cleanup**(): `Promise`\<`void`\>

Defined in: [src/shared/types.ts:182](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L182)

Clean up provider resources (optional)

#### Returns

`Promise`\<`void`\>
