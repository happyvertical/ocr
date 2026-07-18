<!-- hv-managed-policy:start revision=1.0.0 sha256=dc892d3db6b886d9a74b70e555b0017605d9ab88a5ea06540f5d2f45388f804b -->

## Shared development kernel

- Be concise. Load detailed SOP skills only when the task triggers them.
- Read the repository's `.agents/project.yaml` and nearest `AGENTS.md` files before work.
- Use `implement` by default for accepted issue implementation. Apply explicit task, issue, and repository instructions as additions or scoped overrides without weakening this kernel.
- Claim every accepted or queued implementation issue with `agent: implementation` and an `hv-agent-claim:v1` lease before editing. Never overlap another live claim.
- Intentional release reauthenticates the canonical payload owner, records immutable owner-attributed evidence on every exact PR head, then sets `released_at` and the evidence digest on the existing claim comment before labels, project state, or PR readiness change. Public session/comment identifiers are selectors, not mutation credentials. Only the current issue incarnation and latest implementation-label generation may authorize work; issue closure ends renewable authority and settles the selected cycle as `race-lost`. Any later push or reopen requires a new claimed review cycle. Never delete claim history, backfill a release, or create duplicate active claim comments.
- Open pull requests only when reviewable and keep them ready for review. Never use draft status for implementation work; exactly one valid, unexpired claim from the PR session may coexist with a ready PR, while duplicate, expired, foreign-session, or mismatched claims are invalid.
- Lifecycle-protected pull requests merge only through the managed merge queue so the synthetic merge commit rechecks current claim state. Merge-time validation requires a `review` release from the exact implementation cycle bound to the current PR head; never merge with a live, blocked, abandoned, expired, unbound, or stale release, or direct-merge using an earlier pull-request check.
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
