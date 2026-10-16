[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / PaddleOCRVLProviderConfig

# Interface: PaddleOCRVLProviderConfig

Defined in: [src/node/paddleocr-vl.ts:27](https://github.com/happyvertical/ocr/blob/main/src/node/paddleocr-vl.ts#L27)

Configuration for the PaddleOCR-VL provider. Each field falls back to
`HAVE_OCR_PADDLEOCR_*`, then to the `HAVE_PDF_PADDLEOCR_*` setting
`@happyvertical/pdf` uses, so one service setting serves both packages.

## Properties

### baseUrl?

> `optional` **baseUrl?**: `string`

Defined in: [src/node/paddleocr-vl.ts:29](https://github.com/happyvertical/ocr/blob/main/src/node/paddleocr-vl.ts#L29)

Service root, e.g. `http://paddleocr-vl:8080` (the `/layout-parsing` path is appended).

***

### apiKey?

> `optional` **apiKey?**: `string`

Defined in: [src/node/paddleocr-vl.ts:31](https://github.com/happyvertical/ocr/blob/main/src/node/paddleocr-vl.ts#L31)

Optional bearer token for deployments behind an authenticating proxy.

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [src/node/paddleocr-vl.ts:36](https://github.com/happyvertical/ocr/blob/main/src/node/paddleocr-vl.ts#L36)

Deadline for each page request, including an on-demand cold start and the
response body. Default: 65 minutes.
