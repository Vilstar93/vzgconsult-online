'use strict';

const PRICES = require('../src/data/prices.js');
const { createShopifyCheckout } = require('./_shopify.js');

function findService(name) {
    return PRICES.find((item) => item.name === name);
}

module.exports = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Methode nicht erlaubt.' });
    }

    try {
        const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

        const service = findService(data.service);
        if (!service || !service.shopifyVariantId) {
            return res.status(400).json({ message: 'Unbekannte Leistung.' });
        }

        let properties = [
            { key: 'Wunschdatum', value: data.date },
            { key: 'Uhrzeit', value: data.time }
        ];
        if (service.name === 'Erstberatung Energie') {
            const startAt = new Date(data.startAt);
            if (!Number.isFinite(startAt.getTime()) || startAt.getTime() < Date.now() + 2 * 60 * 60 * 1000) {
                return res.status(400).json({ message: 'Bitte wählen Sie einen Termin mindestens zwei Stunden im Voraus.' });
            }
            properties = [
                { key: 'Termin (Deutschland)', value: new Intl.DateTimeFormat('de-DE', {
                    timeZone: 'Europe/Berlin', dateStyle: 'full', timeStyle: 'short'
                }).format(startAt) },
                { key: 'Dauer', value: '15 Minuten' }
            ];
        }

        const url = await createShopifyCheckout({
            variantId: service.shopifyVariantId,
            properties
        });

        return res.json({ url });
    } catch (error) {
        console.error('[shopify-checkout]', error.message);
        return res.status(502).json({
            message: 'Der Shopify Checkout konnte nicht gestartet werden. Bitte versuchen Sie es erneut.'
        });
    }
};
