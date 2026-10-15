// Cloudflare Pages endpoint for the digital handbook.
// Shopify Digital Downloads delivers the PDF after payment.
import { findProduct } from './_products.js';
import { createShopifyCheckout } from './_shopify.js';

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

export async function onRequestPost({ request, env }) {
    let data;
    try {
        data = await request.json();
    } catch {
        return json({ message: 'Ungültige Anfrage.' }, 400);
    }

    const product = findProduct(data.slug);
    if (!product?.shopifyVariantId) {
        return json({ message: 'Unbekanntes Produkt.' }, 400);
    }

    try {
        return json({ url: createShopifyCheckout(env, product.shopifyVariantId) });
    } catch {
        return json({ message: 'Der Shopify Checkout konnte nicht gestartet werden.' }, 502);
    }
}

export async function onRequestGet() {
    return json({ message: 'Methode nicht erlaubt.' }, 405);
}
