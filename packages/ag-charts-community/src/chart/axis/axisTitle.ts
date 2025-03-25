import type {
    AgAxisCaptionFormatterParams,
    AgAxisCaptionOptions,
    FontStyle,
    FontWeight,
    Formatter,
    TextWrap,
} from 'ag-charts-types';

import { BaseProperties } from '../../util/properties';
import { Property } from '../../util/properties';
import { Caption } from '../caption';

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
    fontSize: number = 10;

    @Property
    fontFamily: string = 'sans-serif';

    @Property
    color?: string;

    @Property
    wrapping: TextWrap = 'always';

    @Property
    formatter?: Formatter<AgAxisCaptionFormatterParams>;
}
