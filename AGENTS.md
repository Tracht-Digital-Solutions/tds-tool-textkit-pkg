# AGENTS.md — tds-tool-textkit-pkg

A **tool package** for the TDS tools platform (password generator + UTM builder).
Read `tds-tools-contract-pkg`'s AGENTS.md for the platform model.

## Shape

- `src/index.ts` — the `ToolPackManifest` (two tools). Only file tsup compiles +
  `tsc` type-checks.
- `tools/*.astro` — shells the site's `/tools/[slug]` template renders.
- `islands/*.tsx` — hydrated React islands, fully client-side (no deps, no network).

## Tests

`npm run test:run` (vitest). Islands opt into jsdom via a `@vitest-environment`
docblock; the manifest suite runs in node.

- **Control the RNG when asserting pool contents.** The look-alike-exclusion
  test stubs `crypto.getRandomValues` to walk the pool sequentially so every
  pool character appears. With a random 64-char sample the assertion passes by
  luck ~1% of the time even with the filter removed — verified: the sampling
  version did NOT catch that mutation, the deterministic one does.
- `uses crypto.getRandomValues, not Math.random` is a security regression
  guard, not a style check. Keep it.
- The UTM `utm_term` exemption from slugify is deliberate (a keyword is a
  search phrase, not a slug) and is pinned by a test.
- Range inputs ignore typing: set `value` through the native setter and
  dispatch `input`, or React swallows the change.

## Gotchas

- `component` = package subpath via `exports`, never relative.
- Tool `id` + `slug` globally unique across composed packs.
- Password generator MUST use `crypto.getRandomValues`, never `Math.random`.
- Islands/.astro compile at the site build (not in tsconfig `include`).
- Version stays in the `0.1.x` line (site pins `^0.1.x`).
