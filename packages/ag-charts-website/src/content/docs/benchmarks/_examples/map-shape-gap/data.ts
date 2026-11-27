export const eastern = [
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Indiana',
    'Kentucky',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'New Hampshire',
    'New Jersey',
    'New York',
    'North Carolina',
    'Ohio',
    'Pennsylvania',
    'Rhode Island',
    'South Carolina',
    'Vermont',
    'Virginia',
    'West Virginia',
].map((name) => ({ name }));

export const central = [
    'Alabama',
    'Arkansas',
    'Illinois',
    'Iowa',
    'Kansas',
    'Louisiana',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Nebraska',
    'North Dakota',
    'Oklahoma',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Wisconsin',
].map((name) => ({ name }));

export const mountain = ['Arizona', 'Colorado', 'Idaho', 'Montana', 'New Mexico', 'Utah', 'Wyoming'].map((name) => ({
    name,
}));

export const pacific = ['California', 'Washington', 'Nevada', 'Oregon'].map((name) => ({ name }));

/** Cells per side of the synthetic grid: 150 x 150 = 22,500 regions sharing 2 x 150 x 149 = 44,700 edges. */
export const GRID_SIZE = 150;
const CELL_DEGREES = 0.5;

/**
 * A square grid of regions, every one touching its neighbours along a full edge: the dense-topology stress case for
 * `gap`, where nearly every edge of every region is shared.
 */
export function getGridTopology() {
    const origin = (-GRID_SIZE * CELL_DEGREES) / 2;
    const features = [];
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const x0 = origin + col * CELL_DEGREES;
            const y0 = origin + row * CELL_DEGREES;
            const x1 = x0 + CELL_DEGREES;
            const y1 = y0 + CELL_DEGREES;
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [x0, y0],
                            [x1, y0],
                            [x1, y1],
                            [x0, y1],
                            [x0, y0],
                        ],
                    ],
                },
                properties: { name: `cell-${row}-${col}` },
            });
        }
    }
    return { type: 'FeatureCollection', features };
}

export function getGridData() {
    return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
        name: `cell-${Math.floor(i / GRID_SIZE)}-${i % GRID_SIZE}`,
    }));
}
