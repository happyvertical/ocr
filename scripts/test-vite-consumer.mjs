import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repository = new URL('..', import.meta.url);
const workspace = await mkdtemp(join(tmpdir(), 'ocr-vite-consumer-'));

try {
  const { stdout } = await execFileAsync(
    'pnpm',
    [
      '--config.ignore-scripts=true',
      'pack',
      '--pack-destination',
      workspace,
    ],
    { cwd: repository, encoding: 'utf8' },
  );
  const tarball = stdout.trim().split('\n').at(-1);
  if (!tarball) throw new Error('pnpm pack did not report a tarball');

  const consumer = join(workspace, 'consumer');
  await mkdir(join(consumer, 'src'), { recursive: true });
  await writeFile(
    join(consumer, 'package.json'),
    JSON.stringify(
      {
        name: 'ocr-vite-8-consumer',
        private: true,
        type: 'module',
        packageManager: 'pnpm@11.13.0',
        dependencies: {
          '@happyvertical/ocr': `file:${tarball}`,
          vite: '8.1.4',
        },
      },
      null,
      2,
    ),
  );
  await writeFile(
    join(consumer, 'pnpm-workspace.yaml'),
    `overrides:
  '@gutenye/ocr-common': 1.4.8
  '@gutenye/ocr-models': 1.4.2
  '@happyvertical/ai': 0.80.0
  '@happyvertical/utils': 0.80.0
`,
  );
  await writeFile(
    join(consumer, 'index.html'),
    '<div id="app"></div><script type="module" src="/src/main.ts"></script>\n',
  );
  await writeFile(
    join(consumer, 'src/main.ts'),
    "import { getOCR } from '@happyvertical/ocr';\nconst factory = getOCR();\ndocument.querySelector('#app').textContent = factory.getEnvironment();\n",
  );

  await execFileAsync(
    'pnpm',
    ['install', '--prefer-offline', '--ignore-scripts', '--no-frozen-lockfile'],
    { cwd: consumer, encoding: 'utf8' },
  );
  await execFileAsync('pnpm', ['exec', 'vite', 'build'], {
    cwd: consumer,
    encoding: 'utf8',
  });

  const output = await readFile(join(consumer, 'dist/index.html'), 'utf8');
  if (!output.includes('/assets/')) {
    throw new Error('Vite consumer did not emit a JavaScript asset');
  }
  console.log('Packed @happyvertical/ocr root entry bundles with Vite 8.');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
