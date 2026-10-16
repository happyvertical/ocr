[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / PaddleOCRVLProvider

# Class: PaddleOCRVLProvider

Defined in: [src/node/paddleocr-vl.ts:125](https://github.com/happyvertical/ocr/blob/main/src/node/paddleocr-vl.ts#L125)

OCR provider for a PaddleOCR-VL `/layout-parsing` service.

Each image page is one request (`fileType: 1`); results are joined in
order. PNG and JPEG are sent unchanged; TIFF (every page), WebP, GIF, BMP
and raw pixel buffers are converted to PNG with `sharp` first. Requests are
not retried: a dropped connection can leave a GPU parse running.

## Implements

- [`OCRProvider`](../interfaces/OCRProvider.md)

## Constructors

### Constructor

> **new PaddleOCRVLProvider**(`config?`): `PaddleOCRVLProvider`

Defined in: [src/node/paddleocr-vl.ts:132](https://github.com/happyvertical/ocr/blob/main/src/node/paddleocr-vl.ts#L132)

#### Parameters

##### config?

[`PaddleOCRVLProviderConfig`](../interfaces/PaddleOCRVLProviderConfig.md) = `{}`

#### Returns

`PaddleOCRVLProvider`

## Properties

### name

> `readonly` **name**: `"paddleocr-vl"` = `'paddleocr-vl'`

Defined in: [src/node/paddleocr-vl.ts:126](https://github.com/happyvertical/ocr/blob/main/src/node/paddleocr-vl.ts#L126)

Provider name identifier

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`name`](../interfaces/OCRProvider.md#name)

## Methods

### performOCR()

> **performOCR**(`images`, `_options?`): `Promise`\<[`OCRResult`](../interfaces/OCRResult.md)\>

Defined in: [src/node/paddleocr-vl.ts:153](https://github.com/happyvertical/ocr/blob/main/src/node/paddleocr-vl.ts#L153)

`options` carries nothing this service uses: it needs no language hint,
and `options.timeout` is ignored because the factory fills it from
`HAVE_OCR_TIMEOUT`, a limit sized for local engines that would cut off a
cold start. Use the provider's own `timeout`.

#### Parameters

##### images

[`OCRImage`](../interfaces/OCRImage.md)[]

##### \_options?

[`OCROptions`](../interfaces/OCROptions.md)

#### Returns

`Promise`\<[`OCRResult`](../interfaces/OCRResult.md)\>

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`performOCR`](../interfaces/OCRProvider.md#performocr)

***

### checkDependencies()

> **checkDependencies**(): `Promise`\<[`DependencyCheckResult`](../interfaces/DependencyCheckResult.md)\>

Defined in: [src/node/paddleocr-vl.ts:199](https://github.com/happyvertical/ocr/blob/main/src/node/paddleocr-vl.ts#L199)

Configuration only. The service is not probed: a proxy `/health` success
does not mean the model is loaded.

#### Returns

`Promise`\<[`DependencyCheckResult`](../interfaces/DependencyCheckResult.md)\>

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`checkDependencies`](../interfaces/OCRProvider.md#checkdependencies)

***

### checkCapabilities()

> **checkCapabilities**(): `Promise`\<[`OCRCapabilities`](../interfaces/OCRCapabilities.md)\>

Defined in: [src/node/paddleocr-vl.ts:227](https://github.com/happyvertical/ocr/blob/main/src/node/paddleocr-vl.ts#L227)

Get provider capabilities

#### Returns

`Promise`\<[`OCRCapabilities`](../interfaces/OCRCapabilities.md)\>

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`checkCapabilities`](../interfaces/OCRProvider.md#checkcapabilities)

***

### getSupportedLanguages()

> **getSupportedLanguages**(): `string`[]

Defined in: [src/node/paddleocr-vl.ts:252](https://github.com/happyvertical/ocr/blob/main/src/node/paddleocr-vl.ts#L252)

PaddleOCR-VL recognizes 100+ languages and needs no language hint.

#### Returns

`string`[]

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`getSupportedLanguages`](../interfaces/OCRProvider.md#getsupportedlanguages)

***

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Defined in: [src/node/paddleocr-vl.ts:256](https://github.com/happyvertical/ocr/blob/main/src/node/paddleocr-vl.ts#L256)

Clean up provider resources (optional)

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`OCRProvider`](../interfaces/OCRProvider.md).[`cleanup`](../interfaces/OCRProvider.md#cleanup)
