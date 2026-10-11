// Cloudflare Pages Function – Kauf eines digitalen Produkts (Sofort-Download).
// Erreichbar unter /api/buy-handbook.
//
// Ablauf:
//   1. Produkt prüfen und eine eindeutige Bestell-ID erzeugen.
//   2. Bestellung in KV (Binding ORDERS) als "pending" ablegen.
//   3. Checkout beim Zahlungsanbieter erzeugen (Unzer oder Paypercut);
//      die Rücksprung-URL enthält die Bestell-ID.
//   4. Nach der Zahlung prüft /api/download die Zahlung und liefert das PDF.
//
// Benötigte Umgebungsvariablen:
//   PAYMENT_PROVIDER=unzer|paypercut
//   UNZER_PRIVATE_KEY=s-priv-... | p-priv-...
//   PAYPERCUT_SECRET_KEY=sk_...
import { findProduct } from './_products.js';
import { createCheckout, providerFor } from './_payments.js';

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
}

// Redirects must land on the host the customer is actually using, so the
// request origin wins. PUBLIC_BASE_URL is only a fallback.
function baseUrl(request, env) {
    const origin = new URL(request.url).origin;
    if (origin && origin !== 'null') {
        return origin;
    }
    if (env.PUBLIC_BASE_URL) {
        return env.PUBLIC_BASE_URL.replace(/\/$/, '');
    }
    return origin;
}

function orderId() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function onRequestPost(context) {
    const { request, env } = context;

    let data = {};
    try {
        data = await request.json();
    } catch (e) {
        data = {};
    }

    const product = findProduct(data.slug);
    if (!product) {
        return json({ message: 'Unbekanntes Produkt.' }, 400);
    }
    if (!providerFor(env)) {
        return json({ message: 'Zahlung ist nicht konfiguriert.' }, 500);
    }

    const base = baseUrl(request, env);
    const token = orderId();

    let checkout;
    try {
        checkout = await createCheckout(
            {
                amountCents: product.amountCents,
                itemName: product.name,
                reference: token,
                email: data.email,
                successUrl: `${base}/download.html?order=${token}`,
                cancelUrl: `${base}/ratgeber.html`,
                metadata: { order: token, slug: product.slug }
            },
            env
        );
    } catch (error) {
        return json({ message: error.message || 'Zahlung konnte nicht erstellt werden.' }, 400);
    }

    if (env.ORDERS) {
        await env.ORDERS.put(
            `order:${token}`,
            JSON.stringify({
                slug: product.slug,
                provider: providerFor(env),
                checkoutId: checkout.id,
                status: 'pending',
                createdAt: new Date().toISOString()
            }),
            { expirationTtl: 60 * 60 * 24 * 30 }
        );
    }

    return json({ url: checkout.url });
}

export async function onRequestGet() {
    return json({ message: 'Methode nicht erlaubt.' }, 405);
}
