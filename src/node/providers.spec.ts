import { readFile } from 'node:fs/promises';
import { InferenceSession } from 'onnxruntime-node';
import sharp from 'sharp';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { nativeDependencyVersions, SharpImageRaw } from './gutenye-runtime';
import { ONNXGutenyeProvider } from './onnx-gutenye';
import { TesseractProvider } from './tesseract';

const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, ...Array(100).fill(0)]);
const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...Array(100).fill(0)]);
const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, ...Array(100).fill(0)]);
const bmpBuffer = Buffer.from([0x42, 0x4d, ...Array(100).fill(0)]);

const createTesseractWorker = (recognize = vi.fn()) => ({
  recognize,
  terminate: vi.fn().mockResolvedValue(undefined),
});

describe('TesseractProvider', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('processes supported image formats and skips invalid inputs', async () => {
    const worker = createTesseractWorker(
      vi.fn().mockResolvedValue({
        data: {
          text: ' OCR text ',
          confidence: 88,
          words: [
            {
              text: 'OCR',
              confidence: 90,
              bbox: { x0: 2, y0: 4, x1: 10, y1: 14 },
            },
            { text: '', confidence: 0 },
          ],
        },
      }),
    );
    const provider = new TesseractProvider();
    (provider as any).tesseract = {
      createWorker: vi.fn().mockResolvedValue(worker),
    };

    const result = await provider.performOCR(
      [
        { data: pngBuffer },
        { data: jpegBuffer },
        { data: gifBuffer },
        { data: bmpBuffer },
        { data: Buffer.from([1, 2, 3]) },
        { data: Buffer.from('not an image'.repeat(20)) },
        { data: '' },
      ],
      { language: 'zh-cn' },
    );

    expect(result.text).toBe('OCR text OCR text OCR text OCR text');
    expect(result.confidence).toBe(88);
    expect(result.detections).toHaveLength(4);
    expect(result.detections?.[0].boundingBox).toEqual({
      x: 2,
      y: 4,
      width: 8,
      height: 10,
    });
    expect(worker.recognize).toHaveBeenCalledTimes(4);
    expect((provider as any).tesseract.createWorker).toHaveBeenCalledWith(
      'chi_sim',
    );
  });

  test('uses whole-text detection when Tesseract does not return words', async () => {
    const provider = new TesseractProvider();
    (provider as any).tesseract = {
      createWorker: vi.fn().mockResolvedValue(
        createTesseractWorker(
          vi.fn().mockResolvedValue({
            data: {
              text: 'Full text',
              confidence: 66,
            },
          }),
        ),
      ),
    };

    const result = await provider.performOCR([{ data: pngBuffer }]);

    expect(result.detections).toEqual([
      { text: 'Full text', confidence: 66, boundingBox: undefined },
    ]);
  });

  test('reports malformed Tesseract modules as unavailable', async () => {
    const provider = new TesseractProvider();
    (provider as any).tesseract = {};

    const dependencies = await provider.checkDependencies();

    expect(dependencies.available).toBe(false);
    expect(dependencies.error).toContain('missing required functions');
  });

  test('wraps worker failures as OCR processing errors', async () => {
    const provider = new TesseractProvider();
    (provider as any).tesseract = {
      createWorker: vi.fn().mockRejectedValue(new Error('worker failed')),
    };

    await expect(provider.performOCR([{ data: pngBuffer }])).rejects.toThrow(
      'Processing failed',
    );
  });

  test('cleans up workers even when one terminate call rejects', async () => {
    const provider = new TesseractProvider();
    const goodWorker = createTesseractWorker();
    const badWorker = {
      terminate: vi.fn().mockRejectedValue(new Error('cleanup failed')),
    };
    (provider as any).workers.set('eng', goodWorker);
    (provider as any).workers.set('fra', badWorker);

    await provider.cleanup();

    expect(goodWorker.terminate).toHaveBeenCalledTimes(1);
    expect(badWorker.terminate).toHaveBeenCalledTimes(1);
    expect((provider as any).workers.size).toBe(0);
  });
});

