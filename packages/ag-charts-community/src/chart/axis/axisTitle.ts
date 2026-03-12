import { BaseProperties, FONT_SIZE, Property } from 'ag-charts-core';
import type {
    AgAxisCaptionFormatterParams,
    AgAxisCaptionOptions,
    FontStyle,
    FontWeight,
    RichFormatter,
    TextWrap,
} from 'ag-charts-types';

import { Caption } from '../caption';

export class AxisTitle extends BaseProperties implements AgAxisCaptionOptions {
    readonly caption = new Caption();

    @Property
    enabled: boolean = false;

    @Property
    text?: string;

    @Property
    spacing!: number;

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
    maxWidth?: number;

    @Property
    maxHeight?: number;

    @Property
    wrapping: TextWrap = 'always';

    @Property
    formatter?: RichFormatter<AgAxisCaptionFormatterParams>;
}
