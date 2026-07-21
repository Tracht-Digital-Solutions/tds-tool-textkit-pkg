# @tracht-digital-solutions/tds-tool-textkit

Text & link utilities for the **TDS tools platform** (`tds-tools`). Fully
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
npm run build
```

The `.astro` shells + `.tsx` islands are validated at the **site** build. Release
on push to `main` (auto-release @latest; the manual button is for minor/major). See `tds-tools-contract` for the platform model.
