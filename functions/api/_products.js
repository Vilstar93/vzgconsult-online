// Digitale Produkte für die Cloudflare-Pages-Funktionen.
// Muss mit src/data/products.js übereinstimmen.
export const PRODUCTS = [
    {
        slug: 'energie-ratgeber',
        name: 'Energie-Ratgeber: Weniger zahlen für Strom & Gas',
        amountCents: 19900,
        shopifyVariantId: '59905305018713',
        fileKey: 'handbook-energie-ratgeber.pdf'
    }
];

export function findProduct(slug) {
    return PRODUCTS.find((item) => item.slug === slug);
}
