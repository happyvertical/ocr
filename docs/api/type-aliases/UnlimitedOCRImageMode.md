[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / UnlimitedOCRImageMode

# Type Alias: UnlimitedOCRImageMode

> **UnlimitedOCRImageMode** = `"auto"` \| `"gundam"` \| `"base"`

Defined in: [src/node/unlimited-ocr.ts:51](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L51)

Image processing mode sent to Unlimited-OCR.

`auto` uses `gundam` for single-image requests and `base` for multi-image
or multi-page requests. Only the `sglang` backend sends it.
