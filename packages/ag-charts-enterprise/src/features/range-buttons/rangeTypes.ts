export enum Range {
    MONTH = '1m',
    THREE_MONTHS = '3m',
    SIX_MONTHS = '6m',
    YTD = 'YTD',
    ONE_YEAR = '1y',
    ALL = 'All',
}

const DAY = 1000 * 60 * 60 * 24;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

export const RANGES = new Map<string, (() => number) | number | null>([
    [Range.MONTH, MONTH],
    [Range.THREE_MONTHS, MONTH * 3],
    [Range.SIX_MONTHS, MONTH * 6],
    [Range.YTD, () => new Date(`${new Date().getFullYear()}-01-01`).getTime()],
    [Range.ONE_YEAR, YEAR],
    [Range.ALL, null],
]);
