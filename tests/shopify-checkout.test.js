'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createShopifyCheckout } = require('../api/_shopify.js');

test('Vercel permalink goes directly to Shopify checkout', () => {
    process.env.SHOPIFY_STORE_DOMAIN = 'd1zknc-qa.myshopify.com';
    const url = new URL(createShopifyCheckout({
        variantId: 'gid://shopify/ProductVariant/59905305018713'
    }));
    assert.equal(url.pathname, '/cart/59905305018713:1');
    assert.equal(url.searchParams.has('checkout'), false);
});

test('Cloudflare handbook and service endpoints return Shopify checkout links', async () => {
    const { onRequestPost: buyHandbook } = await import('../functions/api/buy-handbook.js');
    const { onRequestPost: bookService } = await import('../functions/api/create-checkout-session.js');
    const env = {};
    const handbookResponse = await buyHandbook({
        env,
        request: new Request('https://vzgconsult.online/api/buy-handbook', {
            method: 'POST',
            body: JSON.stringify({ slug: 'energie-ratgeber' })
        })
    });
    assert.equal(handbookResponse.status, 200);
    const handbookUrl = new URL((await handbookResponse.json()).url);
    assert.equal(handbookUrl.pathname, '/cart/59905305018713:1');
    assert.equal(handbookUrl.searchParams.has('checkout'), false);

    const serviceResponse = await bookService({
        env,
        request: new Request('https://vzgconsult.online/api/create-checkout-session', {
            method: 'POST',
            body: JSON.stringify({
                service: 'Erstberatung Energie',
                date: '2026-10-20',
                time: '10:00'
            })
        })
    });
    assert.equal(serviceResponse.status, 200);
    const serviceUrl = new URL((await serviceResponse.json()).url);
    assert.equal(serviceUrl.pathname, '/cart/59909091918169:1');
    assert.equal(serviceUrl.searchParams.has('checkout'), false);
    const properties = JSON.parse(Buffer.from(serviceUrl.searchParams.get('properties'), 'base64url').toString());
    assert.deepEqual(properties, { Wunschdatum: '2026-10-20', Uhrzeit: '10:00' });
});
