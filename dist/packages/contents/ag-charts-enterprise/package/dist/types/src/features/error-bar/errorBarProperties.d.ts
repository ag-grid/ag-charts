import { type AgErrorBarItemStylerParams, type AgErrorBarOptions, type AgErrorBarThemeableOptions, type ErrorBarCapOptions, type Styler, _ModuleSupport } from 'ag-charts-community';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties;
declare class ErrorBarCap extends BaseProperties<ErrorBarCapOptions> {
    visible?: boolean;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    length?: number;
    lengthRatio?: number;
}
export declare class ErrorBarProperties extends BaseProperties<AgErrorBarOptions<any>> {
    yLowerKey?: string;
    yLowerName?: string;
    yUpperKey?: string;
    yUpperName?: string;
    xLowerKey?: string;
    xLowerName?: string;
    xUpperKey?: string;
    xUpperName?: string;
    visible?: boolean;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    itemStyler?: Styler<AgErrorBarItemStylerParams<unknown>, AgErrorBarThemeableOptions>;
    cap: ErrorBarCap;
}
export {};
