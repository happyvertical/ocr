[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / resetOCRFactory

# Function: resetOCRFactory()

> **resetOCRFactory**(): `void`

Defined in: [src/shared/factory.ts:853](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L853)

Reset the global OCR factory instance.

Cleans up the current global factory and forces creation of a new one
on the next call to getOCR(). Primarily useful for testing or when
you need to ensure a fresh factory state.

## Returns

`void`

## Examples

```typescript
// In test setup/teardown
afterEach(async () => {
  resetOCRFactory();
});
```

**Force re-initialization**

```typescript
resetOCRFactory();
const factory = getOCR(); // Creates new factory instance
```
