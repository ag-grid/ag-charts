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
    Validate,
} from '../../util/validation';
import { Caption } from '../caption';

export class AxisTitle extends BaseProperties implements AgAxisCaptionOptions {
    @Validate(BOOLEAN)
    enabled: boolean = false;

    @Validate(STRING, { optional: true })
    text?: string;

    @Validate(POSITIVE_NUMBER, { optional: true })
    spacing?: number = Caption.SMALL_PADDING;

    @Validate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle;

    @Validate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight;

    @Validate(POSITIVE_NUMBER)
    fontSize: number = 10;

    @Validate(STRING)
    fontFamily: string = 'sans-serif';

    @Validate(COLOR_STRING, { optional: true })
    color?: string;

    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'always';

    @Validate(FUNCTION, { optional: true })
    formatter?: Formatter<AgAxisCaptionFormatterParams>;
}
