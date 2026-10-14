[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / UnlimitedOCRProviderConfig

# Interface: UnlimitedOCRProviderConfig

Defined in: [src/node/unlimited-ocr.ts:55](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L55)

Configuration for the served Unlimited-OCR provider.

## Properties

### baseUrl?

> `optional` **baseUrl?**: `string`

Defined in: [src/node/unlimited-ocr.ts:57](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L57)

Direct SGLang/vLLM URL or Bifrost gateway URL.

***

### apiKey?

> `optional` **apiKey?**: `string`

Defined in: [src/node/unlimited-ocr.ts:59](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L59)

Optional API key. Required for HappyVertical Bifrost virtual-key auth.

***

### model?

> `optional` **model?**: `string`

Defined in: [src/node/unlimited-ocr.ts:61](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L61)

Served model name. The upstream SGLang example uses `Unlimited-OCR`.

***

### transport?

> `optional` **transport?**: [`UnlimitedOCRTransport`](../type-aliases/UnlimitedOCRTransport.md)

Defined in: [src/node/unlimited-ocr.ts:63](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L63)

Whether the endpoint is direct or Bifrost-routed.

***

### backend?

> `optional` **backend?**: [`UnlimitedOCRBackend`](../type-aliases/UnlimitedOCRBackend.md)

Defined in: [src/node/unlimited-ocr.ts:68](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L68)

Inference server behind the endpoint. Defaults to `sglang`; set `vllm`
(or `HAVE_OCR_UNLIMITED_BACKEND=vllm`) for the vLLM recipe.

***

### imageMode?

> `optional` **imageMode?**: [`UnlimitedOCRImageMode`](../type-aliases/UnlimitedOCRImageMode.md)

Defined in: [src/node/unlimited-ocr.ts:73](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L73)

Image mode sent to Unlimited-OCR. `auto` uses `gundam` for one image and
`base` for multi-page. Ignored by the `vllm` backend.

***

### prompt?

> `optional` **prompt?**: `string`

Defined in: [src/node/unlimited-ocr.ts:78](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L78)

Prompt for a single image. Defaults to `document parsing.`; the `vllm`
backend prefixes `<image>` when the prompt does not already start with it.

***

### multiPagePrompt?

> `optional` **multiPagePrompt?**: `string`

Defined in: [src/node/unlimited-ocr.ts:84](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L84)

Prompt for multiple images/pages. Defaults to `Multi page parsing.`; the
`vllm` backend prefixes `<image>` when the prompt does not already start
with it.

***

### stream?

> `optional` **stream?**: `boolean`

Defined in: [src/node/unlimited-ocr.ts:86](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L86)

Whether to request streaming (server-sent events) responses.

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [src/node/unlimited-ocr.ts:88](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L88)

Request timeout in milliseconds.

***

### ngramSize?

> `optional` **ngramSize?**: `number`

Defined in: [src/node/unlimited-ocr.ts:90](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L90)

No-repeat ngram size (`custom_params` on SGLang, `vllm_xargs` on vLLM).

***

### ngramWindow?

> `optional` **ngramWindow?**: `number`

Defined in: [src/node/unlimited-ocr.ts:92](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L92)

Override no-repeat ngram window for all requests.

***

### singleImageNgramWindow?

> `optional` **singleImageNgramWindow?**: `number`

Defined in: [src/node/unlimited-ocr.ts:94](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L94)

Window used for one-image `gundam` mode when ngramWindow is not set.

***

### multiImageNgramWindow?

> `optional` **multiImageNgramWindow?**: `number`

Defined in: [src/node/unlimited-ocr.ts:96](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L96)

Window used for multi-image `base` mode when ngramWindow is not set.

***

### customLogitProcessor?

> `optional` **customLogitProcessor?**: `string`

Defined in: [src/node/unlimited-ocr.ts:104](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L104)

SGLang custom logit processor string. Ignored by the `vllm` backend,
which enables its n-gram logits processor server-side.

The upstream Python example uses:
`DeepseekOCRNoRepeatNGramLogitProcessor.to_str()`

***

### extraRequestBody?

> `optional` **extraRequestBody?**: `Record`\<`string`, `unknown`\>

Defined in: [src/node/unlimited-ocr.ts:106](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L106)

Extra request body fields merged into the chat completions payload last.
