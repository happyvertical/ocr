import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer, type Server, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getOCR } from '../shared/factory';
import { OCRProcessingError } from '../shared/types';
import { PaddleOCRVLProvider } from './paddleocr-vl';

const envelope = (text: string) => ({
  errorCode: 0,
  result: { layoutParsingResults: [{ markdown: { text }, prunedResult: {} }] },
});

let server: Server;
let baseUrl: string;
let calls: { url: string; body: Record<string, unknown>; auth?: string }[];
let respond: (res: ServerResponse, n: number) => void;

const json = (res: ServerResponse, value: unknown) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(value));
};
const solid = (width = 32, height = 16) =>
  sharp({
    create: { width, height, channels: 3, background: '#ffffff' },
  });
const kind = (call: { body: Record<string, unknown> }) =>
  Buffer.from(String(call.body.file), 'base64')
    .subarray(1, 4)
    .toString('ascii');

beforeEach(async () => {
  for (const name of [
    'HAVE_OCR_PADDLEOCR_URL',
    'HAVE_OCR_PADDLEOCR_API_KEY',
    'HAVE_OCR_PADDLEOCR_TIMEOUT',
    'HAVE_PDF_PADDLEOCR_URL',
    'HAVE_PDF_PADDLEOCR_API_KEY',
    'HAVE_OCR_PROVIDER',
    'HAVE_OCR_TIMEOUT',
  ]) {
    vi.stubEnv(name, '');
  }
  calls = [];
  respond = (res, n) => json(res, envelope(`page ${n}`));
  server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    calls.push({
      url: req.url ?? '',
      body: JSON.parse(Buffer.concat(chunks).toString()),
      auth: req.headers.authorization,
    });
    respond(res, calls.length);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as import('node:net').AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  vi.unstubAllEnvs();
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('PaddleOCRVLProvider', () => {
  test('sends a PNG unchanged to /layout-parsing as an image and returns its Markdown', async () => {
    const png = await solid().png().toBuffer();
    const provider = new PaddleOCRVLProvider({
      baseUrl: `${baseUrl}/root/`,
      apiKey: 'k',
    });

    const result = await provider.performOCR([{ data: png }]);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('/root/layout-parsing');
    expect(calls[0].auth).toBe('Bearer k');
    expect(calls[0].body).toEqual({
      file: png.toString('base64'),
      fileType: 1,
      useLayoutDetection: true,
      visualize: false,
    });
    expect(result).toMatchObject({
      text: 'page 1',
      confidence: 100,
      detections: [{ text: 'page 1', confidence: 100 }],
      metadata: { provider: 'paddleocr-vl', pages: 1 },
    });
  });

  test('passes JPEG through and keeps image order', async () => {
    const jpeg = await solid().jpeg().toBuffer();
    const png = await solid().png().toBuffer();
    const provider = new PaddleOCRVLProvider({ baseUrl });

    const result = await provider.performOCR([{ data: jpeg }, { data: png }]);

    expect(result.text).toBe('page 1\n\npage 2');
    expect(Buffer.from(String(calls[0].body.file), 'base64').equals(jpeg)).toBe(
      true,
    );
    expect(result.detections).toHaveLength(2);
  });

  test('sends every page of a multi-page TIFF, in order, as PNG', async () => {
    // Same size (TIFF frames are padded to one size); told apart by colour.
    const colours = ['#ff0000', '#00ff00', '#0000ff'];
    const pages = await Promise.all(
      colours.map((background) =>
        sharp({ create: { width: 30, height: 10, channels: 3, background } })
          .png()
          .toBuffer(),
      ),
    );
    const tiff = await sharp(pages, { join: { animated: true } })
      .tiff()
      .toBuffer();
    expect((await sharp(tiff).metadata()).pages).toBe(3);
    const provider = new PaddleOCRVLProvider({ baseUrl });

    const result = await provider.performOCR([{ data: tiff }]);

    expect(result.text).toBe('page 1\n\npage 2\n\npage 3');
    expect(result.metadata?.pages).toBe(3);
    expect(calls.map(kind)).toEqual(['PNG', 'PNG', 'PNG']);
    const dominant = await Promise.all(
      calls.map(async (call) => {
        const { channels } = await sharp(
          Buffer.from(String(call.body.file), 'base64'),
        ).stats();
        return channels.slice(0, 3).findIndex((c) => c.mean > 200);
      }),
    );
    expect(dominant).toEqual([0, 1, 2]);
  });

  test('converts WebP and raw pixels to PNG', async () => {
    const webp = await solid().webp().toBuffer();
    const raw = new Uint8Array(4 * 2 * 3).fill(255);
    const provider = new PaddleOCRVLProvider({ baseUrl });

    await provider.performOCR([
      { data: webp },
      { data: raw, width: 4, height: 2, channels: 3 },
    ]);

    expect(calls.map(kind)).toEqual(['PNG', 'PNG']);
  });

  test('reads base64, data URLs and local paths, and refuses remote URLs', async () => {
    const png = await solid().png().toBuffer();
    const dir = await mkdtemp(join(tmpdir(), 'paddleocr-vl-'));
    try {
      const path = join(dir, 'scan.png');
      await writeFile(path, png);
      const provider = new PaddleOCRVLProvider({ baseUrl });

      await provider.performOCR([
        { data: png.toString('base64') },
        { data: `data:image/png;base64,${png.toString('base64')}` },
        { data: path },
      ]);
      expect(calls).toHaveLength(3);
      for (const call of calls) {
        expect(call.body.file).toBe(png.toString('base64'));
      }

      await expect(
        provider.performOCR([{ data: 'https://example.com/a.png' }]),
      ).rejects.toThrow(/URLs are not supported/);
      expect(calls).toHaveLength(3);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('refuses unknown and undecodable input before any request', async () => {
    const provider = new PaddleOCRVLProvider({ baseUrl });
    await expect(
      provider.performOCR([{ data: new Uint8Array([1, 2, 3, 4]) }]),
    ).rejects.toThrow(/Unsupported image/);
    const brokenTiff = Buffer.from([0x49, 0x49, 0x2a, 0x00, 1, 2, 3]);
    await expect(provider.performOCR([{ data: brokenTiff }])).rejects.toThrow(
      /could not be decoded \(image\/tiff\)/,
    );
    expect(calls).toHaveLength(0);
  });

  test('refuses truncated PNG and JPEG before any remote request', async () => {
    const provider = new PaddleOCRVLProvider({ baseUrl });
    for (const data of [
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      Buffer.from([255, 216, 255]),
    ]) {
      await expect(provider.performOCR([{ data }])).rejects.toBeInstanceOf(
        OCRProcessingError,
      );
    }
    expect(calls).toHaveLength(0);
  });

  test('sanitizes local read failures', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'private-document-'));
    try {
      const error = await new PaddleOCRVLProvider({ baseUrl })
        .performOCR([{ data: dir }])
        .catch((e) => e);
      expect(error).toBeInstanceOf(OCRProcessingError);
      expect(error.message).not.toContain(dir);
      expect(calls).toHaveLength(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test('returns an empty result for no images without a request', async () => {
    const result = await new PaddleOCRVLProvider({ baseUrl }).performOCR([]);
    expect(result).toMatchObject({ text: '', confidence: 0 });
    expect(calls).toHaveLength(0);
  });

  test('maps HTTP, API and envelope failures without echoing the response', async () => {
    const png = await solid().png().toBuffer();
    const provider = new PaddleOCRVLProvider({ baseUrl });

    respond = (res) => {
      res.statusCode = 503;
      res.end('secret document text');
    };
    const http = await provider.performOCR([{ data: png }]).catch((e) => e);
    expect(http).toBeInstanceOf(OCRProcessingError);
    expect(http.message).toContain('(503)');
    expect(http.message).not.toContain('secret');

    respond = (res) =>
      json(res, { errorCode: 500, errorMsg: 'secret document text' });
    const api = await provider.performOCR([{ data: png }]).catch((e) => e);
    expect(api.message).toContain('parsing failure');
    expect(api.message).not.toContain('secret');

    respond = (res) => json(res, { errorCode: 0, result: {} });
    await expect(provider.performOCR([{ data: png }])).rejects.toThrow(
      /Invalid PaddleOCR-VL response/,
    );
    expect(calls).toHaveLength(3);
  });

  test('times out with its own deadline and ignores HAVE_OCR_TIMEOUT', async () => {
    const png = await solid().png().toBuffer();
    respond = (res, n) => {
      setTimeout(() => json(res, envelope(`page ${n}`)), 60);
    };

    const quick = new PaddleOCRVLProvider({ baseUrl, timeout: 10 });
    await expect(quick.performOCR([{ data: png }])).rejects.toThrow(
      /timed out after 10ms/,
    );

    vi.stubEnv('HAVE_OCR_TIMEOUT', '1');
    vi.stubEnv('HAVE_OCR_PADDLEOCR_URL', baseUrl);
    const viaFactory = getOCR({ provider: 'paddleocr-vl' });
    const result = await viaFactory.performOCR([{ data: png }]);
    expect(result.text).toMatch(/^page \d$/);
  });

  test('takes its settings from HAVE_OCR_PADDLEOCR_*, then HAVE_PDF_PADDLEOCR_*', async () => {
    const png = await solid().png().toBuffer();
    vi.stubEnv('HAVE_PDF_PADDLEOCR_URL', baseUrl);
    vi.stubEnv('HAVE_PDF_PADDLEOCR_API_KEY', 'pdf-key');
    await new PaddleOCRVLProvider().performOCR([{ data: png }]);
    expect(calls[0].auth).toBe('Bearer pdf-key');

    vi.stubEnv('HAVE_OCR_PADDLEOCR_URL', `${baseUrl}/ocr`);
    vi.stubEnv('HAVE_OCR_PADDLEOCR_API_KEY', 'ocr-key');
    await new PaddleOCRVLProvider().performOCR([{ data: png }]);
    expect(calls[1]).toMatchObject({
      url: '/ocr/layout-parsing',
      auth: 'Bearer ocr-key',
    });
  });

  test('reports unavailable without a valid base URL, without probing', async () => {
    const none = await new PaddleOCRVLProvider().checkDependencies();
    expect(none.available).toBe(false);
    expect(none.error).toContain('HAVE_OCR_PADDLEOCR_URL');

    const bad = await new PaddleOCRVLProvider({
      baseUrl: 'http://user:pw@host/',
    }).checkDependencies();
    expect(bad.available).toBe(false);

    const ok = await new PaddleOCRVLProvider({ baseUrl }).checkDependencies();
    expect(ok.available).toBe(true);
    expect(calls).toHaveLength(0);
  });

  test('is selected by name through the factory and never by auto', async () => {
    const png = await solid().png().toBuffer();
    vi.stubEnv('HAVE_OCR_PADDLEOCR_URL', baseUrl);

    const named = getOCR({ provider: 'paddleocr-vl' });
    const result = await named.performOCR([{ data: png }]);
    expect(result.metadata?.provider).toBe('paddleocr-vl');

    const configured = getOCR({
      provider: 'paddleocr-vl',
      providerConfig: { 'paddleocr-vl': { baseUrl: `${baseUrl}/cfg` } },
    });
    await configured.performOCR([{ data: png }]);
    expect(calls[1].url).toBe('/cfg/layout-parsing');

    const auto = getOCR({ provider: 'auto' }) as unknown as {
      getProviderPriority(): string[];
    };
    expect(auto.getProviderPriority()).not.toContain('paddleocr-vl');
    expect(calls).toHaveLength(2);
  });

  test('converts a real BMP to PNG without changing colours', async () => {
    const bmp = Buffer.alloc(62);
    bmp.write('BM');
    bmp.writeUInt32LE(62, 2);
    bmp.writeUInt32LE(54, 10);
    bmp.writeUInt32LE(40, 14);
    bmp.writeInt32LE(2, 18);
    bmp.writeInt32LE(1, 22);
    bmp.writeUInt16LE(1, 26);
    bmp.writeUInt16LE(24, 28);
    bmp.writeUInt32LE(8, 34);
    bmp.set([0, 0, 255, 0, 255, 0, 0, 0], 54);
    await new PaddleOCRVLProvider({ baseUrl }).performOCR([{ data: bmp }]);
    expect(calls.map(kind)).toEqual(['PNG']);
    const pixels = await sharp(
      Buffer.from(String(calls[0].body.file), 'base64'),
    )
      .removeAlpha()
      .raw()
      .toBuffer();
    expect([...pixels]).toEqual([255, 0, 0, 0, 255, 0]);
    const huge = Buffer.from(bmp);
    huge.writeInt32LE(1_000_000, 18);
    for (const data of [bmp.subarray(0, 55), huge]) {
      await expect(
        new PaddleOCRVLProvider({ baseUrl }).performOCR([{ data }]),
      ).rejects.toThrow(/could not be decoded/);
    }
    expect(calls).toHaveLength(1);
  });

  test('rejects missing or extra response pages, while accepting a blank page', async () => {
    const provider = new PaddleOCRVLProvider({ baseUrl });
    const png = await solid().png().toBuffer();
    for (const pages of [
      [],
      [{ markdown: { text: 'a' } }, { markdown: { text: 'b' } }],
    ]) {
      respond = (res) =>
        json(res, { errorCode: 0, result: { layoutParsingResults: pages } });
      await expect(provider.performOCR([{ data: png }])).rejects.toThrow(
        /Invalid PaddleOCR-VL response/,
      );
    }
    respond = (res) => json(res, envelope(''));
    expect(await provider.performOCR([{ data: png }])).toMatchObject({
      text: '',
      confidence: 0,
      metadata: { pages: 1 },
    });
  });

  test('sends only the first frame of an animated GIF', async () => {
    const frames = await Promise.all(
      ['#ff0000', '#00ff00', '#0000ff'].map((background) =>
        sharp({ create: { width: 20, height: 10, channels: 3, background } })
          .png()
          .toBuffer(),
      ),
    );
    const gif = await sharp(frames, { join: { animated: true } })
      .gif()
      .toBuffer();
    expect((await sharp(gif).metadata()).pages).toBe(3);

    const result = await new PaddleOCRVLProvider({ baseUrl }).performOCR([
      { data: gif },
    ]);

    expect(calls).toHaveLength(1);
    expect(result.metadata?.pages).toBe(1);
  });

  test('refuses 16-bit or mis-sized raw pixels, and treats declared raw as raw', async () => {
    const provider = new PaddleOCRVLProvider({ baseUrl });
    await expect(
      provider.performOCR([
        {
          data: new Uint8Array(4 * 4 * 2),
          width: 4,
          height: 4,
          channels: 1,
          bitsPerComponent: 16,
        },
      ]),
    ).rejects.toThrow(/8-bit samples/);
    await expect(
      provider.performOCR([
        { data: new Uint8Array(5), width: 4, height: 4, channels: 1 },
      ]),
    ).rejects.toThrow(/width x height x channels/);
    expect(calls).toHaveLength(0);

    // Starts with "BM", which would sniff as BMP.
    const raw = new Uint8Array(2 * 2 * 3).fill(255);
    raw[0] = 0x42;
    raw[1] = 0x4d;
    await provider.performOCR([
      { data: raw, width: 2, height: 2, channels: 3 },
    ]);
    expect(calls.map(kind)).toEqual(['PNG']);
  });
});
