import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { WebOCRProvider } from './web-ocr';

const originalBrowserGlobals = {
  window: (globalThis as any).window,
  document: (globalThis as any).document,
  WebAssembly: (globalThis as any).WebAssembly,
  atob: (globalThis as any).atob,
};

const createWorker = (recognize = vi.fn()) => ({
  recognize,
  terminate: vi.fn().mockResolvedValue(undefined),
});

const installBrowserGlobals = () => {
  (globalThis as any).window = {};
  (globalThis as any).document = {};
  (globalThis as any).WebAssembly = {};
  (globalThis as any).atob =
    originalBrowserGlobals.atob ??
    ((value: string) => Buffer.from(value, 'base64').toString('binary'));
};

const restoreBrowserGlobals = () => {
  if (originalBrowserGlobals.window === undefined) {
    delete (globalThis as any).window;
  } else {
    (globalThis as any).window = originalBrowserGlobals.window;
  }

  if (originalBrowserGlobals.document === undefined) {
    delete (globalThis as any).document;
  } else {
    (globalThis as any).document = originalBrowserGlobals.document;
  }

  (globalThis as any).WebAssembly = originalBrowserGlobals.WebAssembly;

  if (originalBrowserGlobals.atob === undefined) {
    delete (globalThis as any).atob;
  } else {
    (globalThis as any).atob = originalBrowserGlobals.atob;
  }
};

describe('WebOCRProvider', () => {
  beforeEach(() => {
    installBrowserGlobals();
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreBrowserGlobals();
  });

  test('reports unavailable outside browser environments', async () => {
    delete (globalThis as any).window;
    delete (globalThis as any).document;

    const provider = new WebOCRProvider();
    const dependencies = await provider.checkDependencies();

    expect(dependencies.available).toBe(false);
    expect(dependencies.error).toContain('browser environment');
    expect(dependencies.details.browserEnvironment).toBe(false);
  });

  test('reports unavailable when WebAssembly is missing', async () => {
    delete (globalThis as any).WebAssembly;

    const provider = new WebOCRProvider();
    const dependencies = await provider.checkDependencies();

    expect(dependencies.available).toBe(false);
    expect(dependencies.error).toContain('WebAssembly');
    expect(dependencies.details.browserEnvironment).toBe(true);
  });

  test('checks dependencies and cleans up the probe worker', async () => {
    const probeWorker = createWorker();
    const provider = new WebOCRProvider();
    (provider as any).tesseract = {
      createWorker: vi.fn().mockResolvedValue(probeWorker),
    };

    const dependencies = await provider.checkDependencies();

    expect(dependencies.available).toBe(true);
    expect(dependencies.details).toEqual({
      browserEnvironment: true,
      tesseractJs: true,
      webAssembly: true,
      worker: true,
    });
    expect(probeWorker.terminate).toHaveBeenCalledTimes(1);
  });

  test('returns browser OCR results with words and mapped language code', async () => {
    (globalThis as any).atob = vi.fn((value: string) => {
      if (value === 'invalid-base64') {
        throw new Error('bad base64');
      }
      return Buffer.from(value, 'base64').toString('binary');
    });
    const probeWorker = createWorker();
    const ocrWorker = createWorker(
      vi.fn().mockResolvedValue({
        data: {
          text: ' Browser text ',
          confidence: 80,
          words: [
            {
              text: 'Browser',
              confidence: 82,
              bbox: { x0: 1, y0: 2, x1: 9, y1: 12 },
            },
            { text: ' ', confidence: 20 },
            {
              text: 'text',
              confidence: 78,
              bbox: { x0: 10, y0: 2, x1: 18, y1: 12 },
            },
          ],
        },
      }),
    );
    const provider = new WebOCRProvider();
    (provider as any).tesseract = {
      createWorker: vi
        .fn()
        .mockResolvedValueOnce(probeWorker)
        .mockResolvedValueOnce(ocrWorker),
    };

    const result = await provider.performOCR(
      [
        { data: new Uint8Array([1, 2, 3]) },
        { data: 'data:image/png;base64,abc' },
        { data: Buffer.from([4, 5, 6]) },
        { data: Buffer.from('ignored').toString('base64') },
        { data: 'invalid-base64' },
      ],
      { language: 'en' },
    );

    expect(result.text).toBe(
      'Browser text Browser text Browser text Browser text',
    );
    expect(result.confidence).toBe(80);
    expect(result.detections).toHaveLength(8);
    expect(result.detections?.[0].boundingBox).toEqual({
      x: 1,
      y: 2,
      width: 8,
      height: 10,
    });
    expect(result.metadata?.environment).toBe('browser');
    expect(ocrWorker.recognize).toHaveBeenCalledTimes(4);
    expect((provider as any).tesseract.createWorker).toHaveBeenLastCalledWith(
      'eng',
      expect.any(Object),
    );
  });

  test('uses whole-text detection when no word data is returned', async () => {
    const provider = new WebOCRProvider();
    (provider as any).tesseract = {
      createWorker: vi
        .fn()
        .mockResolvedValueOnce(createWorker())
        .mockResolvedValueOnce(
          createWorker(
            vi.fn().mockResolvedValue({
              data: {
                text: 'Full text',
                confidence: 70,
              },
            }),
          ),
        ),
    };

    const result = await provider.performOCR([{ data: new Uint8Array([1]) }]);

    expect(result.detections).toEqual([
      { text: 'Full text', confidence: 70, boundingBox: undefined },
    ]);
  });

  test('wraps worker creation failures as OCR processing errors', async () => {
    const provider = new WebOCRProvider();
    (provider as any).tesseract = {
      createWorker: vi
        .fn()
        .mockResolvedValueOnce(createWorker())
        .mockRejectedValueOnce(new Error('worker failed')),
    };

    await expect(
      provider.performOCR([{ data: new Uint8Array([1]) }]),
    ).rejects.toThrow('Processing failed');
  });

  test('cleans up cached workers', async () => {
    const worker = createWorker();
    const provider = new WebOCRProvider();
    (provider as any).workers.set('eng', worker);

    await provider.cleanup();

    expect(worker.terminate).toHaveBeenCalledTimes(1);
    expect((provider as any).workers.size).toBe(0);
  });
});
