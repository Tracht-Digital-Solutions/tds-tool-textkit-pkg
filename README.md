# @tracht-digital-solutions/tds-tool-textkit

Text & link utilities for the **TDS tools platform** (`tds-tools-frontend`). Fully
client-side — nothing leaves the browser.

## Tools

| id | slug | premium | description |
|---|---|---|---|
| `password-generator` | `passwort-generator` | no | Secure random password generator (`crypto.getRandomValues`) |
| `utm-builder` | `utm-link-generator` | no | UTM campaign-link builder with slug normalisation |

## Develop

```bash
npm install
npm run type-check
npm run test:run     # vitest — manifest + both islands
npm run build
```

## Tests

- **`src/index.test.ts`** — manifest contract: unique + URL-safe ids/slugs, SEO
  length budgets, categories, and that each `component` resolves to a file the
  `files` list actually publishes.
- **`islands/PasswordGenerator.test.tsx`** — the properties a broken generator
  would still *look* fine while violating: the pool honours every checkbox, the
  length is exact, the entropy readout matches `length × log2(pool)`, look-alike
  exclusion works, and randomness comes from `crypto.getRandomValues` — never
  `Math.random`.
- **`islands/UtmBuilder.test.tsx`** — parameter names, when slugification
  applies (and the deliberate `utm_term` exemption), preservation of an existing
  query string / path / fragment, and URL validation.

The look-alike test stubs `getRandomValues` to walk the pool index by index, so
it fails deterministically if the filter is removed — a random sample would have
passed by luck about 1% of the time.

The `.astro` shells + `.tsx` islands are validated at the **site** build. Release
on push to `main` (auto-release @latest; the manual button is for minor/major). See `tds-tools-contract-pkg` for the platform model.
