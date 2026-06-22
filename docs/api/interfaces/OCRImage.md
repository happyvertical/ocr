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

### bitsPerComponent?

> `optional` **bitsPerComponent?**: `number`

Defined in: [src/shared/types.ts:87](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L87)

Bits per channel sample. Common values: 1, 8, 16.

Required for unambiguous decoding of raw pixel buffers. Without it, a
1-channel × 16-bit buffer is indistinguishable from a 2-channel × 8-bit
buffer of the same byte length.

Expected buffer size depends on whether samples are byte-aligned:
- Byte-aligned (8, 16, 24, …): `bytes.length === width * height * channels * (bitsPerComponent / 8)`
- Bit-packed (1, 2, 4): `bytes.length === Math.ceil(width * height * channels * bitsPerComponent / 8)`
  (PDF `/BitsPerComponent` 1/2/4 streams are typically packed this way.)

***

### format?

> `optional` **format?**: `string`

Defined in: [src/shared/types.ts:89](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L89)

Image format/type

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `any`\>

Defined in: [src/shared/types.ts:91](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L91)

Optional metadata for tracking
