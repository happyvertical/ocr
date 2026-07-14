[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / UnlimitedOCRProviderConfig

# Interface: UnlimitedOCRProviderConfig

Defined in: [src/node/unlimited-ocr.ts:40](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L40)

Configuration for the served Unlimited-OCR provider.

## Properties

### baseUrl?

> `optional` **baseUrl?**: `string`

Defined in: [src/node/unlimited-ocr.ts:42](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L42)

Direct SGLang URL or Bifrost gateway URL.

***

### apiKey?

> `optional` **apiKey?**: `string`

Defined in: [src/node/unlimited-ocr.ts:44](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L44)

Optional API key. Required for HappyVertical Bifrost virtual-key auth.

***

### model?

> `optional` **model?**: `string`

Defined in: [src/node/unlimited-ocr.ts:46](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L46)

Served model name. The upstream SGLang example uses `Unlimited-OCR`.

***

### transport?

> `optional` **transport?**: [`UnlimitedOCRTransport`](../type-aliases/UnlimitedOCRTransport.md)

Defined in: [src/node/unlimited-ocr.ts:48](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L48)

Whether the endpoint is direct SGLang or Bifrost-routed.

***

### imageMode?

> `optional` **imageMode?**: [`UnlimitedOCRImageMode`](../type-aliases/UnlimitedOCRImageMode.md)

Defined in: [src/node/unlimited-ocr.ts:50](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L50)

Image mode sent to Unlimited-OCR. `auto` uses `gundam` for one image and `base` for multi-page.

***

### prompt?

> `optional` **prompt?**: `string`

Defined in: [src/node/unlimited-ocr.ts:52](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L52)

Prompt for a single image.

***

### multiPagePrompt?

> `optional` **multiPagePrompt?**: `string`

Defined in: [src/node/unlimited-ocr.ts:54](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L54)

Prompt for multiple images/pages.

***

### stream?

> `optional` **stream?**: `boolean`

Defined in: [src/node/unlimited-ocr.ts:56](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L56)

Whether to use SGLang streaming responses.

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [src/node/unlimited-ocr.ts:58](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L58)

Request timeout in milliseconds.

***

### ngramSize?

> `optional` **ngramSize?**: `number`

Defined in: [src/node/unlimited-ocr.ts:60](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L60)

No-repeat ngram size for Unlimited-OCR custom params.

***

### ngramWindow?

> `optional` **ngramWindow?**: `number`

Defined in: [src/node/unlimited-ocr.ts:62](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L62)

Override no-repeat ngram window for all requests.

***

### singleImageNgramWindow?

> `optional` **singleImageNgramWindow?**: `number`

Defined in: [src/node/unlimited-ocr.ts:64](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L64)

Window used for one-image `gundam` mode when ngramWindow is not set.

***

### multiImageNgramWindow?

> `optional` **multiImageNgramWindow?**: `number`

Defined in: [src/node/unlimited-ocr.ts:66](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L66)

Window used for multi-image `base` mode when ngramWindow is not set.

***

### customLogitProcessor?

> `optional` **customLogitProcessor?**: `string`

Defined in: [src/node/unlimited-ocr.ts:73](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L73)

SGLang custom logit processor string.

The upstream Python example uses:
`DeepseekOCRNoRepeatNGramLogitProcessor.to_str()`

***

### extraRequestBody?

> `optional` **extraRequestBody?**: `Record`\<`string`, `unknown`\>

Defined in: [src/node/unlimited-ocr.ts:75](https://github.com/happyvertical/ocr/blob/main/src/node/unlimited-ocr.ts#L75)

Extra request body fields merged into the chat completions payload last.
