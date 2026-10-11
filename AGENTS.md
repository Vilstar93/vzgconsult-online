# VZG Consult – Website

Deutschsprachige Website für **VZG Consult** (Energieberatung, Wallerfangen).
Statische Seite mit Pug + SCSS + Bootstrap, deployt auf **Cloudflare Pages**
mit Serverless-Funktionen für Zahlung und Download.

## Build & Deploy

```bash
npm install          # einmalig
npm run build        # src/ → dist/  (Pug, SCSS, JS, Assets, i18n)
npm run start        # build + lokaler Dev-Server (browser-sync)
```

Deploy (Functions werden mit hochgeladen):

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=618a9ab751696fbc066923771b6a4d54
npx wrangler@3 pages deploy dist --project-name=vzgconsult --branch=main
```

- Projekt: `vzgconsult` → https://vzgconsult.pages.dev
- Details siehe `DEPLOY-CLOUDFLARE.md`

## Struktur

| Pfad | Zweck |
| --- | --- |
| `src/pug/` | Seiten (eine Datei pro Seite) + `includes/` |
| `src/data/prices.js` | Dienstleistungspreise (Website) |
| `src/data/products.js` | Digitale Produkte (Website) |
| `src/i18n/bg.json` | Bulgarische Übersetzungen (Schlüssel = deutscher Text) |
| `src/js/` | `checkout.js` (Buchung), `handbook.js` (Kauf/Download), `lang.js` (DE/BG) |
| `functions/api/` | Cloudflare-Pages-Funktionen (`/api/...`) |
| `functions/api/_payments.js` | Zahlungsanbieter (Unzer HPP v2, Paypercut) |
| `private/` | **Nicht** versioniert – PDF-Quelle für KV-Upload |
| `dist/` | Build-Ausgabe (wird mitversioniert und deployt) |

## Wichtige Regeln

- **Preise/Produkte doppelt pflegen:** `src/data/*.js` (Website) und
  `functions/api/_products.js` / `_prices.js` (Server) müssen übereinstimmen.
- **Sprachumschaltung** übersetzt Textknoten zur Laufzeit; neuer deutscher
  Text braucht einen Schlüssel in `src/i18n/bg.json`.
- **Paypercut ersetzt `{CHECKOUT_SESSION_ID}` nicht.** Bestell-ID selbst
  erzeugen und in `success_url` mitgeben.
- **Zahlungsanbieter** ist über `PAYMENT_PROVIDER` austauschbar
  (`unzer` / `paypercut`). Die Anbindung liegt zentral in
  `functions/api/_payments.js`; Bestellungen speichern den Anbieter mit, damit
  `download.js` die richtige Prüfung wählt.
- **Unzer** nutzt die Hosted Payment Page v2: Token über
  `token[.test].upcgw.com`, Zahlung über `paypage[.test].unzer.com/v2/merchant/paypage`,
  Prüfung über `GET /v2/merchant/paypage/{paypageId}`. Der Access-Token ist nur
  7 Minuten gültig und wird pro Request neu geholt.
- **Unzer signiert Webhooks nicht** – Absicherung über IP-Allowlist und
  serverseitiges Nachladen via `retrieveUrl`.
- **Redirects** nutzen den Origin der Anfrage (nicht `PUBLIC_BASE_URL`), damit
  sie auch vor der Domain-Umstellung funktionieren.
- **Der Ratgeber-PDF darf nie in `dist/` landen.** Auslieferung nur über
  `/api/download` nach serverseitiger Zahlungsprüfung, Datei liegt in
  Cloudflare KV (`file:handbook-energie-ratgeber.pdf`).

## Offen

- Custom-Domain `vzgconsult.online`: Nameserver bei **Porkbun** auf
  `alberto.ns.cloudflare.com` / `lara.ns.cloudflare.com` umstellen
  (Cloudflare-Zone ist vorbereitet).
