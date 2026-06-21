[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / OCROptions

# Interface: OCROptions

Defined in: [src/shared/types.ts:22](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L22)

Configuration options for OCR processing operations.

These options control how OCR processing is performed across all providers,
allowing fine-tuning of accuracy, performance, and output format.

## Example

**Basic usage**

```typescript
const options: OCROptions = {
  language: 'eng',
  confidenceThreshold: 70
};
```

## Properties

### language?

> `optional` **language?**: `string`

Defined in: [src/shared/types.ts:30](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L30)

Language code for OCR recognition. Supports single languages or
combinations separated by '+' for multi-language processing.

#### Default

```ts
'eng'
```

#### Examples

```ts
'eng' - English only
```

```ts
'eng+chi_sim' - English and Chinese
```

***

### improveResolution?

> `optional` **improveResolution?**: `boolean`

Defined in: [src/shared/types.ts:36](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L36)

Whether to enhance image resolution before OCR processing.
This can improve accuracy for low-resolution images but increases processing time.

#### Default

```ts
false
```

***

### outputFormat?

> `optional` **outputFormat?**: `"text"` \| `"json"` \| `"hocr"`

Defined in: [src/shared/types.ts:44](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L44)

Desired output format for OCR results.
- 'text' - Plain text only (fastest)
- 'json' - Structured data with bounding boxes and confidence
- 'hocr' - HTML-based OCR format with positioning data

#### Default

```ts
'text'
```

***

### confidenceThreshold?

> `optional` **confidenceThreshold?**: `number`

Defined in: [src/shared/types.ts:50](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L50)

Minimum confidence threshold for including text in results (0-100).
Text detections with confidence below this threshold will be filtered out.

#### Default

```ts
undefined (no filtering)
```

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [src/shared/types.ts:55](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L55)

Maximum time to wait for OCR processing to complete, in milliseconds.

#### Default

```ts
30000 (30 seconds)
```
