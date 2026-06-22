[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / DependencyCheckResult

# Interface: DependencyCheckResult

Defined in: [src/shared/types.ts:131](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L131)

Dependency check result for OCR providers

## Properties

### available

> **available**: `boolean`

Defined in: [src/shared/types.ts:133](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L133)

Whether all dependencies are available

***

### error?

> `optional` **error?**: `string`

Defined in: [src/shared/types.ts:135](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L135)

Error message if dependencies are missing

***

### details

> **details**: `Record`\<`string`, `any`\>

Defined in: [src/shared/types.ts:137](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L137)

Detailed information about specific dependencies

***

### version?

> `optional` **version?**: `string`

Defined in: [src/shared/types.ts:139](https://github.com/happyvertical/ocr/blob/main/src/shared/types.ts#L139)

Version information if available
