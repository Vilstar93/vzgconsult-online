'use strict';

function shopifyStoreDomain() {
    const domain = (process.env.SHOPIFY_STORE_DOMAIN || '')
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/$/, '');

    if (!/^[a-z0-9.-]+$/i.test(domain)) {
        throw new Error('Shopify Store-Domain ist nicht konfiguriert.');
    }

    return domain;
}

function numericVariantId(value) {
    const match = String(value || '').match(/(?:gid:\/\/shopify\/ProductVariant\/)?(\d+)$/);
    if (!match) {
        throw new Error('Ungültige Shopify-Variante.');
    }
    return match[1];
}

function clean(value, maxLength) {
    return String(value || '').trim().slice(0, maxLength);
}

function createShopifyCheckout(options) {
    const domain = shopifyStoreDomain();
    const variantId = numericVariantId(options.variantId);
    const quantity = Number.isInteger(options.quantity) && options.quantity > 0 ? options.quantity : 1;
    const url = new URL(`https://${domain}/cart/${variantId}:${quantity}`);

    const properties = Object.fromEntries(
        (options.properties || [])
            .map((property) => [clean(property.key, 255), clean(property.value, 500)])
            .filter(([key, value]) => key && value)
    );

    if (Object.keys(properties).length) {
        url.searchParams.set(
            'properties',
            Buffer.from(JSON.stringify(properties), 'utf8').toString('base64url')
        );
    }

    return url.toString();
}

module.exports = { createShopifyCheckout };
