[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / DependencyCheckResult

# Interface: DependencyCheckResult

Defined in: [src/shared/types.ts:119](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L119)

Dependency check result for OCR providers

## Properties

### available

> **available**: `boolean`

Defined in: [src/shared/types.ts:121](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L121)

Whether all dependencies are available

***

### error?

> `optional` **error?**: `string`

Defined in: [src/shared/types.ts:123](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L123)

Error message if dependencies are missing

***

### details

> **details**: `Record`\<`string`, `any`\>

Defined in: [src/shared/types.ts:125](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L125)

Detailed information about specific dependencies

***

### version?

> `optional` **version?**: `string`

Defined in: [src/shared/types.ts:127](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L127)

Version information if available
