import {
    type AgErrorBarItemStylerParams,
    type AgErrorBarOptions,
    type AgErrorBarThemeableOptions,
    type ErrorBarCapOptions,
    type Styler,
} from 'ag-charts-community';
import { BaseProperties, Property } from 'ag-charts-core';

class ErrorBarCap extends BaseProperties<ErrorBarCapOptions> {
    @Property
    visible?: boolean;

    @Property
    stroke?: string;

    @Property
    strokeWidth?: number;

    @Property
    strokeOpacity?: number;

    @Property
    lineDash?: number[];

    @Property
    lineDashOffset?: number;

    @Property
    length?: number;

    @Property
    lengthRatio?: number;
}

export class ErrorBarProperties extends BaseProperties<AgErrorBarOptions<any>> {
    @Property
    yLowerKey?: string;

    @Property
    yLowerName?: string;

    @Property
    yUpperKey?: string;

    @Property
    yUpperName?: string;

    @Property
    xLowerKey?: string;

    @Property
    xLowerName?: string;

    @Property
    xUpperKey?: string;

    @Property
    xUpperName?: string;

    @Property
    visible?: boolean = true;

    @Property
    stroke?: string = 'black';

    @Property
    strokeWidth?: number = 1;

    @Property
    strokeOpacity?: number = 1;

    @Property
    lineDash?: number[];

    @Property
    lineDashOffset?: number;

    @Property
    itemStyler?: Styler<AgErrorBarItemStylerParams<unknown>, AgErrorBarThemeableOptions>;

    @Property
    cap = new ErrorBarCap();
}
