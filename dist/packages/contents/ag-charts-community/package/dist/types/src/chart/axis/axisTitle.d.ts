import type { AgAxisCaptionFormatterParams, AgAxisCaptionOptions, FontStyle, FontWeight, Formatter, TextWrap } from 'ag-charts-types';
import { BaseProperties } from '../../util/properties';
export declare class AxisTitle extends BaseProperties implements AgAxisCaptionOptions {
    enabled: boolean;
    text?: string;
    spacing?: number;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize: number;
    fontFamily: string;
    color?: string;
    wrapping: TextWrap;
    formatter?: Formatter<AgAxisCaptionFormatterParams>;
}
