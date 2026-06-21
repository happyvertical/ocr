[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRCapabilities

# Interface: OCRCapabilities

Defined in: [src/shared/types.ts:133](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L133)

OCR provider capabilities information

## Properties

### canPerformOCR

> **canPerformOCR**: `boolean`

Defined in: [src/shared/types.ts:135](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L135)

Whether the provider can perform OCR

***

### supportedLanguages

> **supportedLanguages**: `string`[]

Defined in: [src/shared/types.ts:137](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L137)

List of supported languages

***

### maxImageSize?

> `optional` **maxImageSize?**: `number`

Defined in: [src/shared/types.ts:139](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L139)

Maximum supported image size in pixels

***

### supportedFormats?

> `optional` **supportedFormats?**: `string`[]

Defined in: [src/shared/types.ts:141](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L141)

Supported image formats

***

### hasConfidenceScores?

> `optional` **hasConfidenceScores?**: `boolean`

Defined in: [src/shared/types.ts:143](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L143)

Whether the provider supports confidence scores

***

### hasBoundingBoxes?

> `optional` **hasBoundingBoxes?**: `boolean`

Defined in: [src/shared/types.ts:145](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L145)

Whether the provider supports bounding boxes

***

### providerSpecific?

> `optional` **providerSpecific?**: `Record`\<`string`, `any`\>

Defined in: [src/shared/types.ts:147](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L147)

Provider-specific capabilities
