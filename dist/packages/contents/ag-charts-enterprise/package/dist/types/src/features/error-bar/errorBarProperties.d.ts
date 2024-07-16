import { type AgErrorBarOptions, _ModuleSupport } from 'ag-charts-community';
import type { ErrorBarCapFormatter, ErrorBarFormatter } from './errorBarNode';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties;
declare class ErrorBarCap extends BaseProperties<NonNullable<AgErrorBarOptions['cap']>> {
    visible?: boolean;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    length?: number;
    lengthRatio?: number;
    formatter?: ErrorBarCapFormatter;
}
export declare class ErrorBarProperties extends BaseProperties<AgErrorBarOptions> {
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
    formatter?: ErrorBarFormatter;
    cap: ErrorBarCap;
}
export {};
