[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / UnlimitedOCRProvider

# Class: UnlimitedOCRProvider

Defined in: [src/node/unlimited-ocr.ts:256](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L256)

OCR provider for baidu/Unlimited-OCR when served by SGLang or vLLM.

## Implements

- [`OCRProvider`](../interfaces/OCRProvider.md)

## Constructors

### Constructor

> **new UnlimitedOCRProvider**(`config?`): `UnlimitedOCRProvider`

Defined in: [src/node/unlimited-ocr.ts:261](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L261)

#### Parameters

##### config?

[`UnlimitedOCRProviderConfig`](../interfaces/UnlimitedOCRProviderConfig.md) = `{}`

#### Returns

`UnlimitedOCRProvider`

## Properties

### name

> `readonly` **name**: `"unlimited-ocr"` = `'unlimited-ocr'`

Defined in: [src/node/unlimited-ocr.ts:257](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L257)

Provider name identifier

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`name`](../interfaces/OCRProvider.md#name)

## Methods

### performOCR()

> **performOCR**(`images`, `options?`): `Promise`\<[`OCRResult`](../interfaces/OCRResult.md)\>

Defined in: [src/node/unlimited-ocr.ts:327](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L327)

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

Defined in: [src/node/unlimited-ocr.ts:427](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L427)

Check if provider dependencies are available

#### Returns

`Promise`\<[`DependencyCheckResult`](../interfaces/DependencyCheckResult.md)\>

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`checkDependencies`](../interfaces/OCRProvider.md#checkdependencies)

***

### checkCapabilities()

> **checkCapabilities**(): `Promise`\<[`OCRCapabilities`](../interfaces/OCRCapabilities.md)\>

Defined in: [src/node/unlimited-ocr.ts:469](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L469)

Get provider capabilities

#### Returns

`Promise`\<[`OCRCapabilities`](../interfaces/OCRCapabilities.md)\>

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`checkCapabilities`](../interfaces/OCRProvider.md#checkcapabilities)

***

### getSupportedLanguages()

> **getSupportedLanguages**(): `string`[]

Defined in: [src/node/unlimited-ocr.ts:487](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L487)

Get supported languages

#### Returns

`string`[]

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`getSupportedLanguages`](../interfaces/OCRProvider.md#getsupportedlanguages)

***

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Defined in: [src/node/unlimited-ocr.ts:523](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L523)

Clean up provider resources (optional)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`cleanup`](../interfaces/OCRProvider.md#cleanup)
