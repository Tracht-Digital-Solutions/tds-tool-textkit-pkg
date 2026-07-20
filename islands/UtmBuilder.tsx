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

const PARAMS: { key: string; label: string; placeholder: string; required?: boolean }[] = [
  { key: "utm_source", label: "Quelle (utm_source)", placeholder: "newsletter", required: true },
  { key: "utm_medium", label: "Medium (utm_medium)", placeholder: "email", required: true },
  { key: "utm_campaign", label: "Kampagne (utm_campaign)", placeholder: "fruehjahr-2026", required: true },
  { key: "utm_term", label: "Keyword (utm_term)", placeholder: "digitalisierung" },
  { key: "utm_content", label: "Inhalt (utm_content)", placeholder: "header-button" },
];

/**
 * UTM campaign-link builder — compose a trackable URL from a base address +
 * utm_* parameters, with optional slug normalisation, live preview and copy.
 * Client-side only.
 */
export default function UtmBuilder() {
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
      return { url: "", error: "Bitte eine gültige URL inkl. https:// eingeben." };
    }
    for (const p of PARAMS) {
      const raw = values[p.key];
      if (!raw) continue;
      parsed.searchParams.set(p.key, autoSlug && p.key !== "utm_term" ? slugify(raw) : raw.trim());
    }
    return { url: parsed.toString(), error: null };
  }, [base, values, autoSlug]);

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

  const field = "w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-paper)] px-3 py-2";

  return (
    <div className="utm-tool space-y-5">
      <label className="block text-sm">
        <span className="mb-1 block opacity-80">Ziel-URL</span>
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
        Werte automatisch normalisieren (Kleinbuchstaben, Bindestriche)
      </label>

      {error ? (
        <p className="status-pill status-pill--danger text-sm">{error}</p>
      ) : (
        <div className="space-y-2">
          {missing.length > 0 && (
            <p className="text-xs opacity-70">Empfohlen: {missing.join(", ")} ausfüllen.</p>
          )}
          <div className="flex items-stretch gap-2">
            <output className="flex-1 select-all rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-4 py-3 font-mono text-sm break-all">
              {url || "—"}
            </output>
            <button type="button" onClick={copy} disabled={!url} className="rounded-lg bg-[color:var(--color-primary)] px-4 text-sm text-[color:var(--color-paper)] disabled:opacity-50">
              {copied ? "Kopiert ✓" : "Kopieren"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
