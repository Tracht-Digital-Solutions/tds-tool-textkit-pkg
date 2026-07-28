// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PasswordGenerator from "./PasswordGenerator";

/**
 * A password generator is worth testing precisely because a broken one still
 * *looks* fine — it emits a plausible string. The properties that matter and
 * cannot be eyeballed:
 *
 *  - the character pool actually honours the checkboxes (a disabled set leaking
 *    in is invisible; a set silently missing weakens every password),
 *  - the requested length is exact,
 *  - the entropy readout matches length × log2(poolSize), since that number is
 *    what the user judges the password by,
 *  - randomness comes from `crypto.getRandomValues`, never `Math.random`.
 */

afterEach(cleanup);

const user = () => userEvent.setup({ delay: null });

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/";

/** The generated password (the `<output>` element). */
const password = () => document.querySelector("output")?.textContent ?? "";

const toggle = (label: RegExp) => screen.getByLabelText(label);

/**
 * Move the length slider. A range input ignores typing, so drive it the way the
 * browser does: set `value` through the native setter (React tracks the last
 * value on the node and would otherwise swallow the event) and dispatch `input`.
 */
const setLength = async (n: number) => {
  const slider = screen.getByRole("slider");
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  setter.call(slider, String(n));
  slider.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("generation", () => {
  it("produces a password on mount", () => {
    render(<PasswordGenerator />);
    expect(password()).not.toBe("—");
    expect(password().length).toBe(20); // shipped default length
  });

  it("uses crypto.getRandomValues, not Math.random", () => {
    const crypt = vi.spyOn(globalThis.crypto, "getRandomValues");
    const mathRandom = vi.spyOn(Math, "random");

    render(<PasswordGenerator />);

    expect(crypt).toHaveBeenCalled();
    expect(mathRandom).not.toHaveBeenCalled();
  });

  it("regenerates a different password on demand", async () => {
    render(<PasswordGenerator />);
    const first = password();

    await user().click(screen.getByRole("button", { name: "Neu erzeugen" }));

    // 20 chars from an 86-char pool — a collision is not a realistic flake.
    await waitFor(() => expect(password()).not.toBe(first));
    expect(password().length).toBe(20);
  });

  it("honours the requested length exactly", async () => {
    render(<PasswordGenerator />);
    await setLength(32);
    await waitFor(() => expect(password().length).toBe(32));

    await setLength(6);
    await waitFor(() => expect(password().length).toBe(6));
  });
});

describe("character pool", () => {
  /** Uncheck every set except the ones named. */
  const only = async (...keep: RegExp[]) => {
    const all = [/Kleinbuchstaben/, /Großbuchstaben/, /Ziffern/, /Sonderzeichen/];
    for (const label of all) {
      const box = toggle(label) as HTMLInputElement;
      const wanted = keep.some((k) => k.source === label.source);
      if (box.checked !== wanted) await user().click(box);
    }
  };

  it("uses only digits when only digits are selected", async () => {
    render(<PasswordGenerator />);
    await only(/Ziffern/);
    await setLength(64);

    await waitFor(() => expect(password()).toMatch(/^[0-9]{64}$/));
  });

  it("uses only lowercase when only lowercase is selected", async () => {
    render(<PasswordGenerator />);
    await only(/Kleinbuchstaben/);
    await setLength(64);

    await waitFor(() => expect(password()).toMatch(/^[a-z]{64}$/));
  });

  it("never emits a character from a disabled set", async () => {
    render(<PasswordGenerator />);
    await only(/Kleinbuchstaben/, /Ziffern/);
    await setLength(64);

    await waitFor(() => {
      const pw = password();
      expect(pw.length).toBe(64);
      for (const ch of pw) {
        expect(UPPER.includes(ch), `uppercase ${ch} leaked in`).toBe(false);
        expect(SYMBOLS.includes(ch), `symbol ${ch} leaked in`).toBe(false);
      }
    });
  });

  it("excludes look-alike characters when asked", async () => {
    // Deterministic: walk the pool index by index so the password contains
    // EVERY character the pool offers. Relying on chance here is not enough —
    // with a random 64-char sample this assertion passes ~1% of the time even
    // when the filter is disabled, which would make the test decorative.
    let i = 0;
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(((buf: Uint32Array) => {
      buf[0] = i++;
      return buf;
    }) as typeof crypto.getRandomValues);

    render(<PasswordGenerator />);
    await user().click(toggle(/Verwechselbare Zeichen ausschließen/));
    await setLength(64);

    await waitFor(() => {
      const pw = password();
      expect(pw.length).toBe(64);
      for (const ch of "Il1O0o") expect(pw.includes(ch), `${ch} should be excluded`).toBe(false);
    });
  });

  it("does include look-alike characters when the option is off", async () => {
    // The counterpart of the test above: proves the exclusion test is actually
    // observing the filter rather than a pool that never had them.
    let i = 0;
    vi.spyOn(globalThis.crypto, "getRandomValues").mockImplementation(((buf: Uint32Array) => {
      buf[0] = i++;
      return buf;
    }) as typeof crypto.getRandomValues);

    render(<PasswordGenerator />);
    await setLength(64);

    await waitFor(() => {
      const pw = password();
      expect(pw.length).toBe(64);
      expect([..."Il1O0o"].some((ch) => pw.includes(ch))).toBe(true);
    });
  });

  it("empties the output when every set is disabled", async () => {
    render(<PasswordGenerator />);
    await only(); // none

    await waitFor(() => expect(password()).toBe("—"));
    expect(screen.getByText("Keine Zeichen gewählt")).toBeDefined();
  });

  it("recovers once a set is re-enabled", async () => {
    render(<PasswordGenerator />);
    await only();
    await waitFor(() => expect(password()).toBe("—"));

    await user().click(toggle(/Ziffern/));
    await waitFor(() => expect(password()).toMatch(/^[0-9]+$/));
  });
});

describe("strength readout", () => {
  /** bits = round(length * log2(pool)) — the formula the UI advertises. */
  const expectedBits = (length: number, pool: number) =>
    Math.round(length * Math.log2(pool));

  const onlyDigits = async () => {
    for (const label of [/Kleinbuchstaben/, /Großbuchstaben/, /Sonderzeichen/]) {
      await user().click(toggle(label));
    }
  };

  it("reports the entropy of the default configuration", async () => {
    render(<PasswordGenerator />);
    // 26 + 26 + 10 + 24 = 86 characters, length 20.
    const bits = expectedBits(20, 86);
    expect(screen.getByText(new RegExp(`~${bits} bit`))).toBeDefined();
  });

  it("labels a short digits-only password as weak", async () => {
    render(<PasswordGenerator />);
    await onlyDigits();
    await setLength(6);

    // 6 * log2(10) ≈ 20 bits — below the 40-bit "Schwach" boundary.
    await waitFor(() => expect(screen.getByText(/Schwach · ~20 bit/)).toBeDefined());
  });

  it("labels a mid-length digits-only password as medium", async () => {
    render(<PasswordGenerator />);
    await onlyDigits();
    await setLength(15);

    // ≈ 50 bits — inside the 40–69 "Mittel" band.
    await waitFor(() => expect(screen.getByText(/Mittel · ~50 bit/)).toBeDefined());
  });

  it("labels a long digits-only password as strong", async () => {
    render(<PasswordGenerator />);
    await onlyDigits();
    await setLength(25);

    // ≈ 83 bits — inside the 70–99 "Stark" band.
    await waitFor(() => expect(screen.getByText(/Stark · ~83 bit/)).toBeDefined());
  });

  it("labels the full pool at maximum length as very strong", async () => {
    render(<PasswordGenerator />);
    await setLength(64);

    await waitFor(() => expect(screen.getByText(/Sehr stark/)).toBeDefined());
  });

  it("drops the entropy when a set is removed", async () => {
    render(<PasswordGenerator />);
    const before = Number(/~(\d+) bit/.exec(shownStrength())![1]);

    await user().click(toggle(/Sonderzeichen/));

    await waitFor(() => {
      const after = Number(/~(\d+) bit/.exec(shownStrength())![1]);
      expect(after).toBeLessThan(before);
    });
  });

  function shownStrength(): string {
    return screen.getByText(/bit|Keine Zeichen/).textContent ?? "";
  }
});

describe("copy to clipboard", () => {
  it("copies the generated password", async () => {
    const u = userEvent.setup({ delay: null });
    const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

    render(<PasswordGenerator />);
    const pw = password();
    await u.click(screen.getByRole("button", { name: "Kopieren" }));

    expect(write).toHaveBeenCalledWith(pw);
    expect(await screen.findByRole("button", { name: "Kopiert ✓" })).toBeDefined();
  });

  it("disables copy when there is nothing to copy", async () => {
    render(<PasswordGenerator />);
    for (const label of [/Kleinbuchstaben/, /Großbuchstaben/, /Ziffern/, /Sonderzeichen/]) {
      await user().click(toggle(label));
    }

    await waitFor(() =>
      expect((screen.getByRole("button", { name: "Kopieren" }) as HTMLButtonElement).disabled).toBe(
        true,
      ),
    );
  });

  it("does not falsely confirm when the clipboard is denied", async () => {
    const u = userEvent.setup({ delay: null });
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));

    render(<PasswordGenerator />);
    await u.click(screen.getByRole("button", { name: "Kopieren" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Kopieren" })).toBeDefined());
  });
});
