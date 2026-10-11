// Leistungen und Netto-Preise (in Cent) für den Cloudflare-Pages-Checkout.
// Muss mit src/data/prices.js übereinstimmen (dort die Anzeige-Preise der Website).
export const PRICES = [
    { name: 'Erstberatung Energie', amountCents: 4900 },
    { name: 'Tarif-Check & Optimierung', amountCents: 9900 },
    { name: 'Wechsel-Service', amountCents: 14900 },
    { name: 'Vor-Ort-Energieberatung', amountCents: 24900 },
    { name: 'Kundenbetreuung & Callcenter-Service', amountCents: 3900 },
    { name: 'Business-Paket', amountCents: 59900 }
];

export function findService(name) {
    return PRICES.find((item) => item.name === name);
}
