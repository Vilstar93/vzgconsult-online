# VZG Consult – Website

Statische Marketing-Website für **VZG Consult**, Hospitalstraße 30, 66798 Wallerfangen
– Ihr Partner für günstigste Energie.

## Inhalt

| Seite | Datei | Beschreibung |
| --- | --- | --- |
| Startseite | `index.html` | Überblick, drei Kernleistungen, Versprechen |
| Leistungen | `leistungen.html` | Energielösungen, Kundenservice & Callcenter, Kundenbindung & Marketing |
| Über uns | `ueber-uns.html` | Erfahrung, Philosophie, Herangehensweise |
| Preise | `preise.html` | Bezahlte Leistungen und Pakete mit Preisen |
| Termin buchen | `termin.html` | Service-Booking: Leistung, Termin, Zahlung |
| Kontakt | `kontakt.html` | Kontaktdaten, Öffnungszeiten, Formular, Karte |
| Impressum | `impressum.html` | Pflichtangaben (Vorlage – bitte prüfen/ergänzen) |
| Datenschutz | `datenschutz.html` | Datenschutzerklärung (Vorlage – bitte anpassen) |

## Technik

- **Bootstrap 5** Layout, **Sass** für das Styling, **Pug** für die Templates
- Build-Skripte aus der Basis-Vorlage Start Bootstrap *Business Casual*
  (MIT-Lizenz)

## Entwicklung

```bash
npm install      # Abhängigkeiten installieren
npm run build    # baut alle Seiten nach dist/
npm start        # baut und startet einen Live-Preview-Server
```

Die fertige Website liegt nach `npm run build` im Ordner `dist/`.
Dieser Ordner kann direkt auf einem Webhosting (Shared Hosting, Netlify,
GitHub Pages, …) veröffentlicht werden.

## Vor der Veröffentlichung zu erledigen

- **Impressum**: Umsatzsteuer-Identifikationsnummer (USt-IdNr.) ergänzen
  (Steuernummer ist bereits eingetragen) und Angaben rechtlich prüfen lassen.
- **Datenschutz**: Erklärung an den tatsächlich eingesetzten Hoster, das
  Formular-Backend und die Karte anpassen.
- **Kontaktformular**: Das Formular nutzt aktuell einen Platzhalter-Endpunkt
  (`formspree.io/f/vzgconsult`). Eine eigene `action`-URL oder ein
  Server-Endpunkt eintragen.
- **Online-Zahlung & Terminal**: siehe `PAYMENTS.md` – Zahlungsanbieter
  anbinden, Auszahlungen und Terminal einrichten. Ohne Konfiguration läuft die
  Buchung im Demo-Modus (nur Bestätigung, keine Zahlung).
- **Bilder**: Die verwendeten Fotos stammen von Unsplash (Unsplash-Lizenz).
  Eigene Bilder in `src/assets/img/` ersetzen.

## Lizenz / Attribution

Aufgebaut auf
[StartBootstrap/startbootstrap-business-casual](https://github.com/StartBootstrap/startbootstrap-business-casual)
(MIT). Der ursprüngliche Lizenztext befindet sich in `LICENSE`.
