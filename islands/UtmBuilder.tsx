import { useMemo, useState } from "react";

/** Lowercase, spaces→hyphens, strip anything but a-z0-9-_ — a clean UTM value. */
function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "")
    .replace(/-+/g, "-");
}

/**
 * The languages the tools site publishes.
 *
 * Declared locally in each island rather than imported from the contract:
 * the packs release independently, and a shared type would make every
 * language change a contract minor that all four packs then have to repin.
 * Two string literals are not worth that coupling.
 */
type Lang = "de" | "en";

interface UtmParam {
  key: string;
  label: string;
  placeholder: string;
  /** Absent rather than `false` on the optional ones — see STRINGS below. */
  required?: boolean;
}

interface Strings {
  targetUrl: string;
  invalidUrl: string;
  normalise: string;
  recommended: (fields: string) => string;
  copy: string;
  copied: string;
  params: UtmParam[];
}

/**
 * UI strings. German is the default and stays the default — the site's
 * audience is local businesses in Northern Germany, and every existing test
 * in this repo asserts against the German labels. An island called without
 * `lang` therefore behaves exactly as it did before this file learned English.
 */
const STRINGS = {
  de: {
    targetUrl: "Ziel-URL",
    invalidUrl: "Bitte eine gültige URL inkl. https:// eingeben.",
    normalise: "Werte automatisch normalisieren (Kleinbuchstaben, Bindestriche)",
    recommended: (fields: string) => `Empfohlen: ${fields} ausfüllen.`,
    copy: "Kopieren",
    copied: "Kopiert ✓",
    params: [
      { key: "utm_source", label: "Quelle (utm_source)", placeholder: "newsletter", required: true },
      { key: "utm_medium", label: "Medium (utm_medium)", placeholder: "email", required: true },
      { key: "utm_campaign", label: "Kampagne (utm_campaign)", placeholder: "fruehjahr-2026", required: true },
      { key: "utm_term", label: "Keyword (utm_term)", placeholder: "digitalisierung" },
      { key: "utm_content", label: "Inhalt (utm_content)", placeholder: "header-button" },
    ],
  },
  en: {
    targetUrl: "Target URL",
    invalidUrl: "Please enter a valid URL including https://.",
    normalise: "Normalise values automatically (lower case, hyphens)",
    recommended: (fields: string) => `Recommended: fill in ${fields}.`,
    copy: "Copy",
    copied: "Copied ✓",
    params: [
      { key: "utm_source", label: "Source (utm_source)", placeholder: "newsletter", required: true },
      { key: "utm_medium", label: "Medium (utm_medium)", placeholder: "email", required: true },
      { key: "utm_campaign", label: "Campaign (utm_campaign)", placeholder: "spring-2026", required: true },
      { key: "utm_term", label: "Keyword (utm_term)", placeholder: "digitalisation" },
      { key: "utm_content", label: "Content (utm_content)", placeholder: "header-button" },
    ],
  },
} satisfies Record<Lang, Strings>;

interface Props {
  lang?: Lang;
}

/**
 * UTM campaign-link builder — compose a trackable URL from a base address +
 * utm_* parameters, with optional slug normalisation, live preview and copy.
 * Client-side only.
 */
export default function UtmBuilder({ lang = "de" }: Props) {
  const t = STRINGS[lang];
  const PARAMS = t.params;
  const [base, setBase] = useState("https://tracht-digital.de");
  const [values, setValues] = useState<Record<string, string>>({});
  const [autoSlug, setAutoSlug] = useState(true);
  const [copied, setCopied] = useState(false);

  const set = (key: string, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setCopied(false);
  };

  const { url, error } = useMemo(() => {
    if (!base.trim()) return { url: "", error: null as string | null };
    let parsed: URL;
    try {
      parsed = new URL(base.trim());
    } catch {
      return { url: "", error: t.invalidUrl };
    }
    for (const p of PARAMS) {
      const raw = values[p.key];
      if (!raw) continue;
      parsed.searchParams.set(p.key, autoSlug && p.key !== "utm_term" ? slugify(raw) : raw.trim());
    }
    return { url: parsed.toString(), error: null };
    // `t` and PARAMS are derived from `lang`, so the memo has to see it —
    // otherwise switching language would leave the previous language's error
    // message on screen.
  }, [base, values, autoSlug, t, PARAMS]);

  const missing = PARAMS.filter((p) => p.required && !values[p.key]).map((p) => p.label.split(" (")[0]);

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  // Geometry/border/padding come from the shared primitive — the pack ships no
  // CSS and the radius must follow whatever surface composes it.
  const field = "field-boxed w-full";

  return (
    <div className="utm-tool space-y-5">
      <label className="block text-sm">
        <span className="mb-1 block opacity-80">{t.targetUrl}</span>
        <input className={field} value={base} onChange={(e) => { setBase(e.target.value); setCopied(false); }} placeholder="https://…" />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {PARAMS.map((p) => (
          <label key={p.key} className="block text-sm">
            <span className="mb-1 block opacity-80">
              {p.label}
              {p.required ? <span className="text-[color:var(--color-danger)]"> *</span> : null}
            </span>
            <input className={field} value={values[p.key] ?? ""} onChange={(e) => set(p.key, e.target.value)} placeholder={p.placeholder} />
          </label>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={autoSlug} onChange={(e) => setAutoSlug(e.target.checked)} />
        {t.normalise}
      </label>

      {error ? (
        <p className="status-pill status-pill--danger text-sm">{error}</p>
      ) : (
        <div className="space-y-2">
          {missing.length > 0 && (
            <p className="text-xs opacity-70">{t.recommended(missing.join(", "))}</p>
          )}
          <div className="flex items-stretch gap-2">
            <output className="tds-card flex-1 select-all px-4 py-3 font-mono text-sm break-all">
              {url || "—"}
            </output>
            <button type="button" className="btn btn-primary" onClick={copy} disabled={!url}>
              {copied ? t.copied : t.copy}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
