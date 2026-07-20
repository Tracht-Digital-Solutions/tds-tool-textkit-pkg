import { defineToolPack, defineTool } from "@tracht-digital-solutions/tds-tools-contract";

/** Text & link utilities: a secure password generator + a UTM link builder. */
export default defineToolPack({
  id: "text",
  name: "Text & Links",
  version: "0.1.0",
  tools: [
    defineTool({
      id: "password-generator",
      slug: "passwort-generator",
      name: "Passwort-Generator",
      category: "security",
      description:
        "Erzeuge sichere, zufällige Passwörter mit einstellbarer Länge und Zeichenauswahl — lokal im Browser, nichts verlässt dein Gerät.",
      icon: "key",
      keywords: ["passwort", "password", "generator", "sicherheit", "zufällig"],
      component: "@tracht-digital-solutions/tds-tool-textkit/tools/PasswordGenerator.astro",
      seo: {
        title: "Passwort-Generator — sichere Passwörter erstellen",
        description:
          "Kostenloser Passwort-Generator: sichere Zufallspasswörter mit einstellbarer Länge und Zeichenauswahl. Läuft komplett lokal im Browser.",
      },
    }),
    defineTool({
      id: "utm-builder",
      slug: "utm-link-generator",
      name: "UTM-Link-Generator",
      category: "marketing",
      description:
        "Baue nachverfolgbare Kampagnen-Links mit UTM-Parametern für Google Analytics & Co. — inklusive Slug-Vorschau und Kopierfunktion.",
      icon: "link",
      keywords: ["utm", "kampagne", "tracking", "analytics", "link", "slug"],
      component: "@tracht-digital-solutions/tds-tool-textkit/tools/UtmBuilder.astro",
      seo: {
        title: "UTM-Link-Generator — Kampagnen-Links mit Tracking",
        description:
          "Kostenloser UTM-Builder: erstelle nachverfolgbare Marketing-Links mit utm_source, utm_medium und utm_campaign. Direkt im Browser.",
      },
    }),
  ],
  i18n: {
    de: { "text.password": "Passwort-Generator", "text.utm": "UTM-Link-Generator" },
    en: { "text.password": "Password Generator", "text.utm": "UTM Link Builder" },
  },
});
