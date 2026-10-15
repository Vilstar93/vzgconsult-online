// Cloudflare Pages endpoint for service bookings.
import { findService } from './_prices.js';
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

    const service = findService(data.service);
    if (!service?.shopifyVariantId) {
        return json({ message: 'Unbekannte Leistung.' }, 400);
    }

    let properties = { Wunschdatum: data.date, Uhrzeit: data.time };
    if (service.name === 'Erstberatung Energie') {
        const startAt = new Date(data.startAt);
        if (!Number.isFinite(startAt.getTime()) || startAt.getTime() < Date.now() + 2 * 60 * 60 * 1000) {
            return json({ message: 'Bitte wählen Sie einen Termin mindestens zwei Stunden im Voraus.' }, 400);
        }
        properties = {
            'Termin (Deutschland)': new Intl.DateTimeFormat('de-DE', {
                timeZone: 'Europe/Berlin', dateStyle: 'full', timeStyle: 'short'
            }).format(startAt),
            Dauer: '15 Minuten'
        };
    }

    try {
        const url = createShopifyCheckout(env, service.shopifyVariantId, properties);
        return json({ url });
    } catch {
        return json({ message: 'Der Shopify Checkout konnte nicht gestartet werden.' }, 502);
    }
}

export async function onRequestGet() {
    return json({ message: 'Methode nicht erlaubt.' }, 405);
}
