// Cloudflare Pages Function – Webhook des Zahlungsanbieters.
// Erreichbar unter /api/webhook (identisch zur Vercel-Variante).
//
// Benötigte Umgebungsvariablen:
//   PAYMENT_PROVIDER=paypercut|stripe
//   PAYPERCUT_WEBHOOK_SECRET=whsec_...   oder   STRIPE_WEBHOOK_SECRET=whsec_...
//
// Signaturprüfung: Stripe-Schema (t=...,v1=...) bzw. einfache HMAC-SHA256-Prüfung
// über den Roh-Body. Ohne konfiguriertes Secret wird nur geparst (nicht für Produktion).
import { findService } from './_prices.js';

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

export async function onRequestPost(context) {
    const { request, env } = context;
    const provider = (env.PAYMENT_PROVIDER || 'paypercut').toLowerCase();
    const secret =
        provider === 'stripe' ? env.STRIPE_WEBHOOK_SECRET : env.PAYPERCUT_WEBHOOK_SECRET;
    const signature =
        request.headers.get('stripe-signature') ||
        request.headers.get('paypercut-signature') ||
        '';

    const rawBody = await request.text();

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
