[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / isProviderAvailable

# Function: isProviderAvailable()

> **isProviderAvailable**(`providerName`): `Promise`\<`boolean`\>

Defined in: [src/shared/factory.ts:943](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L943)

Check if a specific OCR provider is available and ready to use.

Performs a complete availability check including dependency validation
for the specified provider.

## Parameters

### providerName

`string`

Name of the provider to check

## Returns

`Promise`\<`boolean`\>

Promise resolving to true if provider is available and functional

## Example

```typescript
const onnxAvailable = await isProviderAvailable('onnx');
const tesseractAvailable = await isProviderAvailable('tesseract');

console.log('ONNX available:', onnxAvailable);
console.log('Tesseract available:', tesseractAvailable);

// Choose provider based on availability
const provider = onnxAvailable ? 'onnx' : 'tesseract';
const factory = getOCR({ provider });
```
