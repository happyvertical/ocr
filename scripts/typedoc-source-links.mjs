import path from 'node:path';

const repositoryUrl = 'https://github.com/happyvertical/ocr/blob/main';

/**
 * Keep source links deterministic when TypeDoc runs from a Git worktree.
 *
 * TypeDoc 0.28 only discovers repositories whose checkout contains a `.git`
 * directory. Git worktrees use a `.git` file, so TypeDoc otherwise omits links
 * locally while adding them in CI's regular checkout.
 *
 * @param {import('typedoc').Application} app
 */
export function load(app) {
  const repositoryRoot = path.resolve(process.cwd());
  const sourceRoot = `${path.join(repositoryRoot, 'src')}${path.sep}`;

  app.converter.on('resolveBegin', (context) => {
    for (const reflection of Object.values(context.project.reflections)) {
      for (const source of reflection.sources ?? []) {
        if (!source.fullFileName.startsWith(sourceRoot)) {
          source.url = undefined;
          continue;
        }

        const relativePath = path
          .relative(repositoryRoot, source.fullFileName)
          .split(path.sep)
          .join('/');
        source.url = `${repositoryUrl}/${relativePath}#L${source.line}`;
      }
    }
  });
}
