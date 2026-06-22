[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / DependencyCheckResult

# Interface: DependencyCheckResult

Defined in: [src/shared/types.ts:118](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L118)

Dependency check result for OCR providers

## Properties

### available

> **available**: `boolean`

Defined in: [src/shared/types.ts:120](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L120)

Whether all dependencies are available

***

### error?

> `optional` **error?**: `string`

Defined in: [src/shared/types.ts:122](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L122)

Error message if dependencies are missing

***

### details

> **details**: `Record`\<`string`, `any`\>

Defined in: [src/shared/types.ts:124](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L124)

Detailed information about specific dependencies

***

### version?

> `optional` **version?**: `string`

Defined in: [src/shared/types.ts:126](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L126)

Version information if available
