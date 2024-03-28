export declare enum Range {
    MONTH = "1m",
    THREE_MONTHS = "3m",
    SIX_MONTHS = "6m",
    YTD = "YTD",
    ONE_YEAR = "1y",
    ALL = "All"
}
export declare const RANGES: Map<string, number | ((end: Date | number) => number) | null>;
