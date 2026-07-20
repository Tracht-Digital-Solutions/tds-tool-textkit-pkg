# AGENTS.md — tds-tool-textkit

A **tool package** for the TDS tools platform (password generator + UTM builder).
Read `tds-tools-contract`'s AGENTS.md for the platform model.

## Shape

- `src/index.ts` — the `ToolPackManifest` (two tools). Only file tsup compiles +
  `tsc` type-checks.
- `tools/*.astro` — shells the site's `/tools/[slug]` template renders.
- `islands/*.tsx` — hydrated React islands, fully client-side (no deps, no network).

## Gotchas

- `component` = package subpath via `exports`, never relative.
- Tool `id` + `slug` globally unique across composed packs.
- Password generator MUST use `crypto.getRandomValues`, never `Math.random`.
- Islands/.astro compile at the site build (not in tsconfig `include`).
- Version stays in the `0.1.x` line (site pins `^0.1.x`).
