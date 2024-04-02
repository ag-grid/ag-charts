import type { AgAxisCaptionFormatterParams, AgAxisCaptionOptions, FontStyle, FontWeight, TextWrap } from '../../options/agChartOptions';
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
    formatter?: (params: AgAxisCaptionFormatterParams) => string;
}
