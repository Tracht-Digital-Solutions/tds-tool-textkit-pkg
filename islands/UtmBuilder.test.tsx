// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UtmBuilder from "./UtmBuilder";

/**
 * The builder's output is a tracking URL that gets pasted into campaigns, so
 * the things worth pinning are the ones that quietly corrupt attribution:
 * parameter names, when normalisation applies (and the deliberate `utm_term`
 * exemption), and that an existing query string on the base URL survives.
 */

afterEach(cleanup);

const user = () => userEvent.setup({ delay: null });

const url = () => document.querySelector("output")?.textContent ?? "";
const fill = async (label: RegExp, value: string) => {
  const input = screen.getByLabelText(label);
  await user().clear(input);
  if (value) await user().type(input, value);
};

const params = () => new URL(url()).searchParams;

describe("URL composition", () => {
  it("shows the bare base URL before any parameter is set", () => {
    render(<UtmBuilder />);
    expect(url()).toBe("https://tracht-digital.de/");
  });

  it("appends the utm_* parameters under their exact names", async () => {
    render(<UtmBuilder />);
    await fill(/Quelle/, "newsletter");
    await fill(/Medium/, "email");
    await fill(/Kampagne/, "fruehjahr-2026");

    await waitFor(() => {
      const p = params();
      expect(p.get("utm_source")).toBe("newsletter");
      expect(p.get("utm_medium")).toBe("email");
      expect(p.get("utm_campaign")).toBe("fruehjahr-2026");
    });
  });

  it("omits parameters that were left empty", async () => {
    render(<UtmBuilder />);
    await fill(/Quelle/, "newsletter");

    await waitFor(() => {
      const p = params();
      expect(p.get("utm_source")).toBe("newsletter");
      expect(p.has("utm_medium")).toBe(false);
      expect(p.has("utm_content")).toBe(false);
    });
  });

  it("preserves an existing query string on the base URL", async () => {
    render(<UtmBuilder />);
    await fill(/Ziel-URL/, "https://tracht-digital.de/leistungen?ref=partner");
    await fill(/Quelle/, "newsletter");

    await waitFor(() => {
      const p = params();
      expect(p.get("ref")).toBe("partner");
      expect(p.get("utm_source")).toBe("newsletter");
    });
  });

  it("keeps the path and fragment of the base URL", async () => {
    render(<UtmBuilder />);
    await fill(/Ziel-URL/, "https://tracht-digital.de/blog/post#abschnitt");
    await fill(/Quelle/, "newsletter");

    await waitFor(() => {
      const parsed = new URL(url());
      expect(parsed.pathname).toBe("/blog/post");
      expect(parsed.hash).toBe("#abschnitt");
    });
  });

  it("replaces rather than duplicates a parameter on re-edit", async () => {
    render(<UtmBuilder />);
    await fill(/Quelle/, "newsletter");
    await fill(/Quelle/, "instagram");

    await waitFor(() => {
      expect(params().getAll("utm_source")).toEqual(["instagram"]);
    });
  });
});

describe("normalisation", () => {
  it("slugifies values by default", async () => {
    render(<UtmBuilder />);
    await fill(/Kampagne/, "Frühjahr Aktion 2026");

    // lowercased, spaces → hyphens, non [a-z0-9-_] stripped ("ü" goes).
    await waitFor(() => expect(params().get("utm_campaign")).toBe("frhjahr-aktion-2026"));
  });

  it("collapses repeated hyphens", async () => {
    render(<UtmBuilder />);
    await fill(/Kampagne/, "sommer   -   sale");

    await waitFor(() => expect(params().get("utm_campaign")).toBe("sommer-sale"));
  });

  it("leaves utm_term unnormalised — keywords are searched verbatim", async () => {
    // The deliberate exemption: a keyword is a search phrase, not a slug.
    render(<UtmBuilder />);
    await fill(/Keyword/, "Digitalisierung für Unternehmen");

    await waitFor(() =>
      expect(params().get("utm_term")).toBe("Digitalisierung für Unternehmen"),
    );
  });

  it("passes values through untouched when normalisation is off", async () => {
    render(<UtmBuilder />);
    await user().click(screen.getByLabelText(/automatisch normalisieren/));
    await fill(/Kampagne/, "Frühjahr Aktion");

    await waitFor(() => expect(params().get("utm_campaign")).toBe("Frühjahr Aktion"));
  });

  it("trims surrounding whitespace either way", async () => {
    render(<UtmBuilder />);
    await user().click(screen.getByLabelText(/automatisch normalisieren/));
    await fill(/Quelle/, "  newsletter  ");

    await waitFor(() => expect(params().get("utm_source")).toBe("newsletter"));
  });
});

describe("validation", () => {
  it("rejects a URL without a scheme", async () => {
    render(<UtmBuilder />);
    await fill(/Ziel-URL/, "tracht-digital.de");

    expect(
      await screen.findByText("Bitte eine gültige URL inkl. https:// eingeben."),
    ).toBeDefined();
  });

  it("shows nothing rather than an error for an empty base", async () => {
    render(<UtmBuilder />);
    await fill(/Ziel-URL/, "");

    await waitFor(() => expect(url()).toBe("—"));
    expect(screen.queryByText(/gültige URL/)).toBeNull();
  });

  it("recovers once the URL becomes valid", async () => {
    render(<UtmBuilder />);
    await fill(/Ziel-URL/, "kaputt");
    expect(await screen.findByText(/gültige URL/)).toBeDefined();

    await fill(/Ziel-URL/, "https://tracht-digital.de");
    await waitFor(() => expect(screen.queryByText(/gültige URL/)).toBeNull());
  });

  it("names the recommended parameters that are still missing", async () => {
    render(<UtmBuilder />);

    const hint = await screen.findByText(/^Empfohlen:/);
    expect(hint.textContent).toContain("Quelle");
    expect(hint.textContent).toContain("Medium");
    expect(hint.textContent).toContain("Kampagne");
    // Optional ones must not be nagged about.
    expect(hint.textContent).not.toContain("Keyword");
  });

  it("drops the hint once the required trio is filled", async () => {
    render(<UtmBuilder />);
    await fill(/Quelle/, "newsletter");
    await fill(/Medium/, "email");
    await fill(/Kampagne/, "test");

    await waitFor(() => expect(screen.queryByText(/^Empfohlen:/)).toBeNull());
  });
});

describe("copy to clipboard", () => {
  it("copies the composed URL", async () => {
    const u = userEvent.setup({ delay: null });
    const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

    render(<UtmBuilder />);
    await u.click(screen.getByRole("button", { name: "Kopieren" }));

    expect(write).toHaveBeenCalledWith("https://tracht-digital.de/");
    expect(await screen.findByRole("button", { name: "Kopiert ✓" })).toBeDefined();
  });

  it("resets the confirmation when the URL changes", async () => {
    const u = userEvent.setup({ delay: null });
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);

    render(<UtmBuilder />);
    await u.click(screen.getByRole("button", { name: "Kopieren" }));
    await screen.findByRole("button", { name: "Kopiert ✓" });

    await fill(/Quelle/, "x");

    // Stale "Kopiert ✓" next to a changed URL would be a lie.
    await waitFor(() => expect(screen.getByRole("button", { name: "Kopieren" })).toBeDefined());
  });
});
