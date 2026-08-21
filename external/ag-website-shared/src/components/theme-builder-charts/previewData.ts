/**
 * Countries rather than regions, because the series count is user-configurable
 * up to ten and there are not ten coherent world regions - a legend reading
 * "Europe, Nordics, Iberia" is worse than no story at all. Ten countries stay
 * plausible at any count, and the labels are short enough for a legend.
 */
export const PREVIEW_SERIES = [
    { key: 'germany', name: 'Germany' },
    { key: 'france', name: 'France' },
    { key: 'japan', name: 'Japan' },
    { key: 'brazil', name: 'Brazil' },
    { key: 'canada', name: 'Canada' },
    { key: 'india', name: 'India' },
    { key: 'australia', name: 'Australia' },
    { key: 'mexico', name: 'Mexico' },
    { key: 'spain', name: 'Spain' },
    { key: 'italy', name: 'Italy' },
];

export const MIN_SERIES_COUNT = 2;
export const MAX_SERIES_COUNT = PREVIEW_SERIES.length;
export const DEFAULT_SERIES_COUNT = 5;

/**
 * The values deliberately cross over rather than all trending the same way: a
 * different country leads in each quarter, Brazil declines while Canada grows,
 * and Japan climbs from last to first. Data that only descended left-to-right
 * made all four groups the same silhouette repeated, so nothing about the chart
 * - or a theme change - was legible from its shape.
 *
 * The first five carry that crossover on their own, since five is the default
 * and the count only ever takes a prefix of this list.
 */
export const PREVIEW_DATA = [
    {
        quarter: 'Q1',
        germany: 168,
        france: 132,
        japan: 71,
        brazil: 94,
        canada: 43,
        india: 88,
        australia: 55,
        mexico: 121,
        spain: 39,
        italy: 97,
    },
    {
        quarter: 'Q2',
        germany: 145,
        france: 158,
        japan: 108,
        brazil: 61,
        canada: 77,
        india: 64,
        australia: 91,
        mexico: 47,
        spain: 113,
        italy: 72,
    },
    {
        quarter: 'Q3',
        germany: 201,
        france: 121,
        japan: 164,
        brazil: 88,
        canada: 52,
        india: 112,
        australia: 43,
        mexico: 96,
        spain: 71,
        italy: 134,
    },
    {
        quarter: 'Q4',
        germany: 176,
        france: 189,
        japan: 213,
        brazil: 47,
        canada: 96,
        india: 79,
        australia: 128,
        mexico: 62,
        spain: 105,
        italy: 58,
    },
];

export const seriesFor = (count: number) => PREVIEW_SERIES.slice(0, count);

/**
 * The same story reshaped for the single-series types: full-year totals per
 * country. Derived rather than written out, so the donut and the bars can never
 * disagree about the numbers behind them.
 */
export const totalsFor = (count: number) =>
    seriesFor(count).map(({ key, name }) => ({
        country: name,
        revenue: PREVIEW_DATA.reduce(
            (total, row) => total + (row[key as keyof (typeof PREVIEW_DATA)[number]] as number),
            0
        ),
    }));

/**
 * The thumbnails need a different shape from the main preview.
 *
 * The stock palettes run the same hue sequence - blue, orange, green, cyan,
 * yellow - and differ mainly in saturation and tone, so a handful of thin bars
 * makes Default, Material and Vivid near-indistinguishable at card size. Eight
 * stacked series reach further into each palette and turn the colours into large
 * contiguous blocks, where those differences actually read.
 */
export const THUMBNAIL_SERIES_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/**
 * Six columns, so the bars stay slim enough to read as a chart at card size,
 * with enough variation in the totals and in each band that the columns are not
 * six copies of one another.
 */
export const THUMBNAIL_DATA = [
    { period: '1', a: 38, b: 41, c: 22, d: 31, e: 14, f: 24, g: 9, h: 17 },
    { period: '2', a: 52, b: 27, c: 35, d: 18, e: 26, f: 12, g: 19, h: 8 },
    { period: '3', a: 31, b: 46, c: 19, d: 37, e: 11, f: 28, g: 15, h: 22 },
    { period: '4', a: 61, b: 24, c: 42, d: 15, e: 33, f: 17, g: 7, h: 13 },
    { period: '5', a: 43, b: 35, c: 26, d: 44, e: 18, f: 9, g: 23, h: 19 },
    { period: '6', a: 56, b: 32, c: 48, d: 21, e: 29, f: 20, g: 12, h: 25 },
];

/** The same eight bands as one slice each, for the single-series thumbnails. */
export const THUMBNAIL_SLICES = THUMBNAIL_SERIES_KEYS.map((key) => ({
    slice: key,
    value: THUMBNAIL_DATA.reduce(
        (total, row) => total + (row[key as keyof (typeof THUMBNAIL_DATA)[number]] as number),
        0
    ),
}));
