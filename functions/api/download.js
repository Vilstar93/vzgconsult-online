// Cloudflare Pages Function – Download eines digitalen Produkts.
// Erreichbar unter /api/download?order=<token>.
//
// Die Zahlung wird serverseitig beim Zahlungsanbieter geprüft (Unzer oder
// Paypercut, siehe Bestellung), erst danach wird die PDF-Datei aus KV
// (Binding ORDERS) ausgeliefert. Damit ist der Download nicht durch Raten
// erreichbar.
//
// Benötigte Umgebungsvariablen:
//   UNZER_PRIVATE_KEY=s-priv-... | p-priv-...
//   PAYPERCUT_SECRET_KEY=sk_...
// KV-Bindings:
//   ORDERS  → Bestellungen (order:<token>) und Dateien (file:<key>)
import { findProduct } from './_products.js';
import { verifyPayment } from './_payments.js';

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
}

async function handle(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const token = url.searchParams.get('order') || '';

    if (!/^[a-f0-9]{32}$/.test(token)) {
        return json({ message: 'Ungültiger Download-Link.' }, 400);
    }
    if (!env.ORDERS) {
        return json({ message: 'Downloads sind nicht konfiguriert.' }, 500);
    }

    const raw = await env.ORDERS.get(`order:${token}`);
    if (!raw) {
        return json({ message: 'Bestellung nicht gefunden.' }, 404);
    }

    let order;
    try {
        order = JSON.parse(raw);
    } catch (e) {
        return json({ message: 'Bestellung ist beschädigt.' }, 500);
    }

    const product = findProduct(order.slug);
    if (!product) {
        return json({ message: 'Produkt nicht gefunden.' }, 404);
    }

    // Zahlung serverseitig prüfen – nur bei bezahlter Bestellung ausliefern.
    let payment;
    try {
        payment = await verifyPayment(order.provider || 'paypercut', order.checkoutId, env);
    } catch (error) {
        return json({ message: 'Zahlung konnte nicht geprüft werden.' }, 502);
    }
    if (payment.status === 'failed') {
        return json({ message: 'Zahlung konnte nicht geprüft werden.' }, 502);
    }
    if (payment.status !== 'paid') {
        return json({ message: 'Die Zahlung ist noch nicht abgeschlossen.' }, 402);
    }

    if (order.status !== 'paid') {
        order.status = 'paid';
        order.paidAt = new Date().toISOString();
        if (payment.paymentId) {
            order.paymentId = payment.paymentId;
        }
        await env.ORDERS.put(`order:${token}`, JSON.stringify(order), {
            expirationTtl: 60 * 60 * 24 * 30
        });
    }

    const file = await env.ORDERS.get(`file:${product.fileKey}`, 'arrayBuffer');
    if (!file) {
        return json({ message: 'Datei ist nicht verfügbar.' }, 404);
    }

    return new Response(file, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${product.fileKey}"`,
            'Cache-Control': 'private, no-store'
        }
    });
}

export async function onRequestGet(context) {
    return handle(context);
}

export async function onRequestHead(context) {
    const response = await handle(context);
    return new Response(null, { status: response.status, headers: response.headers });
}

export async function onRequestPost() {
    return json({ message: 'Methode nicht erlaubt.' }, 405);
}
