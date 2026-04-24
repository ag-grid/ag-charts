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

const DEFAULTS = {
    enabled: false,
    text: undefined as string | undefined,
    spacing: undefined as number | undefined,
    fontStyle: undefined as FontStyle | undefined,
    fontWeight: undefined as FontWeight | undefined,
    fontSize: FONT_SIZE.SMALLER,
    fontFamily: 'sans-serif',
    color: undefined as string | undefined,
    maxWidth: undefined as number | undefined,
    maxHeight: undefined as number | undefined,
    wrapping: 'always' as TextWrap,
    truncate: true,
    formatter: undefined as RichFormatter<AgAxisCaptionFormatterParams> | undefined,
};

export class AxisTitle implements AgAxisCaptionOptions {
    readonly caption = new Caption();

    enabled: boolean = DEFAULTS.enabled;

    text?: string = DEFAULTS.text;

    spacing!: number;

    fontStyle?: FontStyle = DEFAULTS.fontStyle;

    fontWeight?: FontWeight = DEFAULTS.fontWeight;

    fontSize: number = DEFAULTS.fontSize;

    fontFamily: string = DEFAULTS.fontFamily;

    color?: string = DEFAULTS.color;

    maxWidth?: number = DEFAULTS.maxWidth;

    maxHeight?: number = DEFAULTS.maxHeight;

    wrapping: TextWrap = DEFAULTS.wrapping;

    truncate: boolean = DEFAULTS.truncate;

    formatter?: RichFormatter<AgAxisCaptionFormatterParams> = DEFAULTS.formatter;

    applyOptions(options: AgAxisCaptionOptions | undefined): void {
        for (const key of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) {
            const override = options != null && key in options ? (options as any)[key] : DEFAULTS[key];
            (this as any)[key] = override;
        }
    }
}
