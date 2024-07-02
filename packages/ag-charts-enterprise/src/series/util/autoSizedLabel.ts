import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { OverflowStrategy, TextWrap } from 'ag-charts-types';

const { TextMeasurer, Validate, NUMBER, TEXT_WRAP, OVERFLOW_STRATEGY } = _ModuleSupport;

export class BaseAutoSizedLabel<FormatterParams> extends _Scene.Label<FormatterParams> {
    static lineHeight(fontSize: number): number {
        return Math.ceil(fontSize * TextMeasurer.defaultLineHeight);
    }

    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'on-space';

    @Validate(OVERFLOW_STRATEGY)
    overflowStrategy: OverflowStrategy = 'ellipsis';

    @Validate(NUMBER, { optional: true })
    minimumFontSize?: number;
}

export class AutoSizedLabel<FormatterParams> extends BaseAutoSizedLabel<FormatterParams> {
    @Validate(NUMBER)
    spacing: number = 0;
}

export class AutoSizeableSecondaryLabel<FormatterParams> extends BaseAutoSizedLabel<FormatterParams> {}
