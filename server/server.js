'use strict';

/*
 * VZG Consult – Checkout-Server
 * ------------------------------------------------------------------
 * Erzeugt Checkout-Sitzungen für Stripe ODER Paypercut. Der geheime
 * API-Schlüssel bleibt ausschließlich hier auf dem Server.
 *
 * Start:
 *   cd server && npm install && cp .env.example .env
 *   # .env ausfüllen (Provider + Schlüssel)
 *   npm start
 *
 * Endpunkte:
 *   POST /api/create-checkout-session  -> { url }
 *   POST /api/webhook                  -> Anbieter-Callback (Bestätigung)
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4242;
const PROVIDER = (process.env.PAYMENT_PROVIDER || 'paypercut').toLowerCase();
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

// Eine Quelle für Preise: dieselbe Datei wie für die Website.
const PRICES = require('../src/data/prices.js');

function findService(name) {
    return PRICES.find((item) => item.name === name);
}

// ------------------------------------------------------------------
// Stripe
// ------------------------------------------------------------------
let stripe = null;
if (PROVIDER === 'stripe' && process.env.STRIPE_SECRET_KEY) {
    try {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    } catch (error) {
        console.warn('[warn] Stripe-SDK nicht installiert. `npm install stripe` ausführen.');
    }
}

async function createStripeSession(data) {
    const service = findService(data.service);
    if (!service) {
        throw new Error('Unbekannte Leistung.');
    }
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'eur',
                    product_data: { name: service.name },
                    unit_amount: service.amountCents
                }
            }
        ],
        customer_email: data.email || undefined,
        success_url: `${PUBLIC_BASE_URL}/termin.html?status=success`,
        cancel_url: `${PUBLIC_BASE_URL}/termin.html?status=cancel`,
        metadata: {
            service: service.name,
            date: data.date || '',
            time: data.time || '',
            name: data.name || '',
            phone: data.phone || ''
        }
    });
    return session.url;
}

// ------------------------------------------------------------------
// Paypercut (API-kompatibel zu Stripe-Checkout)
// ------------------------------------------------------------------
async function createPaypercutSession(data) {
    const service = findService(data.service);
    if (!service) {
        throw new Error('Unbekannte Leistung.');
    }
    const response = await fetch('https://api.paypercut.io/v1/checkouts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.PAYPERCUT_SECRET_KEY}`
        },
        body: JSON.stringify({
            currency: 'eur',
            mode: 'payment',
            success_url: `${PUBLIC_BASE_URL}/termin.html?status=success`,
            cancel_url: `${PUBLIC_BASE_URL}/termin.html?status=cancel`,
            line_items: [
                {
                    name: service.name,
                    quantity: 1,
                    unit_price: service.amountCents
                }
            ],
            metadata: {
                service: service.name,
                date: data.date || '',
                time: data.time || '',
                name: data.name || '',
                phone: data.phone || ''
            }
        })
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Paypercut-Fehler beim Erstellen der Zahlung.');
    }
    // Paypercut liefert die Checkout-URL (Feld `url` oder `checkout_url`).
    return result.url || result.checkout_url;
}

// ------------------------------------------------------------------
// Routen
// ------------------------------------------------------------------
app.use(express.static(path.resolve(__dirname, '../dist')));

// Webhook zuerst und mit Raw-Body, damit die Signatur geprüft werden kann.
app.post('/api/webhook', express.raw({ type: '*/*' }), (req, res) => {
    const rawBody = req.body;
    const signature =
        req.headers['stripe-signature'] || req.headers['paypercut-signature'] || '';

    let event;
    try {
        event = verifyWebhook(rawBody, signature);
    } catch (error) {
        console.error('[webhook] Signaturprüfung fehlgeschlagen:', error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    // Hier die Buchung/Bestellung bestätigen (z. B. E-Mail senden, Kalender).
    console.log('[webhook] Ereignis erhalten:', event.type || '(ohne Typ)');
    res.json({ received: true });
});

app.post('/api/create-checkout-session', express.json(), async (req, res) => {
    try {
        const data = req.body || {};

        // "Zahlung nach Bestätigung": keine Online-Zahlung auslösen.
        if (data.payNow === false) {
            return res.json({
                message: 'Ihre Buchungsanfrage ist eingegangen. Wir senden Ihnen eine Bestätigung und die Rechnung per E-Mail.'
            });
        }

        let url;
        if (PROVIDER === 'stripe') {
            if (!stripe) {
                return res.status(500).json({ message: 'Stripe ist nicht konfiguriert.' });
            }
            url = await createStripeSession(data);
        } else {
            url = await createPaypercutSession(data);
        }

        if (!url) {
            return res.status(502).json({ message: 'Der Zahlungsanbieter hat keine Checkout-Adresse geliefert.' });
        }
        res.json({ url });
    } catch (error) {
        console.error('[checkout]', error.message);
        res.status(400).json({ message: error.message || 'Zahlung konnte nicht erstellt werden.' });
    }
});

// Webhook: Bestätigung nach erfolgreicher Zahlung.

function verifyWebhook(rawBody, signature) {
    const secret =
        PROVIDER === 'stripe' ? process.env.STRIPE_WEBHOOK_SECRET : process.env.PAYPERCUT_WEBHOOK_SECRET;

    if (!secret) {
        // Ohne konfiguriertes Secret nur parsen (nicht für Produktion).
        return JSON.parse(rawBody.toString('utf8'));
    }

    // Einfache HMAC-Prüfung. Für Produktion die SDK-Signaturprüfung des
    // Anbieters verwenden (Stripe: stripe.webhooks.constructEvent).
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const provided = (signature || '').split(',').pop();
    if (expected !== provided) {
        throw new Error('Ungültige Signatur');
    }
    return JSON.parse(rawBody.toString('utf8'));
}

app.listen(PORT, () => {
    console.log(`VZG Consult Checkout-Server läuft auf Port ${PORT} (Anbieter: ${PROVIDER}).`);
});
