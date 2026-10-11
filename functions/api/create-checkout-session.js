// Cloudflare Pages Function – Checkout-Session erzeugen.
// Erreichbar unter /api/create-checkout-session (identisch zur Vercel-Variante,
// damit das Buchungsformular unverändert bleibt).
//
// Benötigte Umgebungsvariablen (Cloudflare Pages → Settings → Variables):
//   PAYMENT_PROVIDER=unzer|paypercut|stripe
//   UNZER_PRIVATE_KEY=s-priv-... | p-priv-...
//   PAYPERCUT_SECRET_KEY=sk_...      PAYPERCUT_WEBHOOK_SECRET=whsec_...
//   STRIPE_SECRET_KEY=sk_...         STRIPE_WEBHOOK_SECRET=whsec_...
//   PUBLIC_BASE_URL=https://ihre-domain.de
import { findService } from './_prices.js';
import { createCheckout, providerFor } from './_payments.js';

function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
}

// Redirects must land on the host the customer is actually using, so the
// request origin wins. PUBLIC_BASE_URL is only a fallback (e.g. for webhooks).
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

async function createStripeSession(data, base, env) {
    const service = findService(data.service);
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', `${base}/termin.html?status=success`);
    params.set('cancel_url', `${base}/termin.html?status=cancel`);
    if (data.email) params.set('customer_email', data.email);
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'eur');
    params.set('line_items[0][price_data][product_data][name]', service.name);
    params.set('line_items[0][price_data][unit_amount]', String(service.amountCents));
    params.set('metadata[service]', service.name);
    params.set('metadata[date]', data.date || '');
    params.set('metadata[time]', data.time || '');

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error((result.error && result.error.message) || 'Stripe-Fehler.');
    }
    return result.url;
}

export async function onRequestPost(context) {
    const { request, env } = context;
    let data = {};
    try {
        data = await request.json();
    } catch (e) {
        data = {};
    }

    if (data.payNow === false) {
        return json({
            message:
                'Ihre Buchungsanfrage ist eingegangen. Wir senden Ihnen eine Bestätigung und die Rechnung per E-Mail.'
        });
    }

    const service = findService(data.service);
    if (!service) {
        return json({ message: 'Unbekannte Leistung.' }, 400);
    }

    const provider = providerFor(env);
    const base = baseUrl(request, env);
    const reference = `buchung-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    try {
        let url;
        if (provider === 'stripe') {
            if (!env.STRIPE_SECRET_KEY) {
                return json({ message: 'Stripe ist nicht konfiguriert.' }, 500);
            }
            url = await createStripeSession(data, base, env);
        } else if (provider === 'unzer' || provider === 'paypercut') {
            const checkout = await createCheckout(
                {
                    amountCents: service.amountCents,
                    itemName: service.name,
                    reference,
                    email: data.email,
                    successUrl: `${base}/termin.html?status=success`,
                    cancelUrl: `${base}/termin.html?status=cancel`,
                    metadata: {
                        service: service.name,
                        date: data.date || '',
                        time: data.time || '',
                        name: data.name || '',
                        phone: data.phone || ''
                    }
                },
                env
            );
            url = checkout.url;
        } else {
            return json({ message: 'Zahlung ist nicht konfiguriert.' }, 500);
        }
        if (!url) {
            return json({ message: 'Keine Checkout-Adresse erhalten.' }, 502);
        }
        return json({ url });
    } catch (error) {
        return json({ message: error.message || 'Zahlung konnte nicht erstellt werden.' }, 400);
    }
}

export async function onRequestGet() {
    return json({ message: 'Methode nicht erlaubt.' }, 405);
}
