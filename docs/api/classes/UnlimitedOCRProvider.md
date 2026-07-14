[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / UnlimitedOCRProvider

# Class: UnlimitedOCRProvider

Defined in: [src/node/unlimited-ocr.ts:195](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L195)

OCR provider for baidu/Unlimited-OCR when served by SGLang.

## Implements

- [`OCRProvider`](../interfaces/OCRProvider.md)

## Constructors

### Constructor

> **new UnlimitedOCRProvider**(`config?`): `UnlimitedOCRProvider`

Defined in: [src/node/unlimited-ocr.ts:200](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L200)

#### Parameters

##### config?

[`UnlimitedOCRProviderConfig`](../interfaces/UnlimitedOCRProviderConfig.md) = `{}`

#### Returns

`UnlimitedOCRProvider`

## Properties

### name

> `readonly` **name**: `"unlimited-ocr"` = `'unlimited-ocr'`

Defined in: [src/node/unlimited-ocr.ts:196](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L196)

Provider name identifier

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`name`](../interfaces/OCRProvider.md#name)

## Methods

### performOCR()

> **performOCR**(`images`, `options?`): `Promise`\<[`OCRResult`](../interfaces/OCRResult.md)\>

Defined in: [src/node/unlimited-ocr.ts:262](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L262)

Perform OCR on image data

#### Parameters

##### images

[`OCRImage`](../interfaces/OCRImage.md)[]

##### options?

[`OCROptions`](../interfaces/OCROptions.md)

#### Returns

`Promise`\<[`OCRResult`](../interfaces/OCRResult.md)\>

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`performOCR`](../interfaces/OCRProvider.md#performocr)

***

### checkDependencies()

> **checkDependencies**(): `Promise`\<[`DependencyCheckResult`](../interfaces/DependencyCheckResult.md)\>

Defined in: [src/node/unlimited-ocr.ts:361](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L361)

Check if provider dependencies are available

#### Returns

`Promise`\<[`DependencyCheckResult`](../interfaces/DependencyCheckResult.md)\>

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`checkDependencies`](../interfaces/OCRProvider.md#checkdependencies)

***

### checkCapabilities()

> **checkCapabilities**(): `Promise`\<[`OCRCapabilities`](../interfaces/OCRCapabilities.md)\>

Defined in: [src/node/unlimited-ocr.ts:402](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L402)

Get provider capabilities

#### Returns

`Promise`\<[`OCRCapabilities`](../interfaces/OCRCapabilities.md)\>

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`checkCapabilities`](../interfaces/OCRProvider.md#checkcapabilities)

***

### getSupportedLanguages()

> **getSupportedLanguages**(): `string`[]

Defined in: [src/node/unlimited-ocr.ts:419](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L419)

Get supported languages

#### Returns

`string`[]

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`getSupportedLanguages`](../interfaces/OCRProvider.md#getsupportedlanguages)

***

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Defined in: [src/node/unlimited-ocr.ts:455](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L455)

Clean up provider resources (optional)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`cleanup`](../interfaces/OCRProvider.md#cleanup)
