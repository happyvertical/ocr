// biome-ignore-all lint/style/useNamingConvention: SGLang/vLLM/OpenAI request fields are snake_case.
// biome-ignore-all lint/complexity/useLiteralKeys: Tests assert exact wire-format field names.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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
  beforeEach(() => {
    delete process.env.HAVE_OCR_UNLIMITED_BACKEND;
  });

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

  test('keeps direct transport for an explicit base URL despite ambient Bifrost env', async () => {
    delete process.env.HAVE_OCR_UNLIMITED_TRANSPORT;
    process.env.BIFROST_BASE_URL = 'https://bifrost.happyvertical.com';
    process.env.BIFROST_API_KEY = 'ambient-key';

    const fetchMock = vi.fn(
      async (input: Parameters<typeof fetch>[0], _init?: RequestInit) => {
        expect(String(input)).toBe(
          'http://127.0.0.1:10000/v1/chat/completions',
        );
        return Response.json({
          choices: [{ message: { content: 'Direct text' } }],
        });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new UnlimitedOCRProvider({
      baseUrl: 'http://127.0.0.1:10000',
      stream: false,
    });

    const result = await provider.performOCR([{ data: pngBuffer() }]);

    expect(result.text).toBe('Direct text');
    expect(result.metadata?.transport).toBe('direct');
  });

  test('keeps direct transport for a direct base URL env despite ambient Bifrost env', async () => {
    delete process.env.HAVE_OCR_UNLIMITED_TRANSPORT;
    process.env.HAVE_OCR_UNLIMITED_BASE_URL = 'http://127.0.0.1:10000';
    process.env.BIFROST_BASE_URL = 'https://bifrost.happyvertical.com';
    process.env.BIFROST_API_KEY = 'ambient-key';

    const fetchMock = vi.fn(
      async (input: Parameters<typeof fetch>[0], _init?: RequestInit) => {
        expect(String(input)).toBe(
          'http://127.0.0.1:10000/v1/chat/completions',
        );
        return Response.json({
          choices: [{ message: { content: 'Direct env text' } }],
        });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new UnlimitedOCRProvider({ stream: false });

    const result = await provider.performOCR([{ data: pngBuffer() }]);

    expect(result.text).toBe('Direct env text');
    expect(result.metadata?.transport).toBe('direct');
  });

  test('infers bifrost transport from ambient Bifrost env when no direct endpoint is set', async () => {
    delete process.env.HAVE_OCR_UNLIMITED_TRANSPORT;
    delete process.env.HAVE_OCR_UNLIMITED_BASE_URL;
    delete process.env.HAVE_OCR_BIFROST_BASE_URL;
    delete process.env.HAVE_OCR_BIFROST_API_KEY;
    process.env.BIFROST_BASE_URL = 'https://bifrost.happyvertical.com';
    process.env.BIFROST_API_KEY = 'ambient-key';

    const fetchMock = vi.fn(
      async (input: Parameters<typeof fetch>[0], _init?: RequestInit) => {
        expect(String(input)).toBe(
          'https://bifrost.happyvertical.com/openai/chat/completions',
        );
        return Response.json({
          choices: [{ message: { content: 'Gateway text' } }],
        });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const provider = new UnlimitedOCRProvider({ stream: false });

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
  describe('vllm backend', () => {
    function captureBody() {
      const bodies: Array<Record<string, unknown>> = [];
      const fetchMock = vi.fn(
        async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
          expect(String(input)).toBe(
            'http://127.0.0.1:8000/v1/chat/completions',
          );
          bodies.push(
            JSON.parse(String(init?.body)) as Record<string, unknown>,
          );
          return Response.json({
            choices: [{ message: { content: 'vLLM text' } }],
          });
        },
      );
      vi.stubGlobal('fetch', fetchMock);
      return bodies;
    }

    function contentOf(body: Record<string, unknown>) {
      const messages = body.messages as Array<{
        content: Array<{ type: string; text?: string; image_url?: unknown }>;
      }>;
      return messages[0].content;
    }

    test('sends the vLLM recipe request shape for one image', async () => {
      const bodies = captureBody();
      const provider = new UnlimitedOCRProvider({
        baseUrl: 'http://127.0.0.1:8000',
        backend: 'vllm',
        stream: false,
        // SGLang-only knobs must not leak into a vLLM request.
        customLogitProcessor: 'processor-string',
        imageMode: 'base',
      });

      const result = await provider.performOCR([{ data: pngBuffer() }]);

      const body = bodies[0];
      expect(body).toMatchObject({
        model: 'Unlimited-OCR',
        temperature: 0,
        skip_special_tokens: false,
        stream: false,
        vllm_xargs: { ngram_size: 35, window_size: 128 },
      });
      expect(body).not.toHaveProperty('custom_params');
      expect(body).not.toHaveProperty('images_config');
      expect(body).not.toHaveProperty('custom_logit_processor');
      const content = contentOf(body);
      expect(content).toHaveLength(2);
      expect(content[0]).toEqual({
        type: 'text',
        text: '<image>document parsing.',
      });
      expect(content[1].type).toBe('image_url');
      expect(result.text).toBe('vLLM text');
      expect(result.metadata).toMatchObject({
        backend: 'vllm',
        imageMode: 'gundam',
      });
    });

    test('uses the multi-page prompt and 1024 window for multiple images', async () => {
      const bodies = captureBody();
      const provider = new UnlimitedOCRProvider({
        baseUrl: 'http://127.0.0.1:8000',
        backend: 'vllm',
        stream: false,
      });

      const result = await provider.performOCR(
        [{ data: pngBuffer() }, { data: pngBuffer() }],
        { language: 'eng' },
      );

      const body = bodies[0];
      expect(body['vllm_xargs']).toEqual({ ngram_size: 35, window_size: 1024 });
      expect(body).not.toHaveProperty('images_config');
      const content = contentOf(body);
      expect(content).toHaveLength(3);
      expect(content[0]).toEqual({
        type: 'text',
        text: '<image><image>Multi page parsing. Preferred OCR language(s): eng.',
      });
      expect(result.metadata?.imageMode).toBe('base');
    });

    test('reads backend, prompts, and n-gram overrides from env', async () => {
      process.env.HAVE_OCR_UNLIMITED_BACKEND = 'VLLM';
      process.env.HAVE_OCR_UNLIMITED_PROMPT = 'Free OCR.';
      process.env.HAVE_OCR_UNLIMITED_NGRAM_SIZE = '20';
      process.env.HAVE_OCR_UNLIMITED_NGRAM_WINDOW = '512';
      const bodies = captureBody();
      const provider = new UnlimitedOCRProvider({
        baseUrl: 'http://127.0.0.1:8000',
        stream: false,
      });

      await provider.performOCR([{ data: pngBuffer() }]);

      const body = bodies[0];
      expect(body['vllm_xargs']).toEqual({ ngram_size: 20, window_size: 512 });
      expect(contentOf(body)[0].text).toBe('<image>Free OCR.');
      await expect(provider.checkDependencies()).resolves.toMatchObject({
        details: { backend: 'vllm' },
      });
    });

    test('does not double the <image> token on an already-prefixed prompt', async () => {
      const bodies = captureBody();
      const provider = new UnlimitedOCRProvider({
        baseUrl: 'http://127.0.0.1:8000',
        backend: 'vllm',
        prompt: '<image>document parsing.',
        stream: false,
      });

      await provider.performOCR([{ data: pngBuffer() }]);

      expect(contentOf(bodies[0])[0].text).toBe('<image>document parsing.');
    });

    test.each([
      [1, '<image>document parsing.'],
      [2, '<image><image>Multi page parsing.'],
      [3, '<image><image><image>Multi page parsing.'],
    ])(
      'sends one <image> placeholder per image for %i image(s)',
      async (count, text) => {
        const bodies = captureBody();
        const provider = new UnlimitedOCRProvider({
          baseUrl: 'http://127.0.0.1:8000',
          backend: 'vllm',
          stream: false,
        });

        await provider.performOCR(
          Array.from({ length: count }, () => ({ data: pngBuffer() })),
        );

        const content = contentOf(bodies[0]);
        expect(content[0]).toEqual({ type: 'text', text });
        expect(
          content.filter((part) => part.type === 'image_url'),
        ).toHaveLength(count);
      },
    );

    test('counts placeholders after dropping invalid images', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const bodies = captureBody();
      const provider = new UnlimitedOCRProvider({
        baseUrl: 'http://127.0.0.1:8000',
        backend: 'vllm',
        stream: false,
      });

      await provider.performOCR([
        { data: pngBuffer() },
        { data: Buffer.from([1, 2, 3]) },
        { data: pngBuffer() },
      ]);

      const content = contentOf(bodies[0]);
      expect(content[0].text).toBe('<image><image>Multi page parsing.');
      expect(content).toHaveLength(3);
      warn.mockRestore();
    });

    test('keeps a configured prompt whose placeholders match the image count', async () => {
      const bodies = captureBody();
      const provider = new UnlimitedOCRProvider({
        baseUrl: 'http://127.0.0.1:8000',
        backend: 'vllm',
        multiPagePrompt: '<image>\n<image>\nMulti page parsing.',
        stream: false,
      });

      await provider.performOCR([{ data: pngBuffer() }, { data: pngBuffer() }]);

      expect(contentOf(bodies[0])[0].text).toBe(
        '<image>\n<image>\nMulti page parsing.',
      );
    });

    test('rewrites a configured prompt whose placeholders do not match', async () => {
      const bodies = captureBody();
      const provider = new UnlimitedOCRProvider({
        baseUrl: 'http://127.0.0.1:8000',
        backend: 'vllm',
        multiPagePrompt: '<image>Multi page parsing.',
        stream: false,
      });

      await provider.performOCR([
        { data: pngBuffer() },
        { data: pngBuffer() },
        { data: pngBuffer() },
      ]);

      expect(contentOf(bodies[0])[0].text).toBe(
        '<image><image><image>Multi page parsing.',
      );
    });

    test('lets extraRequestBody override vllm_xargs last', async () => {
      const bodies = captureBody();
      const provider = new UnlimitedOCRProvider({
        baseUrl: 'http://127.0.0.1:8000',
        backend: 'vllm',
        stream: false,
        extraRequestBody: { max_tokens: 8192 },
      });

      await provider.performOCR([{ data: pngBuffer() }]);

      expect(bodies[0]).toMatchObject({
        max_tokens: 8192,
        vllm_xargs: { ngram_size: 35, window_size: 128 },
      });
    });

    test('defaults to the sglang backend and ignores unknown backend env', async () => {
      process.env.HAVE_OCR_UNLIMITED_BACKEND = 'tgi';
      const bodies: Array<Record<string, unknown>> = [];
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async (_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
            bodies.push(
              JSON.parse(String(init?.body)) as Record<string, unknown>,
            );
            return Response.json({ choices: [{ message: { content: 'x' } }] });
          },
        ),
      );
      const provider = new UnlimitedOCRProvider({
        baseUrl: 'http://127.0.0.1:10000',
        stream: false,
      });

      await provider.performOCR([{ data: pngBuffer() }]);

      expect(bodies[0]).not.toHaveProperty('vllm_xargs');
      expect(bodies[0]['custom_params']).toEqual({
        ngram_size: 35,
        window_size: 128,
      });
      expect(contentOf(bodies[0])[0].text).toBe('document parsing.');
      await expect(provider.checkCapabilities()).resolves.toMatchObject({
        providerSpecific: { backend: 'sglang' },
      });
    });
  });
});
