export declare enum DefaultTimeFormats {
    MILLISECOND = 0,
    SECOND = 1,
    MINUTE = 2,
    HOUR = 3,
    WEEK_DAY = 4,
    SHORT_MONTH = 5,
    MONTH = 6,
    SHORT_YEAR = 7,
    YEAR = 8
}
export declare const TIME_FORMAT_STRINGS: Record<DefaultTimeFormats, string>;
export declare function dateToNumber(x: any): any;
export declare function defaultTimeTickFormat(ticks?: any[]): (date: Date) => string;
export declare function calculateDefaultTimeTickFormat(ticks?: any[] | undefined): string;
export declare function getLowestGranularityFormat(value: Date | number): DefaultTimeFormats;
export declare function formatStringBuilder(defaultTimeFormat: DefaultTimeFormats, yearChange: boolean, ticks: any[]): string;
