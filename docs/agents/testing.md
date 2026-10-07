# Testing

`npm run test:run` runs vitest. Islands opt into jsdom with a `@vitest-environment`
docblock. The manifest suite runs in node.

- **Control the RNG when asserting pool contents.** The look-alike-exclusion test stubs
  `crypto.getRandomValues` to walk the pool sequentially so every pool character
  appears. A random 64-char sample passes by luck about 1% of the time even with the
  filter removed; the deterministic version catches that mutation.
- `uses crypto.getRandomValues, not Math.random` is a security regression guard, not a
  style check. Keep it.
- The `utm_term` slugify exemption is pinned by a test.
- Each island has a test that DE and EN produce identical values.
- Range inputs ignore typing. Set `value` through the native setter and dispatch
  `input`, or React swallows the change.
