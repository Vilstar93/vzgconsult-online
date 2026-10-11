// Price list for paid services. Edit here – it feeds the pricing page via the
// build (see scripts/build-pug.js) and the booking form via data-service names.
// Prices are net prices in EUR (zzgl. 19 % USt.).
module.exports = [
    {
        name: 'Erstberatung Energie',
        price: '49 €',
        duration: 'ca. 30 Minuten, telefonisch',
        description:
            'Erste Einschätzung Ihrer Energiekosten und Ihrer Einsparmöglichkeiten – unverbindlich und schnell.',
        features: ['Kurze Verbrauchsanalyse', 'Erste Tarifeinschätzung', 'Ansprechpartner für Rückfragen']
    },
    {
        name: 'Tarif-Check & Optimierung',
        price: '99 €',
        duration: 'ca. 60 Minuten',
        description:
            'Wir prüfen Ihren Strom-, Gas- oder Wärmevertrag, vergleichen Tarife und zeigen konkretes Sparpotenzial auf.',
        features: ['Vergleich passender Tarife', 'Prüfung des bestehenden Vertrags', 'Konkrete Empfehlung zum Wechsel'],
        featured: true
    },
    {
        name: 'Wechsel-Service',
        price: '149 €',
        duration: 'bis zum Abschluss des Wechsels',
        description:
            'Wir übernehmen den kompletten Wechsel: Anmeldung, Kündigung des Altvertrags und Nachverfolgung bis zur Bestätigung.',
        features: ['Kündigung und Anmeldung', 'Nachverfolgung bis zur Bestätigung', 'Unterstützung bei Rückfragen']
    },
    {
        name: 'Vor-Ort-Energieberatung',
        price: '249 €',
        duration: 'ca. 60 – 90 Minuten vor Ort',
        description:
            'Beratung direkt bei Ihnen zu Hause oder im Betrieb – mit Blick auf Verbrauch, Technik und Einsparpotenziale.',
        features: ['Termin in Wallerfangen und Umgebung', 'Verbrauchs- und Technikcheck', 'Schriftliche Zusammenfassung']
    },
    {
        name: 'Kundenbetreuung & Callcenter-Service',
        price: '39 € / Std.',
        duration: 'monatlich oder auf Abruf',
        description:
            'Für Energieversorger und Unternehmen: professionelle Betreuung Ihrer Kunden per Telefon, E-Mail und Chat.',
        features: ['Inbound- und Outbound-Anrufe', 'Beschwerde- und Reklamationsbearbeitung', 'Rechnungskorrekturen']
    },
    {
        name: 'Business-Paket',
        price: '599 € / Monat',
        duration: 'fortlaufend, monatlich kündbar',
        description:
            'Rundum-Betreuung für Unternehmen: Energie-Optimierung, Kundenbindung, Marketing und Service inklusive.',
        features: ['Monatlicher Tarif- und Verbrauchscheck', 'Service-Level-Vereinbarung', 'Reporting und persönlicher Ansprechpartner']
    }
];
