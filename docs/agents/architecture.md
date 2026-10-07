# Architecture

## Layout

- `src/index.ts` — the `ToolPackManifest` with two tools. It is the only file tsup
  compiles and the only file `tsc` type-checks.
- `tools/*.astro` — tool shells that the site's `/tools/[slug]` template renders.
- `islands/*.tsx` — hydrated React islands. Fully client-side, no dependencies, no network.
- `islands/` and `tools/` are not in this repo's tsconfig `include`. They compile in
  the `tds-tools-frontend` build, which is the real gate for a markup change.

## Manifest contract

- `component` is a package subpath resolved via `exports`, never relative.
- Tool `id` and `slug` must stay unique across all composed packs.

## Languages (DE/EN)

The site publishes German at `/` and English at `/en/`. The tool-page template passes
`lang` to the shell (`tools/*.astro`), which passes it to the island. The island looks
up its labels in a local `STRINGS` table.

- **`lang` defaults to `"de"` at both levels.** A consumer that renders the shell
  without the prop behaves exactly as before. The German test suite is therefore the
  regression test for the default.
- **`type Lang = "de" | "en"` is declared per island**, not imported from the contract.
  Packs release independently, and a shared type would turn every language change into
  a contract minor that all packs must repin.
- **Translate labels, never the value pipeline.** UTM parameter keys, slug normalisation
  and entropy thresholds are identical in both languages. A password doesn't get stronger
  in English, and two languages producing different tracking links would only show up in
  a campaign report weeks later. Each island has a test pinning this.

## Password generator

Must use `crypto.getRandomValues`, never `Math.random`.

## UTM builder

`utm_term` is exempt from slugify on purpose: a keyword is a search phrase, not a slug.
