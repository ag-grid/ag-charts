const icon = '${baseWWWUrl}/example-assets/docs-images/ag-charts-logo.png';

export function getData() {
    return [
        {
            instrument: 'Guitar',
            popularity: 98,
            musicians_millions: 50,
            icon,
            year_of_invention: 1500,
            difficulty: 4,
        },
        {
            instrument: 'Piano',
            popularity: 96,
            musicians_millions: 35,
            icon,
            year_of_invention: 1700,
            difficulty: 5,
        },
        {
            instrument: 'Drums',
            popularity: 94,
            musicians_millions: 30,
            icon,
            year_of_invention: -5000, // earliest percussion, prehistoric
            difficulty: 3,
        },
        {
            instrument: 'Saxophone',
            popularity: 83,
            musicians_millions: 7,
            icon,
            year_of_invention: 1846,
            difficulty: 5,
        },
        {
            instrument: 'Accordion',
            popularity: 65,
            musicians_millions: 5,
            icon,
            year_of_invention: 1822,
            difficulty: 6,
        },
        {
            instrument: 'Tabla',
            popularity: 54,
            musicians_millions: 2.8,
            icon,
            year_of_invention: 1700,
            difficulty: 7,
        },
        {
            instrument: 'Pan Flute',
            popularity: 48,
            musicians_millions: 1.1,
            icon,
            year_of_invention: -600, // used in ancient Greece, Peru, China
            difficulty: 4,
        },
        {
            instrument: 'Erhu',
            popularity: 22,
            musicians_millions: 1.2,
            icon,
            year_of_invention: 600,
            difficulty: 6,
        },
        {
            instrument: 'Theremin',
            popularity: 2,
            musicians_millions: 0.1,
            icon,
            year_of_invention: 1920,
            difficulty: 9,
        },
        {
            instrument: 'Glass Harmonica',
            popularity: 1,
            musicians_millions: 0.01,
            icon,
            year_of_invention: 1761,
            difficulty: 8,
        },
    ];
}
