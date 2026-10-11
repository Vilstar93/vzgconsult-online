# Zahlungen & Service-Buchung – Einrichtung für VZG Consult

Diese Anleitung beschreibt, wie Sie **online buchbare, bezahlte Leistungen**,
ein **Checkout-Terminal** und **schnelle Auszahlungen** einrichten.

Die Website ist bereits vorbereitet:

- **Leistungen & Preise**: `src/data/prices.js` (eine zentrale Datei).
- **Service-Booking-Seite**: `termin.html` (Leistung, Termin, Kundendaten, Zahlung).
- **Checkout-Logik**: `src/js/checkout.js` (ohne API-Schlüssel im Browser).
- **Terminal**: Zahlungen vor Ort über einen Kartenleser (siehe unten).

---

## 1. Zahlungsanbieter wählen

Für einen Betrieb in Deutschland mit **Online-Checkout + Terminal + schnellen
Auszahlungen** sind zwei Anbieter besonders geeignet:

| Anbieter | Online-Checkout | Terminal vor Ort | Auszahlung |
| --- | --- | --- | --- |
| **Stripe** | Ja (Stripe Checkout) | Ja (Stripe Terminal, Tap to Pay) | Standard T+2/T+3, **Instant Payouts** optional (ca. 1 % Gebühr) |
| **SumUp** | Ja (Zahlungslinks, Online-Shop) | Ja (eigene Kartenterminals) | **nächster Werktag** nach Umsatz |

**Empfehlung:** **Stripe** – ein Anbieter für Online, Terminal und Auszahlungen,
mit optionalen Instant Payouts. SumUp ist eine gute Alternative, wenn vor allem
das Terminal und sehr schnelle Standard-Auszahlungen wichtig sind.

> Hinweis: Die erste Auszahlung bei Stripe erfolgt üblicherweise 7–14 Tage nach
> der ersten Live-Zahlung; danach greift der eingestellte Auszahlungsplan.

---

## 2. Schnellste Auszahlung einrichten

### Stripe
1. Konto anlegen: https://dashboard.stripe.com/register
2. Unternehmensdaten und Bankkonto (IBAN) hinterlegen.
3. **Auszahlungsplan** auf „täglich" stellen (Einstellungen → Auszahlungen).
4. Für sofortige Auszahlungen **Instant Payouts** in den
   Auszahlungseinstellungen aktivieren. Verfügbarkeit und Gebühr hängen von
   Land und Konto ab (in der Regel zusätzlich ca. 1 %).
5. Optional: „Next-day settlement" beantragen, wenn Ihr Konto dafür
   infrage kommt.

### SumUp
1. Konto anlegen: https://www.sumup.com/de-de/
2. Kartenterminal bestellen und mit dem Konto verbinden.
3. Auszahlungen erfolgen standardmäßig am **nächsten Werktag** auf Ihr
   Bankkonto.

---

## 3. Online-Zahlung auf der Website aktivieren (Stripe)

Es gibt zwei Wege – der **einfache** für den Start, der **vollständige** für
optimale Erfahrung.

### 3a. Einfach: Payment Links (kein Code)

1. Im Stripe-Dashboard einen **Payment Link** je Leistung anlegen
   (Zahlungslink für 49 €, 99 €, 149 € …).
2. Diese Links können Sie in E-Mails oder direkt auf der Buchungsbestätigung
   versenden.

### 3b. Vollständig: Stripe Checkout (empfohlen)

Auf der Buchungsseite (`termin.html`) setzen Sie am Formular ein Attribut:

```html
<form id="bookingForm" ... data-checkout-url="/api/create-checkout-session">
```

Der Endpunkt `POST /api/create-checkout-session` erhält die Formulardaten als
JSON und muss eine JSON-Antwort `{ "url": "https://checkout.stripe.com/..." }`
zurückgeben. Beispiel (Node.js mit dem Stripe-SDK, **serverseitig**):

```js
// server.js – läuft auf Ihrer Umgebung, NICHT im Browser
const express = require('express');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Secret nur serverseitig!
const app = express();
app.use(express.json());

app.post('/api/create-checkout-session', async (req, res) => {
    const { service, date, time, name, email } = req.body;
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price_data: { currency: 'eur', product_data: { name: service }, unit_amount: 9900 }, quantity: 1 }],
        customer_email: email,
        success_url: 'https://IHRE-DOMAIN.de/termin.html?status=success',
        cancel_url: 'https://IHRE-DOMAIN.de/termin.html?status=cancel',
        metadata: { service, date, time, name }
    });
    res.json({ url: session.url });
});

app.listen(3000);
```

**Wichtig:** Der geheime API-Schlüssel (`STRIPE_SECRET_KEY`) darf **niemals** im
Browser-Code stehen. Legen Sie ihn als Umgebungsvariable/Secret auf Ihrem Server
oder Hosting ab.

Der Einzelpreis (`unit_amount`) wird in **Cent** angegeben (99 € = `9900`).
Ordnen Sie den Betrag dem gewählten Paket zu.

---

## 4. Terminal für Zahlungen vor Ort (Checkout-Terminal)

Sie möchten Kartenzahlungen direkt vor Ort annehmen:

### Stripe Terminal
1. Gerät bzw. „Tap to Pay on iPhone/Android" bei Stripe bestellen/aktivieren.
2. Terminal mit Ihrem Stripe-Konto verbinden (Dashboard → Terminal).
3. Bei der **Vor-Ort-Energieberatung (249 €)** und anderen Leistungen Zahlung
   direkt am Gerät annehmen.

### SumUp Terminal
1. Terminal bei SumUp bestellen.
2. Mit Smartphone/Tablet koppeln.
3. Sofort einsatzbereit für Karte und kontaktloses Bezahlen.

---

## 5. Terminorganisation (Kalender)

Für automatische Terminbestätigung mit Kalender-Einladung:

1. Kostenloses Konto bei **Calendly** anlegen: https://calendly.com/
2. Ereignistypen für die Leistungen erstellen (z. B. „Tarif-Check, 60 Min").
3. Auf der Buchungsseite den Calendly-Link einbinden oder per Redirect nutzen.

---

## 6. Checkliste vor dem Livegang

- [ ] Zahlungsanbieter-Konto verifiziert und Bankkonto (IBAN) hinterlegt
- [ ] Auszahlungsplan auf „täglich"/„sofort" gestellt
- [ ] `data-checkout-url` am Formular gesetzt und Endpunkt erreichbar
- [ ] Preise in `src/data/prices.js` geprüft
- [ ] Umsatzsteuer (19 %) auf den Rechnungen korrekt ausgewiesen
- [ ] Datenschutzerklärung um Zahlungsanbieter ergänzt (bereits vorbereitet)
- [ ] Impressum vollständig (USt-IdNr. ergänzen)
- [ ] Testzahlung durchgeführt

---

## 7. Steuerlicher Hinweis

Bei online gebuchten, bezahlten Leistungen fallen **19 % Umsatzsteuer** an.
Die Preise auf der Website sind als **Nettopreise zzgl. USt.** ausgewiesen.
Achten Sie auf eine ordnungsgemäße Rechnungsstellung (Rechnungsnummer,
Leistungsdatum, Steuersatz). Im Zweifel steuerlichen Rat einholen.
