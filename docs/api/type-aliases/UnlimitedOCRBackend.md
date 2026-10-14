[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / UnlimitedOCRBackend

# Type Alias: UnlimitedOCRBackend

> **UnlimitedOCRBackend** = `"sglang"` \| `"vllm"`

Defined in: [src/node/unlimited-ocr.ts:42](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L42)

Inference server that serves Unlimited-OCR, which decides the request shape.

- `sglang` (default) sends SGLang fields: `custom_params` for the n-gram
  window, `images_config.image_mode`, and an optional
  `custom_logit_processor`.
- `vllm` follows the vLLM recipe (https://recipes.vllm.ai/baidu/Unlimited-OCR):
  it sends `vllm_xargs: { ngram_size, window_size }` for the server-side
  `NGramPerReqLogitsProcessor`, starts the prompt with a literal `<image>`,
  and omits the SGLang-only `images_config` and `custom_logit_processor`
  fields (vLLM chooses the image mode itself).
