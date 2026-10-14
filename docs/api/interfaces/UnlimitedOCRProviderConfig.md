[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / UnlimitedOCRProviderConfig

# Interface: UnlimitedOCRProviderConfig

Defined in: [src/node/unlimited-ocr.ts:56](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L56)

Configuration for the served Unlimited-OCR provider.

## Properties

### baseUrl?

> `optional` **baseUrl?**: `string`

Defined in: [src/node/unlimited-ocr.ts:58](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L58)

Direct SGLang/vLLM URL or Bifrost gateway URL.

***

### apiKey?

> `optional` **apiKey?**: `string`

Defined in: [src/node/unlimited-ocr.ts:60](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L60)

Optional API key. Required for HappyVertical Bifrost virtual-key auth.

***

### model?

> `optional` **model?**: `string`

Defined in: [src/node/unlimited-ocr.ts:62](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L62)

Served model name. The upstream SGLang example uses `Unlimited-OCR`.

***

### transport?

> `optional` **transport?**: [`UnlimitedOCRTransport`](../type-aliases/UnlimitedOCRTransport.md)

Defined in: [src/node/unlimited-ocr.ts:64](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L64)

Whether the endpoint is direct or Bifrost-routed.

***

### backend?

> `optional` **backend?**: [`UnlimitedOCRBackend`](../type-aliases/UnlimitedOCRBackend.md)

Defined in: [src/node/unlimited-ocr.ts:69](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L69)

Inference server behind the endpoint. Defaults to `sglang`; set `vllm`
(or `HAVE_OCR_UNLIMITED_BACKEND=vllm`) for the vLLM recipe.

***

### imageMode?

> `optional` **imageMode?**: [`UnlimitedOCRImageMode`](../type-aliases/UnlimitedOCRImageMode.md)

Defined in: [src/node/unlimited-ocr.ts:74](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L74)

Image mode sent to Unlimited-OCR. `auto` uses `gundam` for one image and
`base` for multi-page. Ignored by the `vllm` backend.

***

### prompt?

> `optional` **prompt?**: `string`

Defined in: [src/node/unlimited-ocr.ts:79](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L79)

Prompt for a single image. Defaults to `document parsing.`. See
`multiPagePrompt` for how the `vllm` backend places `<image>` placeholders.

***

### multiPagePrompt?

> `optional` **multiPagePrompt?**: `string`

Defined in: [src/node/unlimited-ocr.ts:88](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L88)

Prompt for multiple images/pages. Defaults to `Multi page parsing.`.

The `vllm` backend needs exactly one `<image>` placeholder per image sent.
A prompt that already contains as many placeholders as the request has
images is sent unchanged; otherwise every `<image>` is removed and one
placeholder per image is prefixed (`<image><image>Multi page parsing.`).

***

### stream?

> `optional` **stream?**: `boolean`

Defined in: [src/node/unlimited-ocr.ts:90](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L90)

Whether to request streaming (server-sent events) responses.

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [src/node/unlimited-ocr.ts:92](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L92)

Request timeout in milliseconds.

***

### ngramSize?

> `optional` **ngramSize?**: `number`

Defined in: [src/node/unlimited-ocr.ts:94](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L94)

No-repeat ngram size (`custom_params` on SGLang, `vllm_xargs` on vLLM).

***

### ngramWindow?

> `optional` **ngramWindow?**: `number`

Defined in: [src/node/unlimited-ocr.ts:96](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L96)

Override no-repeat ngram window for all requests.

***

### singleImageNgramWindow?

> `optional` **singleImageNgramWindow?**: `number`

Defined in: [src/node/unlimited-ocr.ts:98](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L98)

Window used for one-image `gundam` mode when ngramWindow is not set.

***

### multiImageNgramWindow?

> `optional` **multiImageNgramWindow?**: `number`

Defined in: [src/node/unlimited-ocr.ts:100](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L100)

Window used for multi-image `base` mode when ngramWindow is not set.

***

### customLogitProcessor?

> `optional` **customLogitProcessor?**: `string`

Defined in: [src/node/unlimited-ocr.ts:108](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L108)

SGLang custom logit processor string. Ignored by the `vllm` backend,
which enables its n-gram logits processor server-side.

The upstream Python example uses:
`DeepseekOCRNoRepeatNGramLogitProcessor.to_str()`

***

### extraRequestBody?

> `optional` **extraRequestBody?**: `Record`\<`string`, `unknown`\>

Defined in: [src/node/unlimited-ocr.ts:110](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L110)

Extra request body fields merged into the chat completions payload last.
