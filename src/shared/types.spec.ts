import { describe, expect, test } from 'vitest';
import {
  OCRDependencyError,
  OCRError,
  OCRProcessingError,
  OCRUnsupportedError,
} from './types';

describe('OCR error classes', () => {
  test('preserves provider and context on base errors', () => {
    const context = { imageCount: 2 };
    const error = new OCRError('failed', 'custom', context);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('OCRError');
    expect(error.message).toBe('failed');
    expect(error.provider).toBe('custom');
    expect(error.context).toBe(context);
  });

  test('formats dependency errors', () => {
    const error = new OCRDependencyError('tesseract', 'missing worker');

    expect(error.name).toBe('OCRDependencyError');
    expect(error.provider).toBe('tesseract');
    expect(error.message).toBe(
      'OCR dependency error for tesseract: missing worker',
    );
  });

  test('formats unsupported operation errors', () => {
    const error = new OCRUnsupportedError('web-ocr', 'extractLayout');

    expect(error.name).toBe('OCRUnsupportedError');
    expect(error.provider).toBe('web-ocr');
    expect(error.message).toBe(
      "OCR operation 'extractLayout' not supported by web-ocr",
    );
  });

  test('formats processing errors', () => {
    const error = new OCRProcessingError('onnx', 'decode failed');

    expect(error.name).toBe('OCRProcessingError');
    expect(error.provider).toBe('onnx');
    expect(error.message).toBe('OCR processing error for onnx: decode failed');
  });
});
