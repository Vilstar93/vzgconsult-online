'use strict';

/*
 * Vercel Serverless Function – Checkout-Session erzeugen.
 * Unterstützt Stripe und Paypercut. Der geheime Schlüssel kommt aus den
 * Vercel-Umgebungsvariablen (Settings → Environment Variables), nicht aus dem Code.
 *
 * Benötigte Variablen (je nach Anbieter):
 *   PAYMENT_PROVIDER=stripe|paypercut
 *   STRIPE_SECRET_KEY=...        STRIPE_WEBHOOK_SECRET=...
 *   PAYPERCUT_SECRET_KEY=...     PAYPERCUT_WEBHOOK_SECRET=...
 *   PUBLIC_BASE_URL=https://ihre-domain.de
 */

const PRICES = require('../src/data/prices.js');

function findService(name) {
    return PRICES.find((item) => item.name === name);
}

function baseUrl(req) {
    if (process.env.PUBLIC_BASE_URL) {
        return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
    }
    const proto = req.headers['x-forwarded-proto'] || 'https';
    return `${proto}://${req.headers.host}`;
}

async function createStripeSession(data, base) {
    const Stripe = require('stripe');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const service = findService(data.service);
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
        success_url: `${base}/termin.html?status=success`,
        cancel_url: `${base}/termin.html?status=cancel`,
        metadata: { service: service.name, date: data.date || '', time: data.time || '' }
    });
    return session.url;
}

async function createPaypercutSession(data, base) {
    const service = findService(data.service);
    const response = await fetch('https://api.paypercut.io/v1/checkouts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.PAYPERCUT_SECRET_KEY}`
        },
        body: JSON.stringify({
            currency: 'eur',
            mode: 'payment',
            success_url: `${base}/termin.html?status=success`,
            cancel_url: `${base}/termin.html?status=cancel`,
            line_items: [{ name: service.name, quantity: 1, unit_price: service.amountCents }],
            metadata: { service: service.name, date: data.date || '', time: data.time || '' }
        })
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Paypercut-Fehler.');
    }
    return result.url || result.checkout_url;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Methode nicht erlaubt.' });
    }

    try {
        const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

        if (data.payNow === false) {
            return res.json({
                message:
                    'Ihre Buchungsanfrage ist eingegangen. Wir senden Ihnen eine Bestätigung und die Rechnung per E-Mail.'
            });
        }

        const service = findService(data.service);
        if (!service) {
            return res.status(400).json({ message: 'Unbekannte Leistung.' });
        }

        const provider = (process.env.PAYMENT_PROVIDER || 'paypercut').toLowerCase();
        const base = baseUrl(req);

        let url;
        if (provider === 'stripe') {
            if (!process.env.STRIPE_SECRET_KEY) {
                return res.status(500).json({ message: 'Stripe ist nicht konfiguriert.' });
            }
            url = await createStripeSession(data, base);
        } else {
            if (!process.env.PAYPERCUT_SECRET_KEY) {
                return res.status(500).json({ message: 'Paypercut ist nicht konfiguriert.' });
            }
            url = await createPaypercutSession(data, base);
        }

        if (!url) {
            return res.status(502).json({ message: 'Keine Checkout-Adresse erhalten.' });
        }
        res.json({ url });
    } catch (error) {
        console.error('[checkout]', error.message);
        res.status(400).json({ message: error.message || 'Zahlung konnte nicht erstellt werden.' });
    }
};
