# Zahlungsanbieter im Vergleich – für VZG Consult

Kurzfassung für die Entscheidung: **Stripe**, **Paypercut** und **SumUp** sind
die drei realistischen Optionen für VZG Consult (Deutschland) mit
Online-Checkout, Terminal und schnellen Auszahlungen.

## Vergleichstabelle

| Kriterium | **Stripe** | **Paypercut** | **SumUp** |
| --- | --- | --- | --- |
| Online-Checkout | ✅ Stripe Checkout (hosted/embedded) | ✅ Hosted/Embedded, Payment Links & QR-Codes | ✅ Zahlungslinks, Online-Shop |
| Karten | Visa/Mastercard, Amex, Wallets | Visa/Mastercard, Apple/Google Pay, BLIK | Visa/Mastercard, Apple/Google Pay |
| Buy Now Pay Later | ✅ (z. B. Klarna) | ✅ **BNPL-Aggregator** (mehrere Anbieter, Auszahlung sofort) | teilweise |
| Terminal vor Ort | ✅ Stripe Terminal / Tap to Pay | ❌ kein eigenes POS-Gerät | ✅ eigene Kartenterminals |
| Auszahlung | T+2/T+3, **Instant Payouts** (ca. +1 %) | Auszahlung auf bestehendes Bankkonto (Standard) | **nächster Werktag** |
| Gebühren (Karte, EU) | ca. 1,5 % + €0,25 | **1,29 % + €0,10** (EEA Verbraucherkarten) | ca. 1,49 % (Basis) |
| Monatsgebühren | keine | keine (nur pro Transaktion) | keine |
| Onboarding | sofort, ausgereift | 100 % digital, Freigabe in Tagen | schnell |
| Reifegrad | sehr hoch (Marktführer) | **neu** (Startup, 2025 gegründet) | hoch (SMB-fokussiert) |
| API | eigene, sehr ausgereift | **Stripe-kompatibel** (Checkout Sessions) | eingeschränkt |
| Plugins | Shopify, WooCommerce, viele | WooCommerce, Shopify, Magento, PrestaShop, OpenCart | wenige |

## Was ist Paypercut genau?

Paypercut (Paypercut EOOD, Sofia/Bulgarien, gegründet 2025) ist eine
europäische Fintech-Plattform für Online-Zahlungen. Kernpunkte:

- **Eine Integration, viele Zahlarten**: Karten, Wallets und **mehrere
  Buy-Now-Pay-Later-Anbieter** (erster BNPL-Aggregator in CEE) über einen
  Vertrag.
- **Produkte**: Online-Checkout, Payment Links & QR-Codes, Billing & Payouts
  (Abo/Teilzahlungen), BNPL-Aggregator.
- **Regulierung**: Paypercut selbst ist eine SaaS-Plattform; die regulierten
  Zahlungsdienste laufen über lizenzierte Partner **Paynetics AD** (E-Geld-
  Institut, Bulgarische Nationalbank) und **Adyen NV** (Kreditinstitut, DNB),
  passported im gesamten EWR.
- **Onboarding-Länder**: EU/EWR – **Deutschland ist unterstützt**.
- **Gebühren**: keine Aktivierungs-, Monats- oder Supportgebühren; nur pro
  erfolgreicher Transaktion (EEA-Verbraucherkarten **1,29 % + €0,10**).
- **API**: bewusst **Stripe-kompatibel** – Checkout Sessions unter
  `POST https://api.paypercut.io/v1/checkouts` mit `Authorization: Bearer …`
  und `line_items[{ name, quantity, unit_price }]`.
- **Auszahlung**: auf Ihr bestehendes Bankkonto, Multi-Currency; bei BNPL
  erhalten Sie das Geld **sofort** (upfront settlement).
- **Wichtig**: Paypercut nennt **kein physisches Kartenterminal** – für
  Zahlungen vor Ort ist ein separates Terminal nötig.

## Empfehlung für VZG Consult

1. **Online-Buchungen (Website)**: **Paypercut** ist dank niedriger Gebühren
   (1,29 % + €0,10) und einfacher, Stripe-kompatibler API sehr attraktiv.
   Unser Checkout-Server unterstützt Paypercut **und** Stripe – Sie können
   wechseln, ohne die Website zu ändern.
2. **Zahlungen vor Ort** (Vor-Ort-Energieberatung, 249 €): **SumUp-Terminal**
   oder **Stripe Terminal**. Paypercut hat hier kein eigenes Gerät.
3. **Schnellste Auszahlung**: **Stripe Instant Payouts** (ca. +1 %) oder
   **SumUp** (nächster Werktag).
4. **Risiko-Hinweis**: Paypercut ist ein junges Unternehmen (2025). Wenn
   maximale Zuverlässigkeit und ein integriertes Terminal wichtig sind, ist
   **Stripe** die konservative Wahl. Für reine Online-Zahlungen mit Fokus auf
   Kosten ist **Paypercut** einen Test wert (Sandbox vorhanden).

**Praktischer Weg:** Start mit **Stripe** (Online + Terminal aus einer Hand),
optional **Paypercut** für Online-Zahlungen ergänzen, um Gebühren zu senken.

## Umstellen zwischen Anbietern

In `server/.env` einfach umstellen – mehr ist nicht nötig:

```env
# Stripe:
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...

# oder Paypercut:
PAYMENT_PROVIDER=paypercut
PAYPERCUT_SECRET_KEY=sk_live_...
```

## Quellen

- Paypercut – Website & Preise: https://paypercut.com
- Paypercut – Dokumentation/API: https://docs.paypercut.io
- Paypercut – unterstützte Länder: https://docs.paypercut.io/docs/introduction/start-building/supported-countries
- Paypercut – erste API-Anfrage (Checkout Session): https://docs.paypercut.io/docs/introduction/start-developing/
- Stripe – Auszahlungen: https://docs.stripe.com/payouts
- SumUp – Zahlungslösungen: https://www.sumup.com
