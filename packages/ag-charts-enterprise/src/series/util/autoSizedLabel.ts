import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { OverflowStrategy, TextWrap } from 'ag-charts-types';

const { Validate, NUMBER, POSITIVE_NUMBER, TEXT_WRAP, OVERFLOW_STRATEGY } = _ModuleSupport;

export class BaseAutoSizedLabel<FormatterParams> extends _Scene.Label<FormatterParams> {
    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'on-space';

    @Validate(OVERFLOW_STRATEGY)
    overflowStrategy: OverflowStrategy = 'ellipsis';

    @Validate(POSITIVE_NUMBER, { optional: true })
    lineHeight?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    minimumFontSize?: number;
}

export class AutoSizedLabel<FormatterParams> extends BaseAutoSizedLabel<FormatterParams> {
    @Validate(NUMBER)
    spacing: number = 0;
}

export class AutoSizedSecondaryLabel<FormatterParams> extends BaseAutoSizedLabel<FormatterParams> {}
