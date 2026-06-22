[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRCapabilities

# Interface: OCRCapabilities

Defined in: [src/shared/types.ts:132](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L132)

OCR provider capabilities information

## Properties

### canPerformOCR

> **canPerformOCR**: `boolean`

Defined in: [src/shared/types.ts:134](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L134)

Whether the provider can perform OCR

***

### supportedLanguages

> **supportedLanguages**: `string`[]

Defined in: [src/shared/types.ts:136](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L136)

List of supported languages

***

### maxImageSize?

> `optional` **maxImageSize?**: `number`

Defined in: [src/shared/types.ts:138](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L138)

Maximum supported image size in pixels

***

### supportedFormats?

> `optional` **supportedFormats?**: `string`[]

Defined in: [src/shared/types.ts:140](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L140)

Supported image formats

***

### hasConfidenceScores?

> `optional` **hasConfidenceScores?**: `boolean`

Defined in: [src/shared/types.ts:142](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L142)

Whether the provider supports confidence scores

***

### hasBoundingBoxes?

> `optional` **hasBoundingBoxes?**: `boolean`

Defined in: [src/shared/types.ts:144](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L144)

Whether the provider supports bounding boxes

***

### providerSpecific?

> `optional` **providerSpecific?**: `Record`\<`string`, `any`\>

Defined in: [src/shared/types.ts:146](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L146)

Provider-specific capabilities
