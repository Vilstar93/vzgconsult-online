// Cloudflare Pages Function – Kauf eines digitalen Produkts (Sofort-Download).
// Erreichbar unter /api/buy-handbook.
//
// Ablauf:
//   1. Produkt prüfen und eine eindeutige Bestell-ID erzeugen.
//   2. Bestellung in KV (Binding ORDERS) als "pending" ablegen.
//   3. Paypercut-Checkout erzeugen; success_url enthält die Bestell-ID.
//   4. Nach der Zahlung prüft /api/download die Zahlung und liefert das PDF.
//
// Benötigte Umgebungsvariablen:
//   PAYMENT_PROVIDER=paypercut
//   PAYPERCUT_SECRET_KEY=sk_...
//   PUBLIC_BASE_URL=https://vzgconsult.online
import { findProduct } from './_products.js';

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
}

function baseUrl(request, env) {
    if (env.PUBLIC_BASE_URL) {
        return env.PUBLIC_BASE_URL.replace(/\/$/, '');
    }
    return new URL(request.url).origin;
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
    if (!env.PAYPERCUT_SECRET_KEY) {
        return json({ message: 'Zahlung ist nicht konfiguriert.' }, 500);
    }

    const base = baseUrl(request, env);
    const token = orderId();

    const response = await fetch('https://api.paypercut.io/v1/checkouts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.PAYPERCUT_SECRET_KEY}`
        },
        body: JSON.stringify({
            currency: 'EUR',
            mode: 'payment',
            ui_mode: 'hosted',
            success_url: `${base}/download.html?order=${token}`,
            cancel_url: `${base}/ratgeber.html`,
            customer_email: data.email || undefined,
            client_reference_id: token,
            metadata: { order: token, slug: product.slug },
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: 'EUR',
                        unit_amount: product.amountCents,
                        product_data: { name: product.name }
                    }
                }
            ]
        })
    });

    const result = await response.json();
    if (!response.ok) {
        return json({ message: result.message || 'Zahlung konnte nicht erstellt werden.' }, 400);
    }

    if (env.ORDERS) {
        await env.ORDERS.put(
            `order:${token}`,
            JSON.stringify({
                slug: product.slug,
                checkoutId: result.id,
                status: 'pending',
                createdAt: new Date().toISOString()
            }),
            { expirationTtl: 60 * 60 * 24 * 30 }
        );
    }

    const url = result.url || result.checkout_url;
    if (!url) {
        return json({ message: 'Keine Checkout-Adresse erhalten.' }, 502);
    }
    return json({ url });
}

export async function onRequestGet() {
    return json({ message: 'Methode nicht erlaubt.' }, 405);
}
