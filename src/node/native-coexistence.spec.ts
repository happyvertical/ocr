import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, test } from 'vitest';

const execFileAsync = promisify(execFile);
const glibcVersion =
  process.platform === 'linux'
    ? process.report.getReport().header.glibcVersionRuntime
    : undefined;
const [glibcMajor = 0, glibcMinor = 0] = (glibcVersion ?? '')
  .split('.')
  .map(Number);
const declaredKreuzbergTuple =
  (process.platform === 'darwin' && process.arch === 'arm64') ||
  (process.platform === 'win32' && process.arch === 'x64') ||
  (process.platform === 'linux' &&
    (process.arch === 'arm64' || process.arch === 'x64') &&
    Boolean(glibcVersion));
const incompatibleLinuxABI =
  process.platform === 'linux' &&
  Boolean(glibcVersion) &&
  (glibcMajor < 2 || (glibcMajor === 2 && glibcMinor < 39));

async function canLoadKreuzberg(): Promise<boolean> {
  try {
    await execFileAsync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        "const kreuzberg = await import('@kreuzberg/node'); kreuzberg.listOcrBackends();",
      ],
      { cwd: process.cwd(), timeout: 30_000 },
    );
    return true;
  } catch {
    if (declaredKreuzbergTuple && !incompatibleLinuxABI) {
      throw new Error(
        `Kreuzberg native bindings must load on ${process.platform}-${process.arch}`,
      );
    }
    return false;
  }
}

const kreuzbergAvailable = await canLoadKreuzberg();

async function exerciseNativeConsumer(entrypoint: string) {
  const source = `
      import { readFile } from 'node:fs/promises';
      import { pathToFileURL } from 'node:url';

      const kreuzberg = await import('@kreuzberg/node');
      kreuzberg.listOcrBackends();
      await import('sharp');

      const entrypoint = pathToFileURL(process.argv[1]).href;
      const { getAvailableProviders, getProviderInfo, OCRFactory } = await import(entrypoint);
      const providers = await getAvailableProviders();
      const onnxInfo = await getProviderInfo('onnx');
      const discoveryAddons = process.report.getReport().sharedObjects;

      const factory = new OCRFactory({ provider: 'onnx' });
      const image = await readFile(process.argv[2]);
      const ocrResult = await factory.performOCR([{ data: image }]);
      await factory.cleanup();

      console.log(JSON.stringify({
        discoveryAddons,
        nativeAddons: process.report.getReport().sharedObjects,
        ocrText: ocrResult.text,
        onnxInfo,
        providers,
      }));
    `;
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync(
      process.execPath,
      [
        '--import',
        'tsx',
        '--input-type=module',
        '--eval',
        source,
        entrypoint,
        resolve('test/test.png'),
      ],
      {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024,
        timeout: 120_000,
      },
    ));
  } catch {
    throw new Error(
      `Native consumer must support OCR discovery and execution on ${process.platform}-${process.arch}`,
    );
  }
  return JSON.parse(stdout.trim()) as {
    discoveryAddons: string[];
    nativeAddons: string[];
    ocrText: string;
    onnxInfo: { available: boolean } | null;
    providers: string[];
  };
}

function assertNativeCoexistence(
  result: Awaited<ReturnType<typeof exerciseNativeConsumer>>,
) {
  expect(result.providers).toContain('onnx');
  expect(result.onnxInfo?.available).toBe(true);
  expect(result.ocrText.trim().length).toBeGreaterThan(0);

  expect(
    result.discoveryAddons.some((filename) => filename.includes('kreuzberg')),
  ).toBe(true);
  expect(
    result.discoveryAddons.some((filename) => filename.includes('sharp')),
  ).toBe(true);
  expect(
    result.discoveryAddons.some((filename) =>
      filename.includes('onnxruntime_binding'),
    ),
  ).toBe(false);
  expect(
    result.nativeAddons.some((filename) =>
      filename.includes('onnxruntime_binding'),
    ),
  ).toBe(true);
}

describe('native consumer coexistence', () => {
  test.skipIf(!kreuzbergAvailable)(
    'keeps discovery isolated while preserving OCR functionality',
    async () => {
      assertNativeCoexistence(
        await exerciseNativeConsumer(resolve('src/index.ts')),
      );
    },
  );

  test.skipIf(!kreuzbergAvailable || !existsSync(resolve('dist/index.js')))(
    'preserves native coexistence in the built package',
    async () => {
      assertNativeCoexistence(
        await exerciseNativeConsumer(resolve('dist/index.js')),
      );
    },
  );
});
