[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRImage

# Interface: OCRImage

Defined in: [src/shared/types.ts:66](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L66)

Represents an image input for OCR processing operations.

Supports multiple input formats to accommodate different use cases:
- Raw image files (PNG, JPEG, etc.) as Buffer
- RGB pixel data with dimensions
- Base64 encoded image strings

## Properties

### data

> **data**: `string` \| `Buffer`\<`ArrayBufferLike`\> \| `Uint8Array`\<`ArrayBufferLike`\>

Defined in: [src/shared/types.ts:68](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L68)

Image data as Buffer, Uint8Array, or base64 string

***

### width?

> `optional` **width?**: `number`

Defined in: [src/shared/types.ts:70](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L70)

Image width in pixels

***

### height?

> `optional` **height?**: `number`

Defined in: [src/shared/types.ts:72](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L72)

Image height in pixels

***

### channels?

> `optional` **channels?**: `number`

Defined in: [src/shared/types.ts:74](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L74)

Number of color channels

***

### format?

> `optional` **format?**: `string`

Defined in: [src/shared/types.ts:76](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L76)

Image format/type

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `any`\>

Defined in: [src/shared/types.ts:78](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L78)

Optional metadata for tracking
