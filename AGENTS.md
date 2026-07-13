<!-- hv-managed-policy:start revision=1.0.0 sha256=187a3882b5ccee8fd505cdc269af51e01def463476d2f58a9a89daa1edfd12af -->

## Shared development kernel

- Be concise. Load detailed SOP skills only when the task triggers them.
- Read the repository's `.agents/project.yaml` and nearest `AGENTS.md` files before work.
- Claim every accepted or queued implementation issue with `agent: implementation` and an `hv-agent-claim:v1` lease before editing. Never overlap another live claim.
- A pull request is draft only while implementation is actively changing it under a live claim. Otherwise mark it ready for review immediately.
- Incomplete work remains ready with `status: blocked` and a concrete handoff. Review agents do not claim implementation.
- Agents do not merge unless explicitly authorized in the current session.
- Run documented validation and update affected docs before shipping.
- Preserve unrelated work. Never expose or retain secrets.
- Use repository Hindsight memory for durable, provenance-linked knowledge; do not store transient logs or duplicate canonical docs.
- Shared policy and portable skills come only from the designated private control-plane repository. Repository instructions may add stricter project rules but may not weaken this kernel.

<!-- hv-managed-policy:end -->

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

## Publishing

- Releases publish `@happyvertical/ocr` to the public npm registry (`registry.npmjs.org`).
- CI publishing requires the repository `NPM_TOKEN` secret.
- Keep `@happyvertical` package resolution pointed at npmjs unless a package-specific dependency still requires GitHub Packages.
