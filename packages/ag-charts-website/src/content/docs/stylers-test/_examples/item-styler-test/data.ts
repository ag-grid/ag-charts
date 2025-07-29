export interface TCartesianData {
    category: string;
    value1: number;
    value2: number;
    size: number;
    min: number;
    max: number;
}

export interface TWaterfallData {
    category: string;
    value: number;
    value2: number;
}

export interface TPieData {
    label: string;
    value: number;
    value2: number;
}

export interface TBoxPlotData {
    category: string;
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    min2: number;
    q1_2: number;
    median2: number;
    q3_2: number;
    max2: number;
}

export interface THeatmapData {
    x: string;
    y: string;
    value: number;
    value2: number;
}

export interface TFunnelData {
    category: string;
    value: number;
}

export interface TTreemapData {
    name: string;
    size?: number;
    children?: TTreemapData[];
}

export interface TSankeyLink {
    from: string;
    to: string;
    value: number;
}

export interface TOhlcData {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    open2: number;
    high2: number;
    low2: number;
    close2: number;
}

export interface TCandlestickData extends TOhlcData {}

export interface TPyramidData {
    category: string;
    value: number;
}

export interface TChordLink {
    from: string;
    to: string;
    value: number;
}

export interface TSunburstData {
    name: string;
    value?: number;
    children?: TSunburstData[];
}

export interface TMapData {
    name: string;
    value: number;
    value2: number;
}

export function getCartesianData(): TCartesianData[] {
    return [
        { category: 'A', value1: 30, value2: 45, size: 10, min: 20, max: 60 },
        { category: 'B', value1: 25, value2: 55, size: 20, min: 15, max: 65 },
        { category: 'C', value1: 40, value2: 35, size: 15, min: 25, max: 50 },
        { category: 'D', value1: 35, value2: 50, size: 25, min: 30, max: 70 },
    ];
}

export function getWaterfallData(): TWaterfallData[] {
    return [
        { category: 'Q1', value: 100, value2: 80 },
        { category: 'Q2', value: -30, value2: -25 },
        { category: 'Q3', value: 50, value2: 45 },
        { category: 'Q4', value: -20, value2: -15 },
    ];
}

export function getPieData(): TPieData[] {
    return [
        { label: 'A', value: 30, value2: 20 },
        { label: 'B', value: 25, value2: 15 },
        { label: 'C', value: 40, value2: 35 },
        { label: 'D', value: 35, value2: 30 },
    ];
}

export function getTreemapData(): TTreemapData {
    return {
        name: 'Root',
        children: [
            {
                name: 'A',
                size: 100,
                children: [
                    { name: 'A1', size: 30 },
                    { name: 'A2', size: 70 },
                ],
            },
            {
                name: 'B',
                size: 80,
                children: [
                    { name: 'B1', size: 50 },
                    { name: 'B2', size: 30 },
                ],
            },
        ],
    };
}

export function getBoxPlotData(): TBoxPlotData[] {
    return [
        {
            category: 'A',
            min: 10,
            q1: 15,
            median: 25,
            q3: 35,
            max: 40,
            min2: 8,
            q1_2: 12,
            median2: 22,
            q3_2: 32,
            max2: 38,
        },
        {
            category: 'B',
            min: 12,
            q1: 18,
            median: 28,
            q3: 38,
            max: 42,
            min2: 10,
            q1_2: 15,
            median2: 25,
            q3_2: 35,
            max2: 40,
        },
        {
            category: 'C',
            min: 8,
            q1: 14,
            median: 24,
            q3: 34,
            max: 39,
            min2: 6,
            q1_2: 11,
            median2: 21,
            q3_2: 31,
            max2: 37,
        },
        {
            category: 'D',
            min: 11,
            q1: 16,
            median: 26,
            q3: 36,
            max: 41,
            min2: 9,
            q1_2: 13,
            median2: 23,
            q3_2: 33,
            max2: 39,
        },
    ];
}

export function getHeatmapData(): THeatmapData[] {
    return [
        { x: 'A', y: 'X', value: 10, value2: 8 },
        { x: 'A', y: 'Y', value: 20, value2: 18 },
        { x: 'A', y: 'Z', value: 30, value2: 28 },
        { x: 'B', y: 'X', value: 15, value2: 13 },
        { x: 'B', y: 'Y', value: 25, value2: 23 },
        { x: 'B', y: 'Z', value: 35, value2: 33 },
        { x: 'C', y: 'X', value: 12, value2: 10 },
        { x: 'C', y: 'Y', value: 22, value2: 20 },
        { x: 'C', y: 'Z', value: 32, value2: 30 },
    ];
}

export function getFunnelData(): TFunnelData[] {
    return [
        { category: 'Visits', value: 1000 },
        { category: 'Signups', value: 750 },
        { category: 'Trials', value: 500 },
        { category: 'Purchases', value: 200 },
    ];
}

export function getSankeyData(): TSankeyLink[] {
    return [
        { from: 'A', to: 'C', value: 10 },
        { from: 'A', to: 'D', value: 15 },
        { from: 'B', to: 'C', value: 20 },
        { from: 'B', to: 'E', value: 25 },
        { from: 'C', to: 'E', value: 30 },
    ];
}

export function getOhlcData(): TOhlcData[] {
    return [
        {
            date: new Date('2023-01-01'),
            open: 100,
            high: 110,
            low: 95,
            close: 105,
            open2: 90,
            high2: 100,
            low2: 85,
            close2: 95,
        },
        {
            date: new Date('2023-02-01'),
            open: 105,
            high: 115,
            low: 100,
            close: 110,
            open2: 95,
            high2: 105,
            low2: 90,
            close2: 100,
        },
        {
            date: new Date('2023-03-01'),
            open: 110,
            high: 120,
            low: 105,
            close: 115,
            open2: 100,
            high2: 110,
            low2: 95,
            close2: 105,
        },
        {
            date: new Date('2023-04-01'),
            open: 115,
            high: 125,
            low: 110,
            close: 120,
            open2: 105,
            high2: 115,
            low2: 100,
            close2: 110,
        },
    ];
}

