[**@happyvertical/ocr**](../README.md)

***

[@happyvertical/ocr](../README.md) / getProviderInfo

# Function: getProviderInfo()

> **getProviderInfo**(`providerName`): `Promise`\<[`OCRProviderInfo`](../interfaces/OCRProviderInfo.md) \| `null`\>

Defined in: [src/shared/factory.ts:956](https://github.com/happyvertical/ocr/blob/main/src/shared/factory.ts#L956)

Get detailed information about a specific OCR provider.

Returns comprehensive information about the provider including
availability, dependencies, and capabilities. Returns null if
the provider doesn't exist.

## Parameters

### providerName

`string`

Name of the provider to query

## Returns

`Promise`\<[`OCRProviderInfo`](../interfaces/OCRProviderInfo.md) \| `null`\>

Promise resolving to provider information or null if not found

## Examples

```typescript
const info = await getProviderInfo('tesseract');
if (info) {
  console.log('Provider available:', info.available);
  if (info.available && info.capabilities) {
    console.log('Supported languages:', info.capabilities.supportedLanguages.length);
    console.log('Has bounding boxes:', info.capabilities.hasBoundingBoxes);
  } else {
    console.log('Dependency error:', info.dependencies.error);
  }
} else {
  console.log('Provider "tesseract" not found');
}
```

**Compare multiple providers**

```typescript
const providers = ['tesseract', 'onnx', 'web-ocr'];
for (const name of providers) {
  const info = await getProviderInfo(name);
  if (info?.available && info.capabilities) {
    console.log(`${name}: ${info.capabilities.supportedLanguages.length} languages`);
  }
}
```
