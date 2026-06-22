[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRCapabilities

# Interface: OCRCapabilities

Defined in: [src/shared/types.ts:145](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L145)

OCR provider capabilities information

## Properties

### canPerformOCR

> **canPerformOCR**: `boolean`

Defined in: [src/shared/types.ts:147](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L147)

Whether the provider can perform OCR

***

### supportedLanguages

> **supportedLanguages**: `string`[]

Defined in: [src/shared/types.ts:149](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L149)

List of supported languages

***

### maxImageSize?

> `optional` **maxImageSize?**: `number`

Defined in: [src/shared/types.ts:151](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L151)

Maximum supported image size in pixels

***

### supportedFormats?

> `optional` **supportedFormats?**: `string`[]

Defined in: [src/shared/types.ts:153](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L153)

Supported image formats

***

### hasConfidenceScores?

> `optional` **hasConfidenceScores?**: `boolean`

Defined in: [src/shared/types.ts:155](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L155)

Whether the provider supports confidence scores

***

### hasBoundingBoxes?

> `optional` **hasBoundingBoxes?**: `boolean`

Defined in: [src/shared/types.ts:157](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L157)

Whether the provider supports bounding boxes

***

### providerSpecific?

> `optional` **providerSpecific?**: `Record`\<`string`, `any`\>

Defined in: [src/shared/types.ts:159](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L159)

Provider-specific capabilities
