import { BaseProperties, Property } from 'ag-charts-core';
import type {
    AgAxisCaptionFormatterParams,
    AgAxisCaptionOptions,
    FontStyle,
    FontWeight,
    RichFormatter,
    TextWrap,
} from 'ag-charts-types';

import { Caption } from '../caption';
import { FONT_SIZE } from 'ag-charts-core';

export class AxisTitle extends BaseProperties implements AgAxisCaptionOptions {
    readonly caption = new Caption();

    @Property
    enabled: boolean = false;

    @Property
    text?: string;

    @Property
    spacing?: number = Caption.SMALL_PADDING;

    @Property
    fontStyle?: FontStyle;

    @Property
    fontWeight?: FontWeight;

    @Property
    fontSize: number = FONT_SIZE.SMALLER;

    @Property
    fontFamily: string = 'sans-serif';

    @Property
    color?: string;

    @Property
    wrapping: TextWrap = 'always';

    @Property
    formatter?: RichFormatter<AgAxisCaptionFormatterParams>;
}
