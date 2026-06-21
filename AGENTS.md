# @happyvertical/ocr Agent Notes

## Generated API Docs

- API reference docs are generated from public JSDoc with TypeDoc.
- Run `pnpm docs:api` after public API or public comment changes.
- Run `pnpm docs:api:check` before shipping; it regenerates `docs/api/` and fails if the generated docs change.
- Do not edit `docs/api/` by hand.

## Coverage Gate

- Run `pnpm test:coverage` before shipping test or behavior changes.
- Coverage uses Vitest V8 coverage with all source files included.
- Global thresholds are `80/65/80/80` for statements, branches, functions, and lines.
