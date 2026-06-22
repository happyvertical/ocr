# @happyvertical/ocr Agent Notes

## Runtime Positioning

- Treat this package as Node-first. The public package entrypoint is optimized for server-side consumers.
- Do not add direct LLM SDK clients here. LLM-backed OCR should go through `@happyvertical/ai`.
- The checked-in OCR model assets were removed as stale local artifacts; runtime model loading comes from package dependencies such as `@gutenye/ocr-node` and `tesseract.js`.

## Generated API Docs

- API reference docs are generated from public JSDoc with TypeDoc.
- Run `pnpm docs:api` after public API or public comment changes.
- Run `pnpm docs:api:check` before shipping; it regenerates `docs/api/` and fails if the generated docs change.
- Do not edit `docs/api/` by hand.

## Coverage Gate

- Run `pnpm test:coverage` before shipping test or behavior changes.
- Coverage uses Vitest V8 coverage with all source files included.
- Global thresholds are `80/65/80/80` for statements, branches, functions, and lines.
