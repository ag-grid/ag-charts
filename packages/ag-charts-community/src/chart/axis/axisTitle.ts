import { FONT_SIZE } from 'ag-charts-core';
import type {
    AgAxisCaptionFormatterParams,
    AgAxisCaptionOptions,
    FontStyle,
    FontWeight,
    RichFormatter,
    TextWrap,
} from 'ag-charts-types';

import { Caption } from '../caption';

export class AxisTitle implements AgAxisCaptionOptions {
    readonly caption = new Caption();

    enabled: boolean = false;

    text?: string;

    spacing!: number;

    fontStyle?: FontStyle;

    fontWeight?: FontWeight;

    fontSize: number = FONT_SIZE.SMALLER;

    fontFamily: string = 'sans-serif';

    color?: string;

    maxWidth?: number;

    maxHeight?: number;

    wrapping: TextWrap = 'always';

    truncate: boolean = true;

    formatter?: RichFormatter<AgAxisCaptionFormatterParams>;

    applyOptions(options: AgAxisCaptionOptions | undefined): void {
        if (options != null) Object.assign(this, options);
    }
}
