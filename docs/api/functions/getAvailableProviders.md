[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / getAvailableProviders

# Function: getAvailableProviders()

> **getAvailableProviders**(): `Promise`\<`string`[]\>

Defined in: [src/shared/factory.ts:863](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L863)

Get list of OCR provider names available in the current environment.

This function provides a quick way to check which providers can be loaded
without creating a full factory instance. The returned providers may still
require dependency checks before use.

## Returns

`Promise`\<`string`[]\>

Promise resolving to array of available provider names

## Example

```typescript
const providers = await getAvailableProviders();
console.log('Available providers:', providers);
// Node.js: ['tesseract', 'onnx']
// Browser: ['tesseract', 'web-ocr']

if (providers.includes('onnx')) {
  console.log('High-accuracy ONNX OCR is available');
}
```
