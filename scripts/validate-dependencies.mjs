import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const dependencies = manifest.dependencies ?? {};

const expectedRanges = {
  '@gutenye/ocr-common': '^1.4.8',
  '@gutenye/ocr-models': '^1.4.2',
  '@happyvertical/ai': '^0.80.0',
  '@happyvertical/utils': '^0.80.0',
  'onnxruntime-common': '^1.27.0',
  'onnxruntime-node': '^1.27.0',
  sharp: '^0.35.3',
  'tesseract.js': '^7.0.0',
};

for (const [name, expected] of Object.entries(expectedRanges)) {
  assert(
    dependencies[name] === expected,
    `${name} must declare ${expected}, found ${dependencies[name] ?? 'missing'}`,
  );
}

assert(
  !('@gutenye/ocr-node' in dependencies),
  '@gutenye/ocr-node must not remain in published dependencies',
);
assert(
  !Object.entries(dependencies).some(
    ([name, range]) =>
      name.startsWith('@happyvertical/') && String(range).includes('0.74.'),
  ),
  'published dependencies must not contain HappyVertical 0.74 ranges',
);

const graph = JSON.parse(
  execFileSync('pnpm', ['list', 'sharp', '--depth', 'Infinity', '--json'], {
    encoding: 'utf8',
  }),
);
const sharpInstallations = [];

for (const root of graph) {
  collectSharp(root.dependencies, sharpInstallations);
  collectSharp(root.devDependencies, sharpInstallations);
  collectSharp(root.optionalDependencies, sharpInstallations);
}

const versions = [...new Set(sharpInstallations.map(({ version }) => version))];
assert(
  sharpInstallations.length === 1 && versions[0] === '0.35.3',
  `expected one Sharp 0.35.3 installation, found ${JSON.stringify(sharpInstallations)}`,
);

console.log(
  `Dependency graph is declaration-clean: SDK 0.80.0, Sharp ${versions[0]}, one Sharp installation.`,
);

function collectSharp(nodes, output) {
  if (!nodes) return;

  for (const [name, node] of Object.entries(nodes)) {
    if (name === 'sharp') {
      output.push({ version: node.version, path: node.path });
    }
    collectSharp(node.dependencies, output);
    collectSharp(node.devDependencies, output);
    collectSharp(node.optionalDependencies, output);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