describe('ONNXGutenyeProvider', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('processes raw RGB data and filters detections by confidence', async () => {
    const detect = vi.fn().mockResolvedValue([
      {
        text: 'Frame detection',
        score: 0.91,
        frame: { left: 1, top: 2, width: 30, height: 12 },
      },
      {
        text: 'Box detection',
        mean: 0.42,
        box: [
          [4, 5],
          [14, 5],
          [14, 17],
          [4, 17],
        ],
      },
      { text: '', score: 0.99 },
    ]);
    const provider = new ONNXGutenyeProvider();
    (provider as any).initialized = true;
    (provider as any).ocrInstance = { detect };

    const result = await provider.performOCR(
      [
        {
          data: Buffer.from([255, 0, 0, 0, 255, 0]),
          width: 2,
          height: 1,
          channels: 3,
        },
        { data: 'unsupported' },
      ],
      { language: 'eng', confidenceThreshold: 50 },
    );

    expect(result.text).toBe('Frame detection Box detection');
    expect(result.confidence).toBeCloseTo(66.5);
    expect(result.detections).toEqual([
      {
        text: 'Frame detection',
        confidence: 91,
        boundingBox: { x: 1, y: 2, width: 30, height: 12 },
      },
    ]);
    expect(result.metadata?.detectionCount).toBe(2);
    expect(detect).toHaveBeenCalledWith(
      {
        data: Buffer.from([255, 0, 0, 0, 255, 0]),
        width: 2,
        height: 1,
        channels: 3,
      },
      { language: 'eng' },
    );
  });

  test('passes encoded JPEG buffers to the native image path', async () => {
    const encoded = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .jpeg()
      .toBuffer();
    const detect = vi.fn().mockResolvedValue([
      {
        text: 'JPEG text',
        mean: 0.8,
      },
    ]);
    const provider = new ONNXGutenyeProvider();
    (provider as any).initialized = true;
    (provider as any).ocrInstance = { detect };

    const result = await provider.performOCR([{ data: encoded }]);

    expect(result.text).toBe('JPEG text');
    expect(result.detections?.[0].boundingBox).toBeUndefined();
    expect(detect).toHaveBeenCalledWith(encoded, { language: 'eng' });
  });

  test('keeps encoded PNG buffers encoded when dimensions are present', async () => {
    const encoded = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    const detect = vi.fn().mockResolvedValue([{ text: 'PNG text', mean: 0.9 }]);
    const provider = new ONNXGutenyeProvider();
    (provider as any).initialized = true;
    (provider as any).ocrInstance = { detect };

    const result = await provider.performOCR([
      { data: Buffer.from(encoded), width: 1, height: 1 },
    ]);

    expect(result.text).toBe('PNG text');
    expect(detect).toHaveBeenCalledWith(encoded, { language: 'eng' });
  });

  test('loads encoded and raw pixels through Sharp 0.35.3', async () => {
    const encoded = await sharp({
      create: {
        width: 2,
        height: 1,
        channels: 4,
        background: { r: 25, g: 50, b: 75, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    const encodedImage = await SharpImageRaw.open(encoded);
    const rawImage = await SharpImageRaw.open({
      data: Buffer.from([255, 0, 0, 0, 255, 0]),
      width: 2,
      height: 1,
      channels: 3,
    });

    expect(nativeDependencyVersions).toEqual({
      sharp: '0.35.3',
      onnxRuntime: '1.27.0',
    });
    expect(encodedImage.getImageRawData()).toMatchObject({
      width: 2,
      height: 1,
    });
    expect(encodedImage.data).toHaveLength(8);
    expect(rawImage.getImageRawData()).toMatchObject({ width: 2, height: 1 });
    expect(rawImage.data).toHaveLength(8);
  });

  test('initializes one real native backend and releases its sessions', async () => {
    const createSession = vi.spyOn(InferenceSession, 'create');
    const releaseSession = vi.spyOn(InferenceSession.prototype, 'release');
    const encoded = await readFile(
      new URL('../../test/test.png', import.meta.url),
    );
    const provider = new ONNXGutenyeProvider();

    try {
      const results = await Promise.all([
        provider.performOCR([{ data: encoded }]),
        provider.performOCR([{ data: encoded }]),
      ]);

      expect(results.every((result) => result.text.trim().length > 0)).toBe(
        true,
      );
      expect(createSession).toHaveBeenCalledTimes(2);
      await provider.cleanup();
      expect(releaseSession).toHaveBeenCalledTimes(2);
    } finally {
      await provider.cleanup();
      createSession.mockRestore();
      releaseSession.mockRestore();
    }
  });

  test('skips unsupported and failed image inputs without throwing', async () => {
    const detect = vi.fn().mockRejectedValue(new Error('detect failed'));
    const provider = new ONNXGutenyeProvider();
    (provider as any).initialized = true;
    (provider as any).ocrInstance = { detect };

    const result = await provider.performOCR([
      { data: Buffer.from('bad image data') },
      {
        data: Buffer.from([255, 0, 0]),
        width: 1,
        height: 1,
        channels: 3,
      },
    ]);

    expect(result.text).toBe('');
    expect(result.confidence).toBe(0);
    expect(result.detections).toEqual([]);
    expect(result.metadata?.detectionCount).toBe(0);
  });

  test('reports capabilities, languages, and cleans up OCR instances', async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    const provider = new ONNXGutenyeProvider();
    (provider as any).initialized = true;
    (provider as any).ocrInstance = { cleanup };

    const capabilities = await provider.checkCapabilities();
    await provider.cleanup();

    expect(capabilities.canPerformOCR).toBe(true);
    expect(provider.getSupportedLanguages()).toContain('eng');
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect((provider as any).ocrInstance).toBeNull();
    expect((provider as any).initialized).toBe(false);
  });

  test('waits for active OCR and serializes concurrent cleanup calls', async () => {
    let finishDetection:
      | ((value: Array<{ text: string; mean: number }>) => void)
      | null = null;
    const detect = vi.fn(
      () =>
        new Promise<Array<{ text: string; mean: number }>>((resolve) => {
          finishDetection = resolve;
        }),
    );
    const cleanup = vi.fn().mockResolvedValue(undefined);
    const provider = new ONNXGutenyeProvider();
    (provider as any).initialized = true;
    (provider as any).ocrInstance = { detect, cleanup };

    const operation = provider.performOCR([{ data: pngBuffer }]);
    await vi.waitFor(() => expect(detect).toHaveBeenCalledTimes(1));
    const firstCleanup = provider.cleanup();
    const secondCleanup = provider.cleanup();

    expect(firstCleanup).toBe(secondCleanup);
    expect(cleanup).not.toHaveBeenCalled();
    finishDetection?.([{ text: 'Finished', mean: 0.9 }]);

    await expect(operation).resolves.toMatchObject({ text: 'Finished' });
    await Promise.all([firstCleanup, secondCleanup]);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  test('retains failed cleanup state so release can be retried', async () => {
    const cleanup = vi
      .fn()
      .mockRejectedValueOnce(new Error('release failed'))
      .mockResolvedValueOnce(undefined);
    const provider = new ONNXGutenyeProvider();
    (provider as any).initialized = true;
    (provider as any).ocrInstance = { detect: vi.fn(), cleanup };

    await expect(provider.cleanup()).rejects.toThrow('release failed');
    expect((provider as any).ocrInstance).not.toBeNull();
    await expect(provider.performOCR([{ data: pngBuffer }])).rejects.toThrow(
      'cleanup must succeed',
    );

    await expect(provider.cleanup()).resolves.toBeUndefined();
    expect(cleanup).toHaveBeenCalledTimes(2);
    expect((provider as any).ocrInstance).toBeNull();
  });
});
