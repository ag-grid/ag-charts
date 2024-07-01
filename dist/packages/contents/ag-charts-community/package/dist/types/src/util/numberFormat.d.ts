interface FormatterOptions {
    prefix?: string;
    fill?: string;
    align?: string;
    sign?: string;
    symbol?: string;
    zero?: string;
    width?: number;
    comma?: string;
    precision?: number;
    trim?: boolean;
    type?: string;
    suffix?: string;
}
export declare function parseFormat(format: string): FormatterOptions;
export declare function numberFormat(format: string | FormatterOptions): (n: number) => string;
export {};
