import type {
    AgAxisCaptionFormatterParams,
    AgAxisCaptionOptions,
    FontStyle,
    FontWeight,
    Formatter,
    TextWrap,
} from 'ag-charts-types';

import { BaseProperties } from '../../util/properties';
import {
    BOOLEAN,
    COLOR_STRING,
    FONT_STYLE,
    FONT_WEIGHT,
    FUNCTION,
    POSITIVE_NUMBER,
    STRING,
    TEXT_WRAP,
    TempValidate,
} from '../../util/validation';
import { Caption } from '../caption';

export class AxisTitle extends BaseProperties implements AgAxisCaptionOptions {
    readonly caption = new Caption();

    @TempValidate(BOOLEAN)
    enabled: boolean = false;

    @TempValidate(STRING, { optional: true })
    text?: string;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    spacing?: number = Caption.SMALL_PADDING;

    @TempValidate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle;

    @TempValidate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight;

    @TempValidate(POSITIVE_NUMBER)
    fontSize: number = 10;

    @TempValidate(STRING)
    fontFamily: string = 'sans-serif';

    @TempValidate(COLOR_STRING, { optional: true })
    color?: string;

    @TempValidate(TEXT_WRAP)
    wrapping: TextWrap = 'always';

    @TempValidate(FUNCTION, { optional: true })
    formatter?: Formatter<AgAxisCaptionFormatterParams>;
}
