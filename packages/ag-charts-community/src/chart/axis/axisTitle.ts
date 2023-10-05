import type {
    AgAxisCaptionFormatterParams,
    AgAxisCaptionOptions,
    FontStyle,
    FontWeight,
    TextWrap,
} from '../../options/agChartOptions';
import {
    BOOLEAN,
    NUMBER,
    OPT_COLOR_STRING,
    OPT_FONT_STYLE,
    OPT_FONT_WEIGHT,
    OPT_FUNCTION,
    OPT_NUMBER,
    OPT_STRING,
    STRING,
    TEXT_WRAP,
    Validate,
} from '../../util/validation';
import { Caption } from '../caption';

export class AxisTitle implements AgAxisCaptionOptions {
    @Validate(BOOLEAN)
    enabled = false;

    @Validate(OPT_STRING)
    text?: string = undefined;

    @Validate(OPT_NUMBER(0))
    spacing?: number = Caption.PADDING;

    @Validate(OPT_FONT_STYLE)
    fontStyle?: FontStyle = undefined;

    @Validate(OPT_FONT_WEIGHT)
    fontWeight?: FontWeight = undefined;

    @Validate(NUMBER(0))
    fontSize: number = 10;

    @Validate(STRING)
    fontFamily: string = 'sans-serif';

    @Validate(OPT_COLOR_STRING)
    color?: string;

    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'always';

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgAxisCaptionFormatterParams) => string = undefined;
}
