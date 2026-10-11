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

### 3b. Vollständig: Checkout über den mitgelieferten Server (empfohlen)

Im Ordner `server/` liegt ein fertiger Express-Server, der Checkout-Sitzungen
für **Stripe** oder **Paypercut** erzeugt. Das Formular in `termin.html` zeigt
bereits auf `/api/create-checkout-session`.

```bash
cd server
npm install
cp .env.example .env      # Anbieter + Schlüssel eintragen
npm start                 # http://localhost:4242
```

In `server/.env` wählen Sie den Anbieter (`PAYMENT_PROVIDER=stripe` oder
`paypercut`) und tragen den **geheimen** Schlüssel ein. Der Server bedient
sowohl die fertige Website (`dist/`) als auch die API-Endpunkte:

- `POST /api/create-checkout-session` → `{ "url": "https://…" }`
- `POST /api/webhook` → Bestätigung nach erfolgreicher Zahlung

Details zu den Anbietern, Gebühren und Auszahlungen: siehe `PAYMENT-OPTIONS.md`.

> Der geheime Schlüssel bleibt ausschließlich im Server (`.env`), niemals im
> Browser. `.env` ist in `.gitignore` eingetragen.

Die Preise kommen aus einer gemeinsamen Quelle (`src/data/prices.js`) – sowohl
die Website als auch der Server lesen daraus.

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
