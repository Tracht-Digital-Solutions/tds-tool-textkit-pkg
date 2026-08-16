import { useCallback, useEffect, useState } from "react";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
};
const AMBIGUOUS = new Set("Il1O0o".split(""));

/** Cryptographically-strong random integer in [0, max) via rejection sampling. */
function randInt(max: number): number {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;
  let x = 0;
  do {
    crypto.getRandomValues(buf);
    x = buf[0]!;
  } while (x >= limit);
  return x % max;
}

/** Rough strength label from entropy (bits = length * log2(poolSize)). */
function strength(bits: number): { label: string; tone: string; pct: number } {
  const pct = Math.max(0, Math.min(100, Math.round((bits / 128) * 100)));
  if (bits < 40) return { label: "Schwach", tone: "var(--color-danger)", pct };
  if (bits < 70) return { label: "Mittel", tone: "var(--color-warning)", pct };
  if (bits < 100) return { label: "Stark", tone: "var(--color-success)", pct };
  return { label: "Sehr stark", tone: "var(--color-success)", pct };
}

/**
 * Secure password generator — `crypto.getRandomValues` (not `Math.random`),
 * configurable length + character sets, live strength estimate, copy to
 * clipboard. Everything client-side; nothing leaves the browser.
 */
export default function PasswordGenerator() {
  const [length, setLength] = useState(20);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [noAmbiguous, setNoAmbiguous] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const buildPool = useCallback((): string => {
    let pool = "";
    if (lower) pool += SETS.lower;
    if (upper) pool += SETS.upper;
    if (digits) pool += SETS.digits;
    if (symbols) pool += SETS.symbols;
    if (noAmbiguous) pool = [...pool].filter((c) => !AMBIGUOUS.has(c)).join("");
    return pool;
  }, [lower, upper, digits, symbols, noAmbiguous]);

  const generate = useCallback(() => {
    const pool = buildPool();
    if (pool.length === 0) {
      setPassword("");
      return;
    }
    let out = "";
    for (let i = 0; i < length; i++) out += pool[randInt(pool.length)];
    setPassword(out);
    setCopied(false);
  }, [buildPool, length]);

  useEffect(() => {
    generate();
  }, [generate]);

  const pool = buildPool();
  const bits = pool.length > 0 ? Math.round(length * Math.log2(pool.length)) : 0;
  const s = strength(bits);

  const copy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="password-tool space-y-5">
      <div className="flex items-stretch gap-2">
        <output className="tds-card flex-1 select-all px-4 py-3 font-mono text-lg break-all">
          {password || "—"}
        </output>
        <button type="button" className="btn btn-ghost" onClick={copy} disabled={!password}>
          {copied ? "Kopiert ✓" : "Kopieren"}
        </button>
        <button type="button" className="btn btn-primary" onClick={generate} aria-label="Neu erzeugen">
          ↻
        </button>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-sm">
          <span className="opacity-80">Länge: {length}</span>
          <span style={{ color: s.tone }}>{pool.length > 0 ? `${s.label} · ~${bits} bit` : "Keine Zeichen gewählt"}</span>
        </div>
        <input type="range" min={6} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-full" />
        {/* The one radius this pack still writes by hand. A 6px strength meter
            is a capsule on every surface (the library rounds its own capsules
            to `--tds-radius-pill` too), and it is a readout, not a control —
            so it carries no surface geometry decision. It cannot use
            `rounded-[var(--tds-radius-bar)]` either: Tailwind does not
            generate arbitrary values out of a package inside node_modules,
            so that would ship as no rule at all. */}
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-border)]">
          <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.tone }} />
        </div>
      </div>

      <fieldset className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} /> Kleinbuchstaben (a-z)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> Großbuchstaben (A-Z)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={digits} onChange={(e) => setDigits(e.target.checked)} /> Ziffern (0-9)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} /> Sonderzeichen</label>
        <label className="col-span-2 flex items-center gap-2"><input type="checkbox" checked={noAmbiguous} onChange={(e) => setNoAmbiguous(e.target.checked)} /> Verwechselbare Zeichen ausschließen (I l 1 O 0 o)</label>
      </fieldset>

      <p className="text-xs opacity-60">
        Passwörter werden lokal in deinem Browser mit einem kryptografisch sicheren Zufallsgenerator erzeugt und niemals übertragen.
      </p>
    </div>
  );
}
