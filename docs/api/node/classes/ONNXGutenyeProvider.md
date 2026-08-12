[**@happyvertical/ocr/node**](../README.md)

***

[@happyvertical/ocr/node](../README.md) / ONNXGutenyeProvider

# Class: ONNXGutenyeProvider

Defined in: [onnx-gutenye.ts:165](https://github.com/happyvertical/ocr/blob/main/src/node/onnx-gutenye.ts#L165)

ONNX PaddleOCR provider backed by Sharp and ONNX Runtime on Node.js.

## Implements

- `OCRProvider`

## Constructors

### Constructor

> **new ONNXGutenyeProvider**(): `ONNXGutenyeProvider`

#### Returns

`ONNXGutenyeProvider`

## Properties

### name

> `readonly` **name**: `"onnx"` = `'onnx'`

Defined in: [onnx-gutenye.ts:166](https://github.com/happyvertical/ocr/blob/main/src/node/onnx-gutenye.ts#L166)

Provider name identifier

#### Implementation of

`OCRProvider.name`

## Methods

### performOCR()

> **performOCR**(`images`, `options?`): `Promise`\<`OCRResult`\>

Defined in: [onnx-gutenye.ts:201](https://github.com/happyvertical/ocr/blob/main/src/node/onnx-gutenye.ts#L201)

Perform OCR on image data

#### Parameters

##### images

`OCRImage`[]

##### options?

`OCROptions`

#### Returns

`Promise`\<`OCRResult`\>

#### Implementation of

`OCRProvider.performOCR`

***

### checkDependencies()

> **checkDependencies**(): `Promise`\<`DependencyCheckResult`\>

Defined in: [onnx-gutenye.ts:305](https://github.com/happyvertical/ocr/blob/main/src/node/onnx-gutenye.ts#L305)

Check if provider dependencies are available

#### Returns

`Promise`\<`DependencyCheckResult`\>

#### Implementation of

`OCRProvider.checkDependencies`

***

### checkCapabilities()

> **checkCapabilities**(): `Promise`\<`OCRCapabilities`\>

Defined in: [onnx-gutenye.ts:313](https://github.com/happyvertical/ocr/blob/main/src/node/onnx-gutenye.ts#L313)

Get provider capabilities

#### Returns

`Promise`\<`OCRCapabilities`\>

#### Implementation of

`OCRProvider.checkCapabilities`

***

### getSupportedLanguages()

> **getSupportedLanguages**(): `string`[]

Defined in: [onnx-gutenye.ts:322](https://github.com/happyvertical/ocr/blob/main/src/node/onnx-gutenye.ts#L322)

Get supported languages

#### Returns

`string`[]

#### Implementation of

`OCRProvider.getSupportedLanguages`

***

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Defined in: [onnx-gutenye.ts:326](https://github.com/happyvertical/ocr/blob/main/src/node/onnx-gutenye.ts#L326)

Clean up provider resources (optional)

#### Returns

`Promise`\<`void`\>

#### Implementation of

`OCRProvider.cleanup`
