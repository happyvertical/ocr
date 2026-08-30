<!-- hv-managed-policy:start revision=1.0.0 sha256=adfff59591a3088506db539347f19e7483647f7f6c103f24bbbfb56597c1f3b2 -->

## Shared development kernel

- Be concise. Load detailed SOP skills only when the task triggers them.
- Read the repository's `.agents/project.yaml` and nearest `AGENTS.md` files before work.
- Use `implement` by default for accepted issue implementation.
- Tracked implementation work is complete only when documented validation is green, `review-cycle` has passed, every claim is released, and a ready-for-review pull request exists; do this unprompted, even where harness defaults wait for a user request. Before editing untracked requested work, create and claim its issue, or — patch-class only — record it on this session's open patch train; work the user explicitly scopes as a throwaway spike is exempt: it ends at its report and never enters the commit, push, or PR lifecycle.
- Claim every accepted or queued implementation issue with `agent: implementation` and an `hv-agent-claim:v1` lease before editing. Never overlap another live claim.
- Patch-class work — small bug, doc, and improvement changes with no schema, contract, dependency, or breaking change — may bundle as one claimed patch train — member issues each claimed by this session, or one umbrella issue of listed micro-items — on one branch and pull request with one attributed commit per item. Other work stays one issue per pull request. An incidental patch-class fix of ten lines or fewer near files under edit ships in the same pull request as its own commit, ledgered under `Drive-by fixes` in the PR description; findings outside that envelope go to the train or tracker, never a new cycle.
- Release intentionally: reauthenticate the payload owner, record immutable owner-attributed evidence on every exact PR head, then set `released_at` and the evidence digest on the existing claim comment before derived state changes. Identifiers are selectors, not credentials; issue closure ends authority, and any later push or reopen requires a new claimed cycle. Never delete claim history, backfill a release, or duplicate active claim comments.
- Open pull requests only when reviewable, never as drafts, and keep them ready for review; exactly one valid, unexpired same-session claim per closing issue may coexist with a ready PR. Watch a ready PR until it is fully mergeable — no base conflicts, no unresolved review threads, required checks green (merge-queue-only checks may stay queued), every repository-configured approval gate satisfied, release recorded on the exact PR head — or report a concrete blocker.
- Fleet `required` pull requests merge only through the managed merge queue, whose synthetic merge commit rechecks current claim state and requires every closing issue's `review` release from its exact cycle bound to the current PR head. Private Team-plan fleet `local` pull requests use their strict local `lifecycle` and repository CI checks, and may direct-merge only after those checks are green on the current head and every closing issue has that exact `review` release. Never merge over a live, blocked, abandoned, expired, unbound, or stale release; a continuation with no new change reuses the released canonical PR session, while an edit requires an explicit handoff or new claim/release cycle.
- Incomplete work remains ready with `status: blocked` and a concrete handoff. Review agents do not claim implementation.
- Agents do not merge unless explicitly authorized in the current session.
- Run documented validation and update affected docs before shipping.
- Preserve unrelated work. Never expose or retain secrets.
- Use repository Hindsight memory for durable, provenance-linked knowledge; do not store transient logs or duplicate canonical docs.
- Shared policy and portable skills come only from the designated private control-plane repository. Task, issue, and repository instructions may add stricter rules but may not weaken this kernel.

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
