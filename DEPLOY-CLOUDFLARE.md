# Deployment auf Cloudflare Pages (VZG Consult)

Cloudflare Pages ist die kostenlose Alternative zu Vercel – unbegrenzter
Traffic, keine „Pro"-Hürde, funktioniert mit privaten GitHub-Repositories.

## 0. Bereits eingerichtet

- **Projekt:** `vzgconsult` → https://vzgconsult.pages.dev
- **Account-ID:** `618a9ab751696fbc066923771b6a4d54`
- **Zahlung:** Paypercut (Test), Funktionen unter `/api/...`
- **Umgebungsvariablen:** `PAYMENT_PROVIDER`, `PAYPERCUT_SECRET_KEY`,
  `PUBLIC_BASE_URL=https://vzgconsult.online`

### Domain vzgconsult.online (Porkbun → Cloudflare)

Die Zone ist in Cloudflare angelegt. Bei **Porkbun** müssen die Nameserver
geändert werden:

| Von (Porkbun) | Nach (Cloudflare) |
| --- | --- |
| `curitiba.ns.porkbun.com` | `alberto.ns.cloudflare.com` |
| `fortaleza.ns.porkbun.com` | `lara.ns.cloudflare.com` |
| `maceio.ns.porkbun.com` | |
| `salvador.ns.porkbun.com` | |

DNS-Einträge (bereits angelegt): `@` und `www` → CNAME `vzgconsult.pages.dev`
(proxied). HTTPS-Zertifikat wird automatisch ausgestellt.

> **E-Mail:** Falls E-Mail über die Domain läuft, die nötigen MX-Einträge vor
> der Nameserver-Umstellung in Cloudflare anlegen, sonst geht E-Mail verloren.

## 1. Projekt anlegen (Referenz)

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages**
   → **Connect to Git**.
2. GitHub verbinden und Repository **`Vilstar93/vzgconsult-online`** wählen
   (bei privatem Repo die Cloudflare-GitHub-App für dieses Repo freigeben).
3. Branch: **`main`**.
4. Build-Einstellungen:

   | Feld | Wert |
   | --- | --- |
   | Framework preset | **None** |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

5. **Save and Deploy**.

## 2. Umgebungsvariablen

**Settings → Variables and Secrets** (Production):

| Name | Wert |
| --- | --- |
| `PAYMENT_PROVIDER` | `paypercut` (oder `stripe`) |
| `PAYPERCUT_SECRET_KEY` | `sk_test_...` bzw. `sk_live_...` |
| `PAYPERCUT_WEBHOOK_SECRET` | `whsec_...` |
| `PUBLIC_BASE_URL` | `https://vzgconsult.online` |
| `STRIPE_SECRET_KEY` | nur bei Stripe |
| `STRIPE_WEBHOOK_SECRET` | nur bei Stripe |

> `PORT` nicht setzen.

## 3. Zahlungsfunktionen

Die Serverless-Funktionen liegen unter `functions/api/` und werden automatisch
unter `/api/...` bereitgestellt – identische Pfade wie die Vercel-Varianten:

- `functions/api/create-checkout-session.js` → `/api/create-checkout-session`
- `functions/api/webhook.js` → `/api/webhook`
- `functions/api/buy-handbook.js` → `/api/buy-handbook` (Kauf des Ratgebers)
- `functions/api/download.js` → `/api/download` (geprüfter PDF-Download)

Das Buchungsformular (`termin.html`) nutzt weiterhin
`data-checkout-url="/api/create-checkout-session"` – keine Änderung nötig.

## 3a. Digitaler Ratgeber (Sofort-Download, 199 €)

Der Energie-Ratgeber wird als digitales Produkt verkauft. Ablauf:

1. Auf `ratgeber.html` erzeugt `/api/buy-handbook` eine Bestellung und einen
   Paypercut-Checkout. Die Bestell-ID steht in `success_url` und
   `client_reference_id`.
2. Die Bestellung wird in KV (`ORDERS`) unter `order:<id>` als `pending`
   gespeichert.
3. Nach der Zahlung landet der Kunde auf `download.html?order=<id>`. Die
   Funktion `/api/download` prüft die Zahlung **serverseitig** bei Paypercut
   (`payment_status === "paid"`) und liefert erst dann das PDF aus KV
   (`file:handbook-energie-ratgeber.pdf`).

> **Wichtig:** Paypercut ersetzt `{CHECKOUT_SESSION_ID}` im `success_url`
> **nicht**. Deshalb wird die Bestell-ID vorab erzeugt und selbst mitgegeben.

### KV-Namespace und Binding

- Namespace: **`vzg-orders`** (`65312150dfd546a7bd947f9a8d42f262`)
- Binding: **`ORDERS`** (Production und Preview)

### PDF hochladen / ersetzen

Das PDF liegt **nicht** im Repository (siehe `.gitignore`, Ordner `private/`).
Nach einer Änderung neu hochladen:

```bash
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/storage/kv/namespaces/<NAMESPACE_ID>/values/file:handbook-energie-ratgeber.pdf" \
  -H "Authorization: Bearer <CLOUDFLARE_API_TOKEN>" \
  -H "Content-Type: application/pdf" \
  --data-binary @private/handbook-energie-ratgeber.pdf
```

Preis und Produktdaten stehen in `src/data/products.js` (Website) und
`functions/api/_products.js` (Server). Beide müssen übereinstimmen.


## 4. Webhook im Paypercut-Dashboard

`https://<projekt>.pages.dev/api/webhook` eintragen (später die eigene Domain).

## 5. Eigene Domain

**Custom domains** → Domain hinzufügen. Bei einer Domain, die bereits bei
Cloudflare liegt, wird der DNS-Eintrag automatisch gesetzt; HTTPS ist inklusive.

## 6. Security-Header

`public/_headers` wird nach `dist/` kopiert und setzt u. a.
`X-Content-Type-Options`, `X-Frame-Options` und `Referrer-Policy`.
