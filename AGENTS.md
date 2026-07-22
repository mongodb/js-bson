# AGENTS.md

Instructions for AI coding agents working in this repository. This file is the source of truth; tool-specific files (e.g. CLAUDE.md) should only import it.

## Project Overview

`bson` is the BSON codec library for JavaScript (Node.js and browser), implementing the [BSON specification](https://bsonspec.org/). It provides BSON type classes, serialization/deserialization to and from BSON bytes, and Extended JSON (EJSON) support. It is the codec used by the [node-mongodb-native](https://github.com/mongodb/node-mongodb-native) driver, and also a standalone library external users depend on.

## Commands

```bash
npm run build          # tsc + api-extractor (bson.d.ts) + rollup bundles into lib/
npm run check:lint     # eslint + api-extractor + tsd type tests
npm run format         # attemps to automatically fix lint errors
npm run check:node     # mocha test/node (Node target). Run `build` first
npm run check:web      # same suite with WEB=true (browser code paths)
npm test               # builds (pretest), then check:node + check:web
```

- Run a single test file: `npx mocha test/node/<file>.test.ts`; filter cases with `--grep`.
- Tests use mocha + chai + sinon. Type-level tests live in `test/types` (tsd).

### Benchmarks

All benchmark runs first measure a CPU baseline (`check:baseline-bench`) so results are normalized across machines. Sources live in `test/bench/`.

```bash
npm run check:granular-bench   # per-BSON-type micro-benchmarks (test/bench/granular)
npm run check:spec-bench       # cross-driver spec benchmark suite (test/bench/spec)
npm run check:custom-bench     # ad-hoc/scenario benchmarks (test/bench/custom)
```

Use these to validate `perf`-tagged changes — run before and after on the same machine and compare.

## Architecture

- `src/*.ts` — BSON type classes (`ObjectId`, `Long`, `Decimal128`, `Binary`, …), all extending `BSONValue`; `extended_json.ts` for EJSON.
- `src/parser/` — the eager codec: recursive serializer/deserializer that converts whole JS objects to/from BSON bytes in one pass, plus size calculation used to pre-allocate output buffers.
- `src/parser/on_demand` — the lazy path: scans a BSON buffer into document metadata without materializing JS values, so they can be independently decoded.
- `src/utils/` — shared helpers (byte utils, number parsing, platform detection).
- `src/index.ts` — the public API surface; api-extractor rolls it into `bson.d.ts`.
- `test/node/` — main test suite; `bson_corpus*` tests run the cross-driver BSON corpus spec.

## Code Conventions

- **Public API stability** — Everything exported from `src/index.ts` lands in the published `bson.d.ts`. Renaming, removing, or narrowing exported types/signatures is a breaking change; confirm with a maintainer first.
- **No `export default`** — all exports named. **No TypeScript enums** — use `as const` objects or string unions.
- **No `Buffer` in `src/`** — use `Uint8Array`; code must run in browsers.
- **No `node:` import prefix in `src/`**; tests may use it.
- **Null checks** — loose equality (`== null`), not `=== null`/`=== undefined`.
- **Type imports** — inline: `import { type Foo }`.
- **Errors** — throw `BSONError` or its subclasses (`BSONRuntimeError`, `BSONOffsetError`, …) from `src/error.ts`; messages in sentence case, no trailing period.
- **Formatting** — Prettier: single quotes, 2-space indent, 100-char width, no trailing commas.

## Other Important Information

- Changes must be compliant with bson spec, and should conform to specification tests for bson (e.g: [bson-corpus](https://github.com/mongodb/specifications/blob/master/source/bson-corpus/bson-corpus.md)).
- Before making key changes to anything within `src/parser/*`, consider performance implications and run benchmark test passes to ensure no significant performance degradation.

## Commit Messages

[Conventional Commits](https://www.conventionalcommits.org/) with a Jira ticket: `<type>(NODE-XXXX): <subject>` — types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`; breaking changes use `!` (e.g. `feat(NODE-XXXX)!: …`).

## Further Reading

- [CONTRIBUTING.md](CONTRIBUTING.md) — contributor workflow
- [docs/](docs/) — upgrade guides (v4, v5)
