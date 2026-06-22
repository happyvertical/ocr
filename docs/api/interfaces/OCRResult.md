[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCRResult

# Interface: OCRResult

Defined in: [src/shared/types.ts:87](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L87)

Result object returned from OCR processing operations.

Contains the extracted text, confidence metrics, and optional
detailed detection information including bounding boxes.

## Properties

### text

> **text**: `string`

Defined in: [src/shared/types.ts:89](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L89)

Extracted text

***

### confidence

> **confidence**: `number`

Defined in: [src/shared/types.ts:91](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L91)

Overall confidence score (0-100)

***

### detections?

> `optional` **detections?**: `object`[]

Defined in: [src/shared/types.ts:93](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L93)

Detailed detection results

#### text

> **text**: `string`

#### confidence

> **confidence**: `number`

#### boundingBox?

> `optional` **boundingBox?**: `object`

##### boundingBox.x

> **x**: `number`

##### boundingBox.y

> **y**: `number`

##### boundingBox.width

> **width**: `number`

##### boundingBox.height

> **height**: `number`

***

### metadata?

> `optional` **metadata?**: `object`

Defined in: [src/shared/types.ts:104](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L104)

Processing metadata

#### Index Signature

\[`key`: `string`\]: `any`

#### processingTime?

> `optional` **processingTime?**: `number`

#### provider?

> `optional` **provider?**: `string`

#### language?

> `optional` **language?**: `string`

#### environment?

> `optional` **environment?**: `string`

#### error?

> `optional` **error?**: `string`

#### fallbackFrom?

> `optional` **fallbackFrom?**: `string`
