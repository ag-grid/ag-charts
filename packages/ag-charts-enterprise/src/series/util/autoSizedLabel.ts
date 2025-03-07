import { _ModuleSupport } from 'ag-charts-community';
import type { OverflowStrategy, TextWrap } from 'ag-charts-types';

const { TempValidate, NUMBER, POSITIVE_NUMBER, TEXT_WRAP, OVERFLOW_STRATEGY } = _ModuleSupport;

class BaseAutoSizedLabel<FormatterParams> extends _ModuleSupport.Label<FormatterParams> {
    @TempValidate(TEXT_WRAP)
    wrapping: TextWrap = 'on-space';

    @TempValidate(OVERFLOW_STRATEGY)
    overflowStrategy: OverflowStrategy = 'ellipsis';

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    lineHeight?: number;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    minimumFontSize?: number;
}

export class AutoSizedLabel<FormatterParams> extends BaseAutoSizedLabel<FormatterParams> {
    @TempValidate(NUMBER)
    spacing: number = 0;
}

export class AutoSizedSecondaryLabel<FormatterParams> extends BaseAutoSizedLabel<FormatterParams> {}
