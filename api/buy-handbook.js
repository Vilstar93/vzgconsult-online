'use strict';

const PRODUCTS = require('../src/data/products.js');
const { createShopifyCheckout } = require('./_shopify.js');

function findProduct(slug) {
    return PRODUCTS.find((item) => item.slug === slug);
}

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Methode nicht erlaubt.' });
    }

    try {
        const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
        const product = findProduct(data.slug);

        if (!product || !product.shopifyVariantId) {
            return res.status(400).json({ message: 'Unbekanntes Produkt.' });
        }

        const url = await createShopifyCheckout({
            variantId: product.shopifyVariantId,
            attributes: [{ key: 'Produktart', value: 'Digitaler Download' }]
        });

        return res.json({ url });
    } catch (error) {
        console.error('[shopify-handbook-checkout]', error.message);
        return res.status(502).json({
            message: 'Der Shopify Checkout konnte nicht gestartet werden. Bitte versuchen Sie es erneut.'
        });
    }
};
