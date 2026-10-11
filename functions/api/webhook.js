// Cloudflare Pages Function – Webhook des Zahlungsanbieters.
// Erreichbar unter /api/webhook (identisch zur Vercel-Variante).
//
// Benötigte Umgebungsvariablen:
//   PAYMENT_PROVIDER=unzer|paypercut|stripe
//   UNZER_PRIVATE_KEY=s-priv-... | p-priv-...
//   PAYPERCUT_WEBHOOK_SECRET=whsec_...   oder   STRIPE_WEBHOOK_SECRET=whsec_...
//
// Signaturprüfung: Stripe-Schema (t=...,v1=...) bzw. einfache HMAC-SHA256-Prüfung
// über den Roh-Body. Ohne konfiguriertes Secret wird nur geparst (nicht für Produktion).
//
// Unzer signiert Webhooks nicht. Die Absicherung erfolgt zweistufig:
//   1. Unzer-IPs in Cloudflare allowlisten.
//   2. Die Zahlung wird über die in der Nutzlast enthaltene `retrieveUrl`
//      serverseitig mit dem privaten Schlüssel nachgeladen und geprüft.
import { findService } from './_prices.js';
import { unzerPaymentState } from './_payments.js';

const encoder = new TextEncoder();

function toHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

async function hmacHex(secret, payload) {
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return toHex(signature);
}

async function verify(rawBody, signatureHeader, secret) {
    if (!secret) {
        // Ohne Secret nur parsen – nicht für den Produktivbetrieb geeignet.
        return { ok: true, event: JSON.parse(rawBody || '{}') };
    }
    if (!signatureHeader) {
        return { ok: false };
    }

    // Stripe-Schema: "t=123,v1=abc" – signiert wird "<t>.<payload>".
    const parts = {};
    signatureHeader.split(',').forEach((pair) => {
        const [k, v] = pair.split('=');
        if (k && v) parts[k.trim()] = v.trim();
    });

    if (parts.t && parts.v1) {
        const expected = await hmacHex(secret, `${parts.t}.${rawBody}`);
        if (!timingSafeEqual(expected, parts.v1)) {
            return { ok: false };
        }
    } else {
        // Generisches Schema: Signatur ist der letzte Wert des Headers.
        const provided = signatureHeader.split(',').pop().trim();
        const expected = await hmacHex(secret, rawBody);
        if (!timingSafeEqual(expected, provided)) {
            return { ok: false };
        }
    }
    return { ok: true, event: JSON.parse(rawBody || '{}') };
}

// Unzer-Webhooks sind nicht signiert. Wir laden die Zahlung über die
// mitgelieferte `retrieveUrl` nach (privater Schlüssel) und vertrauen nur dem
// Ergebnis dieses Aufrufs, nicht dem Request-Body selbst.
async function handleUnzer(rawBody, env) {
    let payload = {};
    try {
        payload = JSON.parse(rawBody || '{}');
    } catch (e) {
        return new Response('Webhook Error: Ungültige Nutzlast', { status: 400 });
    }

    const retrieveUrl = payload.retrieveUrl;
    if (!retrieveUrl || !/^https:\/\/(sbx-)?api\.unzer\.com\//.test(retrieveUrl)) {
        return new Response('Webhook Error: Ungültige retrieveUrl', { status: 400 });
    }

    const response = await fetch(retrieveUrl, {
        headers: { Authorization: 'Basic ' + btoa(`${env.UNZER_PRIVATE_KEY}:`) }
    });
    if (!response.ok) {
        return new Response('Webhook Error: Zahlung konnte nicht geladen werden', { status: 502 });
    }
    const payment = await response.json();
    const transaction = (payment.transactions || [])[0] || {};
    const status = unzerPaymentState(transaction.status, payment.state?.name);

    console.log(
        `[webhook] Unzer ${payload.event || ''} paymentId=${payload.paymentId || ''} status=${status}`
    );

    return new Response(JSON.stringify({ received: true, status }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const provider = (env.PAYMENT_PROVIDER || 'paypercut').toLowerCase();
    const rawBody = await request.text();

    if (provider === 'unzer') {
        try {
            return await handleUnzer(rawBody, env);
        } catch (error) {
            return new Response(`Webhook Error: ${error.message}`, { status: 400 });
        }
    }

    const secret =
        provider === 'stripe' ? env.STRIPE_WEBHOOK_SECRET : env.PAYPERCUT_WEBHOOK_SECRET;
    const signature =
        request.headers.get('stripe-signature') ||
        request.headers.get('paypercut-signature') ||
        '';

    let result;
    try {
        result = await verify(rawBody, signature, secret);
    } catch (error) {
        return new Response(`Webhook Error: ${error.message}`, { status: 400 });
    }

    if (!result.ok) {
        return new Response('Webhook Error: Ungültige Signatur', { status: 400 });
    }

    const event = result.event || {};
    const service = event.data && event.data.object && event.data.object.metadata
        ? findService(event.data.object.metadata.service)
        : null;
    console.log('[webhook] Ereignis erhalten:', event.type || '(ohne Typ)', service ? service.name : '');

    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
}

export async function onRequestGet() {
    return new Response(JSON.stringify({ message: 'Methode nicht erlaubt.' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
}
