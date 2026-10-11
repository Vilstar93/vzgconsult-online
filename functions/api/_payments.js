// Zahlungsanbieter-Abstraktion für die Cloudflare-Pages-Funktionen.
//
// Unterstützt Unzer (Hosted Payment Page v2) und Paypercut. Die Auswahl erfolgt
// über PAYMENT_PROVIDER; fehlt sie, wird der Anbieter anhand der vorhandenen
// Zugangsdaten erraten.
//
// Unzer (HPP v2):
//   1. Access-Token holen (HTTP Basic mit dem privaten Schlüssel).
//   2. Payment Page erstellen -> paypageId + redirectUrl.
//   3. Kunde wird auf redirectUrl umgeleitet.
//   4. Nach der Rückkehr wird die Zahlung über die paypageId geprüft.
//
// Benötigte Umgebungsvariablen:
//   PAYMENT_PROVIDER=unzer|paypercut
//   UNZER_PRIVATE_KEY=s-priv-... (Test) oder p-priv-... (Live)
//   PAYPERCUT_SECRET_KEY=sk_...
//
// `mode` ist entweder 'charge' (sofort abbuchen) oder 'authorize' (reservieren).

const UNZER_TOKEN_URL = 'https://token.upcgw.com/v1/auth/token';
const UNZER_TOKEN_TEST_URL = 'https://token.test.upcgw.com/v1/auth/token';
const UNZER_PAYPAGE_URL = 'https://paypage.unzer.com/v2/merchant/paypage';
const UNZER_PAYPAGE_TEST_URL = 'https://paypage.test.unzer.com/v2/merchant/paypage';
const UNZER_API_URL = 'https://api.unzer.com/v1';
const UNZER_API_TEST_URL = 'https://sbx-api.unzer.com/v1';

export function providerFor(env) {
    if (env.PAYMENT_PROVIDER) {
        return env.PAYMENT_PROVIDER.toLowerCase();
    }
    if (env.UNZER_PRIVATE_KEY) {
        return 'unzer';
    }
    if (env.PAYPERCUT_SECRET_KEY) {
        return 'paypercut';
    }
    return '';
}

export function isUnzerTest(env) {
    return /^s-priv-/.test(env.UNZER_PRIVATE_KEY || '');
}

function basicAuth(key) {
    // Unzer erwartet "key:" als Benutzername bei leerem Passwort.
    return 'Basic ' + btoa(`${key}:`);
}

function unzerUrls(env) {
    return isUnzerTest(env)
        ? { token: UNZER_TOKEN_TEST_URL, paypage: UNZER_PAYPAGE_TEST_URL, api: UNZER_API_TEST_URL }
        : { token: UNZER_TOKEN_URL, paypage: UNZER_PAYPAGE_URL, api: UNZER_API_URL };
}

// Der Access-Token ist 7 Minuten gültig. Er wird pro Request geholt, damit kein
// abgelaufener Token wiederverwendet wird.
async function unzerAccessToken(env) {
    const urls = unzerUrls(env);
    const response = await fetch(urls.token, {
        method: 'POST',
        headers: { Authorization: basicAuth(env.UNZER_PRIVATE_KEY) }
    });
    const result = await response.json();
    if (!response.ok || !result.accessToken) {
        throw new Error(result?.errors?.[0]?.message || 'Unzer-Anmeldung fehlgeschlagen.');
    }
    return result.accessToken;
}

function unzerPaymentState(transactionStatus, paymentState) {
    if (transactionStatus === 'success') {
        return 'paid';
    }
    if (transactionStatus === 'pending' || paymentState === 'pending') {
        return 'pending';
    }
    return 'failed';
}