export function getCandlestickData(): TCandlestickData[] {
    return [
        {
            date: new Date('2023-01-01'),
            open: 100,
            high: 110,
            low: 95,
            close: 105,
            open2: 90,
            high2: 100,
            low2: 85,
            close2: 95,
        },
        {
            date: new Date('2023-02-01'),
            open: 105,
            high: 115,
            low: 100,
            close: 110,
            open2: 95,
            high2: 105,
            low2: 90,
            close2: 100,
        },
        {
            date: new Date('2023-03-01'),
            open: 110,
            high: 120,
            low: 105,
            close: 115,
            open2: 100,
            high2: 110,
            low2: 95,
            close2: 105,
        },
        {
            date: new Date('2023-04-01'),
            open: 115,
            high: 125,
            low: 110,
            close: 120,
            open2: 105,
            high2: 115,
            low2: 100,
            close2: 110,
        },
    ];
}

export function getPyramidData(): TPyramidData[] {
    return [
        { category: 'Stage 1', value: 100 },
        { category: 'Stage 2', value: 80 },
        { category: 'Stage 3', value: 60 },
        { category: 'Stage 4', value: 40 },
        { category: 'Stage 5', value: 20 },
    ];
}

export function getChordData(): TChordLink[] {
    return [
        { from: 'A', to: 'B', value: 10 },
        { from: 'A', to: 'C', value: 15 },
        { from: 'B', to: 'C', value: 20 },
        { from: 'B', to: 'D', value: 25 },
        { from: 'C', to: 'D', value: 30 },
        { from: 'D', to: 'A', value: 15 },
    ];
}

export function getSunburstData(): TSunburstData {
    return {
        name: 'Root',
        children: [
            {
                name: 'Category A',
                children: [
                    { name: 'A1', value: 30 },
                    { name: 'A2', value: 20 },
                    { name: 'A3', value: 10 },
                ],
            },
            {
                name: 'Category B',
                children: [
                    { name: 'B1', value: 25 },
                    { name: 'B2', value: 15 },
                ],
            },
            {
                name: 'Category C',
                value: 40,
            },
        ],
    };
}

export function getMapData(): TMapData[] {
    return [
        { name: 'Northland', value: 100, value2: 80 },
        { name: 'Eastland', value: 80, value2: 90 },
        { name: 'Southland', value: 90, value2: 70 },
        { name: 'Westland', value: 70, value2: 85 },
        { name: 'Island State', value: 60, value2: 95 },
    ];
}

export function getMapTopology() {
    return {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [-20, 45],
                            [-15, 40],
                            [-10, 42],
                            [-5, 38],
                            [0, 40],
                            [5, 45],
                            [0, 50],
                            [-10, 52],
                            [-15, 48],
                            [-20, 45],
                        ],
                    ],
                },
                properties: { name: 'Northland' },
                id: 'Northland',
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [10, 35],
                            [20, 30],
                            [30, 32],
                            [35, 38],
                            [32, 45],
                            [25, 48],
                            [18, 46],
                            [12, 42],
                            [10, 35],
                        ],
                    ],
                },
                properties: { name: 'Eastland' },
                id: 'Eastland',
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [-15, 20],
                            [-5, 18],
                            [5, 22],
                            [8, 28],
                            [5, 35],
                            [-5, 38],
                            [-12, 35],
                            [-18, 28],
                            [-15, 20],
                        ],
                    ],
                },
                properties: { name: 'Southland' },
                id: 'Southland',
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [15, 15],
                            [25, 12],
                            [35, 18],
                            [38, 25],
                            [35, 30],
                            [28, 28],
                            [20, 25],
                            [15, 20],
                            [15, 15],
                        ],
                    ],
                },
                properties: { name: 'Westland' },
                id: 'Westland',
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [45, 40],
                            [52, 38],
                            [58, 42],
                            [60, 48],
                            [58, 54],
                            [52, 56],
                            [46, 54],
                            [42, 48],
                            [45, 40],
                        ],
                    ],
                },
                properties: { name: 'Island State' },
                id: 'Island State',
            },
        ],
    };
}

export function getMapLineTopology() {
    return {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [-10, 45],
                        [10, 40],
                        [25, 38],
                        [50, 45],
                    ],
                },
                properties: { name: 'Trade Route North' },
                id: 'Trade Route North',
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [-10, 25],
                        [0, 28],
                        [15, 25],
                        [25, 22],
                    ],
                },
                properties: { name: 'Trade Route South' },
                id: 'Trade Route South',
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [0, 35],
                        [5, 30],
                        [10, 25],
                        [15, 20],
                    ],
                },
                properties: { name: 'Mountain Pass' },
                id: 'Mountain Pass',
            },
        ],
    };
}

export function getMapMarkerTopology() {
    return {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [-10, 46],
                },
                properties: { name: 'Northland' },
                id: 'Northland',
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [22, 40],
                },
                properties: { name: 'Eastland' },
                id: 'Eastland',
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [-5, 28],
                },
                properties: { name: 'Southland' },
                id: 'Southland',
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [25, 22],
                },
                properties: { name: 'Westland' },
                id: 'Westland',
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [50, 47],
                },
                properties: { name: 'Island State' },
                id: 'Island State',
            },
        ],
    };
}
