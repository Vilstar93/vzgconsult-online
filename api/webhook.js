'use strict';

/*
 * Vercel Serverless Function – Webhook des Zahlungsanbieters.
 * Bestätigt eine Buchung nach erfolgreicher Zahlung (Stripe oder Paypercut).
 *
 * Benötigte Umgebungsvariablen:
 *   PAYMENT_PROVIDER=stripe|paypercut
 *   STRIPE_WEBHOOK_SECRET=whsec_...   oder   PAYPERCUT_WEBHOOK_SECRET=whsec_...
 *
 * Hinweis zur Signaturprüfung: Für Produktion die SDK-Prüfung des Anbieters
 * verwenden (Stripe: stripe.webhooks.constructEvent). Hier wird ersatzweise
 * eine HMAC-SHA256-Prüfung über den Roh-Body durchgeführt.
 */

const crypto = require('crypto');

function readRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

async function getRawBody(req) {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === 'string') return Buffer.from(req.body);
    if (req.body && typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body));
    if (req.readable) return readRawBody(req);
    return Buffer.from('');
}

function verify(raw, signature, secret) {
    if (!secret) {
        // Ohne konfiguriertes Secret nur parsen (nicht für Produktion).
        return JSON.parse(raw.toString('utf8') || '{}');
    }
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    const provided = (signature || '').split(',').pop();
    if (expected !== provided) {
        throw new Error('Ungültige Signatur');
    }
    return JSON.parse(raw.toString('utf8') || '{}');
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Methode nicht erlaubt.' });
    }

    const provider = (process.env.PAYMENT_PROVIDER || 'paypercut').toLowerCase();
    const secret =
        provider === 'stripe'
            ? process.env.STRIPE_WEBHOOK_SECRET
            : process.env.PAYPERCUT_WEBHOOK_SECRET;
    const signature =
        req.headers['stripe-signature'] || req.headers['paypercut-signature'] || '';

    try {
        const raw = await getRawBody(req);
        const event = verify(raw, signature, secret);

        // Hier die Buchung/Bestellung bestätigen (z. B. E-Mail senden, Kalender).
        console.log('[webhook] Ereignis erhalten:', event.type || '(ohne Typ)');
        res.json({ received: true });
    } catch (error) {
        console.error('[webhook] Signaturprüfung fehlgeschlagen:', error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
};
