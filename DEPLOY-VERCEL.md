# Deployment auf Vercel – Schritt für Schritt (VZG Consult)

Diese Anleitung führt von „Code liegt auf GitHub" bis „Live-Site mit eigener
Domain, bereit zur Prüfung durch Paypercut".

> **Wichtig:** Ein Repository und ein Vercel-Konto müssen von **Ihnen** angelegt
> werden (Login/2FA). Der Agent kann das nicht automatisiert tun. Danach ist der
> Rest in wenigen Minuten erledigt.

---

## 1. Repository und Code hochladen

Das Repository ist bereits angelegt und als Remote verbunden:

- **Repository:** https://github.com/Vilstar93/vzgconsult-online
- **Remote:** `origin` → `https://github.com/Vilstar93/vzgconsult-online.git`
- **Branch:** `main` (der Remote-Branch `main` ist bereits in die lokale
  Historie eingebunden – der Push ist ein einfacher Fast-Forward)

Den Code hochladen (einmalig), im Projektordner:

```bash
git push -u origin main
```

> Hinweis: Der automatisierte Agent hat hier nur **Lesezugriff** auf das
> Repository. Der Push muss daher von Ihnen (mit Ihrem GitHub-Login) ausgeführt
> werden. Alternativ laden Sie das Projekt als ZIP über die GitHub-Oberfläche
> hoch.

Falls Sie stattdessen ein neues Repository anlegen möchten:

```bash
gh repo create vzgconsult-online --public --source=. --remote=origin --push
```

---

## 2. Projekt mit Vercel verbinden

1. https://vercel.com/new öffnen und mit GitHub anmelden.
2. Das Repository `Vilstar93/vzgconsult-online` importieren.
3. Vercel erkennt die Einstellungen aus `vercel.json` automatisch:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Auf **Deploy** klicken. Nach ~1 Minute ist die Site unter
   `https://<projekt>.vercel.app` live.

---

## 3. Eigene Domain verbinden (vzgconsult.online)

1. Im Vercel-Projekt: **Settings → Domains → Add**.
2. `vzgconsult.online` und `www.vzgconsult.online` hinzufügen.
3. Vercel zeigt die nötigen DNS-Einträge. Bei Ihrem Domain-Anbieter eintragen:
   - **A** `@` → `76.76.21.21`
   - **CNAME** `www` → `cname.vercel-dns.com`
   (oder die von Vercel aktuell angezeigten Werte übernehmen.)
4. Nach der DNS-Prüfung stellt Vercel automatisch ein **HTTPS-Zertifikat** aus.

---

## 4. Zahlungen aktivieren (Umgebungsvariablen)

Im Vercel-Projekt: **Settings → Environment Variables** (für „Production"):

| Name | Wert |
| --- | --- |
| `PAYMENT_PROVIDER` | `paypercut` (oder `stripe`) |
| `PAYPERCUT_SECRET_KEY` | Ihr geheimer Paypercut-Schlüssel |
| `PAYPERCUT_WEBHOOK_SECRET` | Ihr Paypercut-Webhook-Secret |
| `PUBLIC_BASE_URL` | `https://www.vzgconsult.online` |
| `STRIPE_SECRET_KEY` | nur bei Stripe |

Danach **Redeploy** auslösen (Deployments → … → Redeploy), damit die Variablen
greifen. Die Checkout-Logik liegt unter `api/create-checkout-session.js`
(Vercel-Serverless-Function) und wird automatisch bereitgestellt.

---

## 5. Paypercut-Konto beantragen und Website zur Prüfung einreichen

1. Konto erstellen: https://dashboard.paypercut.io/register (EU-Unternehmen,
   Deutschland ist unterstützt).
2. Unternehmensdaten und Bankkonto (IBAN) hinterlegen, KYC abschließen.
3. Bei der Antragstellung als **Website** angeben:
   `https://www.vzgconsult.online`
4. Prüfungsrelevante Seiten sind bereits vorhanden:
   - **Impressum** (Anbieter, Inhaber, Steuernummer): `/impressum.html`
   - **Datenschutzerklärung**: `/datenschutz.html`
   - **AGB & Widerrufsbelehrung**: `/agb.html`
   - **Preise/Leistungen**: `/preise.html`
   - **Buchung/Checkout**: `/termin.html`
5. Webhook im Paypercut-Dashboard auf
   `https://www.vzgconsult.online/api/webhook` setzen.

---

## 6. Checkliste für die Paypercut-Prüfung

- [ ] Live-Site über eigene Domain mit HTTPS erreichbar
- [ ] Impressum vollständig (USt-IdNr. ergänzen, falls vorhanden)
- [ ] Datenschutz inkl. Zahlungsdienstleister
- [ ] AGB + Widerrufsbelehrung verlinkt und im Checkout akzeptiert
- [ ] Preise klar ausgewiesen (netto zzgl. 19 % USt.)
- [ ] Kontaktmöglichkeiten (Telefon, E-Mail) vorhanden
- [ ] Checkout-Funktion erreichbar (Buchung → Zahlung)
- [ ] Rückerstattungs-/Stornoregeln beschrieben (AGB Ziffer 4)

---

## Technische Hinweise

- **Serverless statt Dauer-Server:** Auf Vercel läuft die Zahlungslogik als
  Function in `api/`. Der separate Express-Server in `server/` bleibt für
  eigenes Hosting (z. B. Render/Railway) erhalten.
- **Statische Dateien** (`robots.txt`, `sitemap.xml`) liegen in `public/` und
  werden beim Build nach `dist/` kopiert.
- **Domain in Sitemap:** Nach dem Verbinden der Domain ggf.
  `public/sitemap.xml` und `public/robots.txt` auf die endgültige Domain
  anpassen.
