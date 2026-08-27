/**
 * Countries rather than regions, because the series count runs into the tens and
 * there are not that many coherent world regions - a legend reading "Europe,
 * Nordics, Iberia" is worse than no story at all. Countries stay plausible at
 * any count, and the labels are short enough for a legend.
 */
const CURATED_SERIES = [
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

/**
 * The tail of the list, reached only at the top of the count scale. Real
 * countries, so a paginated legend still reads as data rather than as
 * "Series 27", but their figures are generated: past a dozen series nobody
 * reads an individual value, and hand-writing a hundred more would be a hundred
 * more chances to fat-finger one.
 */
const EXTRA_COUNTRIES = [
    'Norway',
    'Sweden',
    'Denmark',
    'Finland',
    'Poland',
    'Portugal',
    'Ireland',
    'Austria',
    'Belgium',
    'Chile',
    'Peru',
    'Egypt',
    'Kenya',
    'Morocco',
    'Vietnam',
    'Thailand',
    'Malaysia',
    'Singapore',
    'Turkey',
    'Greece',
    'Israel',
    'Nigeria',
    'Colombia',
    'Argentina',
];

const EXTRA_SERIES = EXTRA_COUNTRIES.map((name) => ({ key: name.toLowerCase(), name }));

export const PREVIEW_SERIES = [...CURATED_SERIES, ...EXTRA_SERIES];

/**
 * An exponential scale rather than every integer: six series and seven look the
 * same, so the steps worth offering are further apart than one.
 *
 * Each step past 8 answers a question the smaller ones cannot. Every preset
 * carries at least eight fills, so 13 is where a user finds out whether their
 * palette survives repeating; the counts above it are there to run the legend
 * out of room, since its pagination buttons and label are themed too, and to
 * crowd a donut until its slice strokes compete with its fills.
 *
 * It stops at 34 deliberately. Beyond that the count demonstrates the chart
 * engine rather than the theme, and this is the one place that costs something:
 * the preview is rebuilt on every param edit, so a colour picker dragged against
 * a thousand series would stutter under the hand doing the dragging.
 */
export const SERIES_COUNT_OPTIONS = [2, 3, 5, 8, 13, 21, 34];

export const MIN_SERIES_COUNT = SERIES_COUNT_OPTIONS[0];
export const MAX_SERIES_COUNT = SERIES_COUNT_OPTIONS[SERIES_COUNT_OPTIONS.length - 1];
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
const CURATED_DATA = [
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

/**
 * Deterministic, so the preview and anything asserting against it are stable,
 * and phase-shifted by a stride that jumps rather than creeps - a phase that
 * advanced smoothly with the index would fan 34 lines into a moiré pattern, and
 * stack 34 bands into one wave. Peaks land in all four quarters instead.
 */
const generatedRevenue = (index: number, quarter: number) => {
    const base = 70 + ((index * 37) % 90);
    const swing = 15 + ((index * 53) % 45);
    return Math.round(base + swing * Math.sin(((index * 7) % 12) * 0.55 + quarter * 1.1));
};

/**
 * The hand-written quarters, extended with a figure for every country past the
 * tenth. Typed loosely because half of it is computed; the half that is written
 * out keeps its literal types at `CURATED_DATA`, which is where a typo matters.
 */
export const PREVIEW_DATA: Record<string, number | string>[] = CURATED_DATA.map((row, quarter) => ({
    ...row,
    ...Object.fromEntries(EXTRA_SERIES.map(({ key }, index) => [key, generatedRevenue(index, quarter)])),
}));

export const seriesFor = (count: number) => PREVIEW_SERIES.slice(0, count);

/**
 * The same story reshaped for the single-series types: full-year totals per
 * country. Derived rather than written out, so the donut and the bars can never
 * disagree about the numbers behind them.
 */
export const totalsFor = (count: number) =>
    seriesFor(count).map(({ key, name }) => ({
        country: name,
        revenue: PREVIEW_DATA.reduce((total, row) => total + (row[key] as number), 0),
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
