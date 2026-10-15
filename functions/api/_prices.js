// Leistungen und Netto-Preise (in Cent) für den Cloudflare-Pages-Checkout.
// Muss mit src/data/prices.js übereinstimmen (dort die Anzeige-Preise der Website).
export const PRICES = [
    { name: 'Erstberatung Energie', amountCents: 4900, shopifyVariantId: '59909091918169' },
    { name: 'Tarif-Check & Optimierung', amountCents: 9900, shopifyVariantId: '59909092540761' },
    { name: 'Wechsel-Service', amountCents: 14900, shopifyVariantId: '59909097488729' },
    { name: 'Vor-Ort-Energieberatung', amountCents: 24900, shopifyVariantId: '59909108924761' },
    { name: 'Kundenbetreuung & Callcenter-Service', amountCents: 3900, shopifyVariantId: '59909102862681' },
    { name: 'Business-Paket', amountCents: 59900, shopifyVariantId: '59909104304473' }
];

export function findService(name) {
    return PRICES.find((item) => item.name === name);
}
