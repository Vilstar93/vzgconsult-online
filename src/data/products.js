// Digitale Produkte (Sofort-Download). Single source of truth für Website
// (scripts/render-pug.js) und Checkout-Funktionen (functions/api/_products.js).
// `amountCents` ist der Endpreis in Cent inkl. 19 % USt. (Verbraucherpreis).
module.exports = [
    {
        slug: 'energie-ratgeber',
        name: 'Energie-Ratgeber: Weniger zahlen für Strom & Gas',
        shortName: 'Energie-Ratgeber',
        price: '199 €',
        amountCents: 19900,
        pages: 14,
        language: 'Bulgarisch (PDF)',
        description:
            'Der praktische Leitfaden für bulgarische Haushalte in Deutschland: Rechnungen lesen, Tarife vergleichen, Vertragsfallen erkennen und die monatlichen Energiekosten Schritt für Schritt senken.',
        highlights: [
            'Rechnung verstehen: Grundpreis, Arbeitspreis, Verbrauch und Abschläge',
            'Tarife richtig vergleichen – mit dem eigenen Verbrauch statt Schätzwerte',
            'Vertrags-Checkliste vor dem Abschluss (Laufzeit, Kündigungsfrist, Auto-Verlängerung)',
            'Boni und Fallen erkennen: Neukundenbonus, Sofortbonus, Vorkasse',
            'Strom im Haushalt: wo Energie verloren geht und wie man sie spart',
            'Sofort als PDF-Download nach der Zahlung'
        ],
        chapters: [
            { number: '01', title: 'Wie du deine Rechnung liest' },
            { number: '02', title: 'Wie du Tarife vergleichst' },
            { number: '03', title: 'Der Vertrag: worauf du prüfen musst' },
            { number: '04', title: 'Boni und Fallen' },
            { number: '05', title: 'Strom im Haushalt: Verbrauch und Sparen' }
        ]
    }
];
