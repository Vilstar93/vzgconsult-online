// Shopify cart permalinks open the hosted checkout without an API token.
// The shop domain is public; SHOPIFY_STORE_DOMAIN can override it in Pages.
export function createShopifyCheckout(env, variantId, properties = {}) {
    const domain = String(env.SHOPIFY_STORE_DOMAIN || 'd1zknc-qa.myshopify.com')
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/$/, '');
    if (!/^[a-z0-9.-]+$/i.test(domain) || !/^\d+$/.test(String(variantId))) {
        throw new Error('Shopify ist nicht konfiguriert.');
    }

    const url = new URL(`https://${domain}/cart/${variantId}:1`);
    const filledProperties = Object.fromEntries(
        Object.entries(properties)
            .map(([key, value]) => [String(key).slice(0, 255), String(value || '').trim().slice(0, 500)])
            .filter(([key, value]) => key && value)
    );
    if (Object.keys(filledProperties).length) {
        const bytes = new TextEncoder().encode(JSON.stringify(filledProperties));
        const encoded = btoa(String.fromCharCode(...bytes))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        url.searchParams.set('properties', encoded);
    }
    return url.toString();
}
