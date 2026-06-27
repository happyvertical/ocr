// biome-ignore-all lint/style/useNamingConvention: SGLang/OpenAI request fields are snake_case.
// biome-ignore-all lint/complexity/useLiteralKeys: Tests assert exact wire-format field names.

import { afterEach, describe, expect, test, vi } from 'vitest';
import { UnlimitedOCRProvider } from './unlimited-ocr';

const originalEnv = { ...process.env };

function pngBuffer(): Buffer {
  return Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...Array(128).fill(0),
  ]);
}

describe('UnlimitedOCRProvider', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  test('reports unavailable when no endpoint is configured', async () => {
    delete process.env.HAVE_OCR_UNLIMITED_BASE_URL;
    delete process.env.HAVE_OCR_BIFROST_BASE_URL;
    delete process.env.BIFROST_BASE_URL;

    const provider = new UnlimitedOCRProvider();
    const deps = await provider.checkDependencies();

    expect(deps.available).toBe(false);
    expect(deps.error).toContain('base URL');
  });

  test('sends a direct SGLang request with Unlimited-OCR defaults', async () => {
    const fetchMock = vi.fn(
      async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        expect(String(input)).toBe(
          'http://127.0.0.1:10000/v1/chat/completions',
        );
        expect(init?.method).toBe('POST');
        expect(init?.headers).toMatchObject({
          'Content-Type': 'application/json',
        });

        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        expect(body).toMatchObject({
          model: 'Unlimited-OCR',
          temperature: 0,
          skip_special_tokens: false,
          images_config: { image_mode: 'gundam' },
          custom_params: {
            ngram_size: 35,
            window_size: 128,
          },
          custom_logit_processor: 'processor-string',
          stream: false,
        });
        const messages = body.messages as Array<{
          content: Array<{
            type: string;
            text?: string;
            image_url?: { url: string };
          }>;
        }>;
        expect(messages[0].content[0]).toEqual({
          type: 'text',
          text: 'document parsing. Preferred OCR language(s): eng.',
        });
        expect(messages[0].content[1].image_url?.url).toMatch(
          /^data:image\/png;base64,/,
        );

        return Response.json({
          choices: [{ message: { content: 'Recognized text' } }],
          model: 'Unlimited-OCR',
        });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new UnlimitedOCRProvider({
      baseUrl: 'http://127.0.0.1:10000',
      customLogitProcessor: 'processor-string',
      stream: false,
    });

    const result = await provider.performOCR(
      [{ data: pngBuffer(), format: 'png' }],
      { language: 'eng' },
    );

    expect(result.text).toBe('Recognized text');
    expect(result.confidence).toBe(100);
    expect(result.metadata).toMatchObject({
      provider: 'unlimited-ocr',
      transport: 'direct',
      model: 'Unlimited-OCR',
      imageMode: 'gundam',
    });
  });

  test('normalizes Bifrost root URL and sends virtual-key headers', async () => {
    const fetchMock = vi.fn(
      async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        expect(String(input)).toBe(
          'https://bifrost.happyvertical.com/openai/chat/completions',
        );
        expect(init?.headers).toMatchObject({
          Authorization: 'Bearer virtual-key',
          'x-bf-vk': 'virtual-key',
          'x-api-key': 'virtual-key',
        });

        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        expect(body.model).toBe('Unlimited-OCR');
        return Response.json({
          choices: [{ message: { content: 'Gateway text' } }],
        });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new UnlimitedOCRProvider({
      transport: 'bifrost',
      baseUrl: 'https://bifrost.happyvertical.com',
      apiKey: 'virtual-key',
      stream: false,
    });

    const result = await provider.performOCR([{ data: pngBuffer() }]);

    expect(result.text).toBe('Gateway text');
    expect(result.metadata?.transport).toBe('bifrost');
  });

  test('uses base mode and multi-page prompt for multiple images', async () => {
    const fetchMock = vi.fn(
      async (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>;

        expect(body['images_config']).toEqual({ image_mode: 'base' });
        expect(body['custom_params']).toEqual({
          ngram_size: 35,
          window_size: 1024,
        });
        const messages = body.messages as Array<{
          content: Array<{ type: string; text?: string }>;
        }>;
        expect(messages[0].content[0]).toEqual({
          type: 'text',
          text: 'Multi page parsing.',
        });
        expect(messages[0].content).toHaveLength(3);

        return Response.json({
          choices: [{ message: { content: 'Page one\nPage two' } }],
        });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new UnlimitedOCRProvider({
      baseUrl: 'http://localhost:10000/v1',
      stream: false,
    });

    const result = await provider.performOCR([
      { data: pngBuffer() },
      { data: pngBuffer() },
    ]);

    expect(result.text).toBe('Page one\nPage two');
    expect(result.metadata?.imageMode).toBe('base');
  });

  test('parses streaming chat completion responses', async () => {
    const streamBody = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}',
      '',
      'data: {"choices":[{"delta":{"content":" world"}}]}',
      '',
      'data: [DONE]',
    ].join('\n');

    const fetchMock = vi.fn(async () => new Response(streamBody));
    vi.stubGlobal('fetch', fetchMock);

    const provider = new UnlimitedOCRProvider({
      baseUrl: 'http://localhost:10000',
      stream: true,
    });

    const result = await provider.performOCR([{ data: pngBuffer() }]);

    expect(result.text).toBe('Hello world');
  });

  test('falls back to JSON parsing when a streaming request returns JSON', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        Response.json({
          choices: [{ message: { content: 'Non-streamed text' } }],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new UnlimitedOCRProvider({
      baseUrl: 'http://localhost:10000',
      stream: true,
    });

    const result = await provider.performOCR([{ data: pngBuffer() }]);

    expect(result.text).toBe('Non-streamed text');
  });

  test('uses per-call timeout option over provider timeout', async () => {
    const fetchMock = vi.fn(
      (_input: Parameters<typeof fetch>[0], init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new UnlimitedOCRProvider({
      baseUrl: 'http://localhost:10000',
      stream: false,
      timeout: 60_000,
    });

    await expect(
      provider.performOCR([{ data: pngBuffer() }], { timeout: 1 }),
    ).rejects.toThrow('1ms');
  });
});
