# @happyvertical/ocr

## 0.61.4

### Patch Changes

- ### Bug Fixes

  - sync generation-21 agent policy kernel (#133)

## 0.61.3

### Patch Changes

- ### Bug Fixes

  - migrate generation 5 lifecycle (#120) (ocr)

## 0.61.2

### Patch Changes

- c75c89c: Defer loading the Sharp and ONNX Runtime native addons until the ONNX provider performs OCR, preventing provider discovery from destabilizing consumers that also load Kreuzberg or other native runtimes.

## 0.61.1

### Patch Changes

- f602a15: Replace the stale `@gutenye/ocr-node` wrapper with a package-owned PaddleOCR backend on Sharp 0.35.3 and ONNX Runtime 1.27.0, align HappyVertical dependencies with SDK 0.80.0, and update the remaining direct dependency stack.
- f602a15: Apply org toolchain standards: pnpm 11.13.0, TypeScript 6.0.3, Vitest 4.1.10, Vite 8.1.4, Biome 2.5.4, and Lefthook 2.1.10. Migrate the Vitest config off the removed `poolOptions` setting. No public API changes.

## 0.61.0

### Minor Changes

- 50d19dd: Add a Node.js Unlimited-OCR provider for direct SGLang and Bifrost-routed OCR endpoints.

## 0.60.55

### Patch Changes

- ### Dependencies

  - update actions/cache action to v6 (#104)

## 0.60.54

### Patch Changes

- a64e222: Suppress optional OCR provider availability logs in auto mode when another provider is available.

## 0.60.53

### Patch Changes

- 9db6012: Continue through the automatic provider chain when the first available OCR provider returns an empty result.

## 0.60.52

### Patch Changes

- ### Bug Fixes

  - disable npm provenance for publish (#101) (ocr)
  - publish package to npm registry (#99) (ocr)

## 0.60.51

### Patch Changes

- 0308f77: Gate generated API docs and coverage for public package quality.

## 0.60.50

### Patch Changes

- ### Dependencies

  - update pnpm to v10.34.4 (#97)

## 0.60.49

### Patch Changes

- ### Dependencies

  - update actions/checkout action to v7 (#96)

## 0.60.48

### Patch Changes

- ### Dependencies

  - update pnpm/action-setup digest to 0ebf471 (#95)

## 0.60.47

### Patch Changes

- ### Dependencies

  - update all dependencies (#94)

## 0.60.46

### Patch Changes

- ### Dependencies

  - update @types/node to v24.13.1 (#93)

## 0.60.45

### Patch Changes

- ### Dependencies

  - update @types/node to v24.13.0 (#92)

## 0.60.44

### Patch Changes

- ### Dependencies

  - update vite to v7.3.5 (#91)

## 0.60.43

### Patch Changes

- ### Dependencies

  - update all dependencies (#90)

## 0.60.42

### Patch Changes

- ### Dependencies

  - update @happyvertical/utils to ^0.74.0 (#89)

## 0.60.41

### Patch Changes

- ### Dependencies

  - update @happyvertical/ai to ^0.74.0 (#88)

## 0.60.40

### Patch Changes

- ### Features

  - add bitsPerComponent to OCRImage (#76) (ocr)

  ### Dependencies

  - update all dependencies (#87)
  - update all dependencies (#86)
  - update all dependencies (#83)
  - update all dependencies (#82)
  - update @happyvertical/utils to ^0.73.0 (#81)
  - update @happyvertical/ai to ^0.73.0 (#80)
  - update @happyvertical/utils to ^0.72.0 (#79)
  - update @happyvertical/ai to ^0.72.0 (#78)
  - update all dependencies (#74)

## 0.60.39

### Patch Changes

- ### Dependencies

  - update pnpm/action-setup digest to 71c9247 (#73)

## 0.60.38

### Patch Changes

- ### Dependencies

  - update @biomejs/biome to v2.4.12 (#72)

## 0.60.37

### Patch Changes

- ### Dependencies

  - update actions/create-github-app-token digest to 1b10c78 (#71)

## 0.60.36

### Patch Changes

- ### Dependencies

  - update pnpm/action-setup action to v6 (#70)

## 0.60.35

### Patch Changes

- ### Dependencies

  - update actions/github-script action to v9 (#69)

## 0.60.34

### Patch Changes

- ### Dependencies

  - update @biomejs/biome to v2.4.11 (#68)

## 0.60.33

### Patch Changes

- ### Dependencies

  - update vite to v7.3.2 (#67)

## 0.60.32

### Patch Changes

- ### Dependencies

  - update @types/node to v24.12.2 (#66)

## 0.60.31

### Patch Changes

- ### Dependencies

  - update @biomejs/biome to v2.4.10 (#65)

## 0.60.30

### Patch Changes

- ### Dependencies

  - update all dependencies (#64)

## 0.60.29

### Patch Changes

- ### Dependencies

  - update @biomejs/biome to v2.4.8 (#62)

## 0.60.28

### Patch Changes

- ### Dependencies

  - update pnpm/action-setup action to v5 (#61)

## 0.60.27

### Patch Changes

- ### Dependencies

  - update actions/create-github-app-token action to v3 (#60)

## 0.60.26

### Patch Changes

- ### Dependencies

  - update all dependencies (#59)

## 0.60.25

### Patch Changes

- ### Dependencies

  - update all dependencies (#58)

## 0.60.24

### Patch Changes

- ### Dependencies

  - update pnpm to v10.32.0 (#56)

## 0.60.23

### Patch Changes

- ### Dependencies

  - update pnpm to v10.31.0 (#55)

## 0.60.22

### Patch Changes

- ### Dependencies

  - update all dependencies (#54)

## 0.60.21

### Patch Changes

- ### Dependencies

  - update @biomejs/biome to v2.4.5 (#53)

## 0.60.20

### Patch Changes

- ### Dependencies

  - update @happyvertical/utils to ^0.71.0 (#52)

## 0.60.19

### Patch Changes

- ### Dependencies

  - update @happyvertical/ai to ^0.71.0 (#51)

## 0.60.18

### Patch Changes

- ### Dependencies

  - update @types/node to v24.11.0 (#50)

## 0.60.17

### Patch Changes

- ### Dependencies

  - update @happyvertical/utils to ^0.70.0 (#49)

## 0.60.16

### Patch Changes

- ### Dependencies

  - update @happyvertical/ai to ^0.70.0 (#48)

## 0.60.15

### Patch Changes

- ### Dependencies

  - update all dependencies (#47)

## 0.60.14

### Patch Changes

- ### Dependencies

  - update pnpm to v10.30.2 (#46)

## 0.60.13

### Patch Changes

- ### Dependencies

  - update all dependencies (#45)

## 0.60.12

### Patch Changes

- ### Dependencies

  - update @happyvertical/utils to ^0.69.0 (#44)

## 0.60.11

### Patch Changes

- ### Dependencies

  - update @happyvertical/ai to ^0.69.0 (#43)

## 0.60.10

### Patch Changes

- ### Dependencies

  - update all dependencies (#42)

## 0.60.9

### Patch Changes

- ### Dependencies

  - update all dependencies (#41)

## 0.60.8

### Patch Changes

- ### Bug Fixes

  - handle multi-line commit bodies in auto-changeset (#40) (ci)

## 0.60.7

### Patch Changes

- ### Bug Fixes

  - treat dependency updates as patch bumps in auto-changeset

  ### Dependencies

  - update all dependencies (#38)
  - update @types/node to v24.10.11 (#37)
  - update @happyvertical/utils to ^0.68.0 (#36)
  - update @happyvertical/ai to ^0.68.0 (#35)
  - update all dependencies (#34)
  - update all dependencies (#33)
  - update @biomejs/biome to v2.3.12 (#32)
  - update @happyvertical/utils to ^0.67.0 (#31)
  - update @happyvertical/ai to ^0.67.0 (#30)
  - update pnpm to v10.28.1 (#29)
  - update @happyvertical/utils to ^0.66.0 (#26)
  - update @happyvertical/ai to ^0.66.0 (#25)
  - update all dependencies (#28)
  - update pnpm to v10.26.2 (#24)

## 0.60.6

### Patch Changes

- ### Features

  - add OAuth2 client credentials authentication to LiteLLM (ocr)

## 0.60.5

### Patch Changes

- ### Features

  - add LiteLLM provider for vision LLM-based text extraction (ocr)

## 0.60.4

### Patch Changes

- ### Bug Fixes

  - add workflow_dispatch trigger to publish workflow (release)

## 0.60.3

### Patch Changes

- ### Features

  - add auto-changeset and direct publish workflow (ci)
  - graduate @happyvertical/ocr to standalone repo

  ### Bug Fixes

  - use GH_TOKEN org secret for npm publish (release)
  - use GITHUB_TOKEN for npm publish to GitHub Packages (release)
  - include root package in pnpm workspace for changesets (release)
  - update biome.json for biome 2.x compatibility (ocr)
  - use 'includes' instead of 'include' in biome.json overrides (ocr)
  - add packages:read permission for GitHub Packages auth (deps)
  - scope GitHub App token to organization for package access (ocr)
  - use GitHub App token for package registry access (ocr)
  - resolve workflow issues for pnpm and commitlint (ocr)
  - update biome.json for v1.9.4 compatibility (ocr)

## 0.60.2

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.60.2

## 0.60.1

### Patch Changes

- @happyvertical/utils@0.60.1

## 0.60.0

### Patch Changes

- @happyvertical/utils@0.60.0

## 0.59.6

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.59.6

## 0.59.5

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.59.5

## 0.59.4

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.59.4

## 0.59.3

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.59.3

## 0.59.2

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.59.2

## 0.59.1

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.59.1

## 0.59.0

### Patch Changes

- @happyvertical/utils@0.59.0

## 0.57.1

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.57.1

## 0.57.0

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.57.0

## 0.56.18

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.56.18

## 0.56.17

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.56.17

## 0.56.16

### Patch Changes

- @happyvertical/utils@0.56.16

## 0.56.15

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.56.15

## 0.56.14

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.56.14

## 0.56.13

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.56.13

## 0.56.12

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.56.12

## 0.56.11

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.56.11

## 0.56.10

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.56.10

## 0.56.9

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.56.9

## 0.56.8

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.56.8

## 0.56.7

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.56.7

## 0.56.6

### Patch Changes

- Updated dependencies
  - @happyvertical/utils@0.56.6

## 0.56.5

### Patch Changes

- @happyvertical/utils@0.56.5

## 0.56.4

### Patch Changes

- @happyvertical/utils@0.56.4

## 0.56.3

### Patch Changes

- @happyvertical/utils@0.56.3

## 0.56.2

### Patch Changes

- @happyvertical/utils@0.56.2

## 0.56.1

### Patch Changes

- @happyvertical/utils@0.56.1

## 0.56.0

### Patch Changes

- c1b1111: Enable fixed versioning for all @happyvertical packages

  All packages in the SDK monorepo now share the same version number. This simplifies version management and makes it easier to understand which packages work together.

  **Changes:**

  - Updated `.changeset/config.json` to enable fixed versioning for all `@happyvertical/*` packages
  - All packages will now be bumped together to the same version
  - Future changesets will automatically synchronize versions across all packages

  **Migration:**

  - All packages will be synchronized to the same version on the next release
  - The root `package.json` version will be kept in sync with all packages

- Updated dependencies [c1b1111]
  - @happyvertical/utils@0.56.0

## 0.55.4

### Patch Changes

- dc9c86d: chore: update all dependencies to latest versions

  Updated all dependencies across the monorepo to their latest versions:

  - vite: 5.4.x/6.x/7.1.x → 7.2.2
  - vitest: 2.1.9/3.2.4 → 4.0.8
  - happy-dom: 18.0.1 → 20.0.10 (fixes CVE-2025-61927, CVE-2025-62410)
  - vite-plugin-dts: 3.9.x/4.3.x → 4.5.4
  - @biomejs/biome: 1.9.4/2.3.3 → 2.3.4
  - turbo: 2.3.3/2.5.x → 2.6.0
  - typescript: 5.7.x → 5.9.3
  - And 30+ other dependencies

  Also fixed test and typecheck failures in logger package:

  - Added `vi.clearAllMocks()` to clear mock spy history between tests
  - Added `skipLibCheck: true` to prevent checking problematic node_modules types

  Also skipped browser-based integration tests in spider package when running in CI:

  - CrawleeAdapter tests (Playwright browser automation)
  - TreeScraper tests (browser-based web scraping)
  - Tests pass locally but fail in CI environment

  Closes #387, #396, #397

- Updated dependencies [dc9c86d]
  - @happyvertical/utils@0.55.4

## 0.55.3

### Patch Changes

- Updated dependencies [849eb94]
  - @happyvertical/utils@0.55.3

## 0.55.0

### Minor Changes

- 5ef824c: Auto-generated changeset from conventional commits:

  fix: simplify auto-changeset workflow - remove dependency installation
  fix: remove pnpm version from workflow to use packageManager field
  Merge pull request #346 from happyvertical/claude-auto-fix-fix/add-package-tagformat-18985806972
  Merge pull request #345 from happyvertical/claude-auto-fix-fix/add-package-tagformat-18985694712
  fix(deps): update pnpm-lock.yaml to remove semantic-release dependencies
  fix(deps): update pnpm-lock.yaml to remove semantic-release dependencies
  feat: add auto-changeset workflow for automatic version bumps
  fix: replace semantic-release with changesets for predictable versioning

### Patch Changes

- Updated dependencies [5ef824c]
  - @happyvertical/utils@0.55.0
