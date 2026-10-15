// Price list for paid services. Single source of truth for both the website
// build (scripts/render-pug.js) and the checkout server (server/server.js).
// `amountCents` is the net amount in euro cents (zzgl. 19 % USt.).
module.exports = [
    {
        name: 'Erstberatung Energie',
        shopifyVariantId: 'gid://shopify/ProductVariant/59909091918169',
        price: '19,99 €',
        amountCents: 1999,
        duration: '15 Minuten, telefonisch',
        description:
            'Erste Einschätzung Ihrer Energiekosten und Ihrer Einsparmöglichkeiten – unverbindlich und schnell.',
        features: ['Kurze Verbrauchsanalyse', 'Erste Tarifeinschätzung', 'Ansprechpartner für Rückfragen']
    },
    {
        name: 'Tarif-Check & Optimierung',
        shopifyVariantId: 'gid://shopify/ProductVariant/59909092540761',
        price: '99 €',
        amountCents: 9900,
        duration: 'ca. 60 Minuten',
        description:
            'Wir prüfen Ihren Strom-, Gas- oder Wärmevertrag, vergleichen Tarife und zeigen konkretes Sparpotenzial auf.',
        features: ['Vergleich passender Tarife', 'Prüfung des bestehenden Vertrags', 'Konkrete Empfehlung zum Wechsel'],
        featured: true
    },
    {
        name: 'Wechsel-Service',
        shopifyVariantId: 'gid://shopify/ProductVariant/59909097488729',
        price: '149 €',
        amountCents: 14900,
        duration: 'bis zum Abschluss des Wechsels',
        description:
            'Wir übernehmen den kompletten Wechsel: Anmeldung, Kündigung des Altvertrags und Nachverfolgung bis zur Bestätigung.',
        features: ['Kündigung und Anmeldung', 'Nachverfolgung bis zur Bestätigung', 'Unterstützung bei Rückfragen']
    },
    {
        name: 'Vor-Ort-Energieberatung',
        shopifyVariantId: 'gid://shopify/ProductVariant/59909108924761',
        price: '249 €',
        amountCents: 24900,
        duration: 'ca. 60 – 90 Minuten vor Ort',
        description:
            'Beratung direkt bei Ihnen zu Hause oder im Betrieb – mit Blick auf Verbrauch, Technik und Einsparpotenziale.',
        features: ['Termin in Wallerfangen und Umgebung', 'Verbrauchs- und Technikcheck', 'Schriftliche Zusammenfassung']
    },
    {
        name: 'Kundenbetreuung & Callcenter-Service',
        shopifyVariantId: 'gid://shopify/ProductVariant/59909102862681',
        price: '39 € / Std.',
        amountCents: 3900,
        duration: 'monatlich oder auf Abruf',
        description:
            'Für Energieversorger und Unternehmen: professionelle Betreuung Ihrer Kunden per Telefon, E-Mail und Chat.',
        features: ['Inbound- und Outbound-Anrufe', 'Beschwerde- und Reklamationsbearbeitung', 'Rechnungskorrekturen']
    },
    {
        name: 'Business-Paket',
        shopifyVariantId: 'gid://shopify/ProductVariant/59909104304473',
        price: '599 € / Monat',
        amountCents: 59900,
        duration: 'fortlaufend, monatlich kündbar',
        description:
            'Rundum-Betreuung für Unternehmen: Energie-Optimierung, Kundenbindung, Marketing und Service inklusive.',
        features: ['Monatlicher Tarif- und Verbrauchscheck', 'Service-Level-Vereinbarung', 'Reporting und persönlicher Ansprechpartner']
    }
];
