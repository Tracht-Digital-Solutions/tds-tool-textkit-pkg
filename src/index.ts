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
      name: "UTM-Generator",
      category: "marketing",
      description:
        "UTM-Links für Kampagnen erstellen: utm_source, utm_medium und utm_campaign für Google Analytics & Co. setzen, mit Slug-Vorschau und Kopierfunktion.",
      icon: "link",
      keywords: ["utm generator", "utm builder", "utm link erstellen", "tracking link erstellen", "utm parameter", "kampagne", "tracking", "analytics"],
      component: "@tracht-digital-solutions/tds-tool-textkit/tools/UtmBuilder.astro",
      seo: {
        title: "UTM-Generator – Tracking-Links kostenlos erstellen",
        description:
          "UTM-Generator für Tracking-Links: utm_source, utm_medium und utm_campaign setzen und den fertigen UTM-Link kopieren, für Google Analytics. Kostenlos im Browser.",
      },
    }),
  ],
  i18n: {
    de: { "text.password": "Passwort-Generator", "text.utm": "UTM-Generator" },
    en: { "text.password": "Password Generator", "text.utm": "UTM Link Builder" },
  },
});