// Erzeugt eine Unzer-Hosted-Payment-Page. `order` enthält Produkt/Leistung,
// Betrag und die Rücksprung-URLs (bereits fertig aufgebaut).
export async function createUnzerCheckout(order, env) {
    const urls = unzerUrls(env);
    const token = await unzerAccessToken(env);

    const payload = {
        mode: order.mode || 'charge',
        type: 'hosted',
        checkoutType: 'payment_only',
        amount: (order.amountCents / 100).toFixed(4),
        currency: 'EUR',
        shopName: order.shopName || 'VZG Consult',
        orderId: order.reference,
        urls: {
            returnSuccess: order.successUrl,
            returnPending: order.successUrl,
            returnFailure: order.cancelUrl,
            returnCancel: order.cancelUrl
        },
        basket: {
            totalValueGross: order.amountCents / 100,
            currencyCode: 'EUR',
            orderId: order.reference,
            basketItems: [
                {
                    basketItemReferenceId: 'item-1',
                    quantity: 1,
                    vat: '19',
                    amountPerUnitGross: order.amountCents / 100,
                    amountDiscountPerUnitGross: 0,
                    title: order.itemName,
                    type: 'goods',
                    unit: 'Stk.'
                }
            ]
        },
        metadata: order.metadata || {}
    };
    if (order.email) {
        payload.customer = { email: order.email };
    }
    if (order.logoImage) {
        payload.style = { logoImage: order.logoImage };
    }

    const response = await fetch(urls.paypage, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(
            result?.errors?.[0]?.message || result?.message || 'Unzer-Zahlung fehlgeschlagen.'
        );
    }
    return { id: result.paypageId, url: result.redirectUrl };
}

// Prüft eine Unzer-Zahlung über die paypageId und liefert einen einheitlichen
// Status: 'paid' | 'pending' | 'failed'.
export async function verifyUnzerPayment(reference, env) {
    const urls = unzerUrls(env);
    const token = await unzerAccessToken(env);
    const response = await fetch(`${urls.paypage}/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok) {
        return { status: 'failed', raw: result };
    }
    const payments = result.payments || [];
    const paid = payments.find((item) => item.transactionStatus === 'success');
    if (paid) {
        return { status: 'paid', paymentId: paid.paymentId, raw: result };
    }
    const pending = payments.find(
        (item) => item.transactionStatus === 'pending' || item.paymentState === 'pending'
    );
    if (pending) {
        return { status: 'pending', paymentId: pending.paymentId, raw: result };
    }
    return {
        status: payments.length ? 'failed' : 'pending',
        paymentId: payments[0]?.paymentId,
        raw: result
    };
}

export async function createPaypercutCheckout(order, env) {
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
            success_url: order.successUrl,
            cancel_url: order.cancelUrl,
            customer_email: order.email || undefined,
            client_reference_id: order.reference,
            metadata: order.metadata || {},
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: 'EUR',
                        unit_amount: order.amountCents,
                        product_data: { name: order.itemName }
                    }
                }
            ]
        })
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Zahlung konnte nicht erstellt werden.');
    }
    const url = result.url || result.checkout_url;
    if (!url) {
        throw new Error('Keine Checkout-Adresse erhalten.');
    }
    return { id: result.id, url };
}

export async function verifyPaypercutPayment(reference, env) {
    const response = await fetch(
        `https://api.paypercut.io/v1/checkouts/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${env.PAYPERCUT_SECRET_KEY}` } }
    );
    const result = await response.json();
    if (!response.ok) {
        return { status: 'failed', raw: result };
    }
    const status =
        result.payment_status === 'paid'
            ? 'paid'
            : result.payment_status === 'unpaid'
              ? 'pending'
              : 'pending';
    return { status, paymentId: result.payment_intent, raw: result };
}

export async function createCheckout(order, env) {
    const provider = providerFor(env);
    if (provider === 'unzer') {
        return createUnzerCheckout(order, env);
    }
    if (provider === 'paypercut') {
        return createPaypercutCheckout(order, env);
    }
    throw new Error('Zahlung ist nicht konfiguriert.');
}

export async function verifyPayment(provider, reference, env) {
    if (provider === 'unzer') {
        return verifyUnzerPayment(reference, env);
    }
    if (provider === 'paypercut') {
        return verifyPaypercutPayment(reference, env);
    }
    return { status: 'failed' };
}

export { unzerPaymentState };
