[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRImage

# Interface: OCRImage

Defined in: [src/shared/types.ts:67](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L67)

Represents an image input for OCR processing operations.

Supports multiple input formats to accommodate different use cases:
- Raw image files (PNG, JPEG, etc.) as Buffer
- RGB pixel data with dimensions
- Base64 encoded image strings
- File paths (as strings)

## Properties

### data

> **data**: `string` \| `Buffer`\<`ArrayBufferLike`\> \| `Uint8Array`\<`ArrayBufferLike`\>

Defined in: [src/shared/types.ts:69](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L69)

Image data as Buffer, Uint8Array, or string (base64/path)

***

### width?

> `optional` **width?**: `number`

Defined in: [src/shared/types.ts:71](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L71)

Image width in pixels

***

### height?

> `optional` **height?**: `number`

Defined in: [src/shared/types.ts:73](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L73)

Image height in pixels

***

### channels?

> `optional` **channels?**: `number`

Defined in: [src/shared/types.ts:75](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L75)

Number of color channels

***

### format?

> `optional` **format?**: `string`

Defined in: [src/shared/types.ts:77](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L77)

Image format/type

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `any`\>

Defined in: [src/shared/types.ts:79](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L79)

Optional metadata for tracking
