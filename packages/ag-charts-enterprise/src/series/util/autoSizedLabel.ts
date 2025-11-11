import { _ModuleSupport } from 'ag-charts-community';
import { Property } from 'ag-charts-core';
import type { OverflowStrategy, TextWrap } from 'ag-charts-types';

class BaseAutoSizedLabel<FormatterParams> extends _ModuleSupport.Label<FormatterParams> {
    @Property
    wrapping: TextWrap = 'on-space';

    @Property
    overflowStrategy: OverflowStrategy = 'ellipsis';

    @Property
    lineHeight?: number;

    @Property
    minimumFontSize?: number;
}

export class AutoSizedLabel<FormatterParams> extends BaseAutoSizedLabel<FormatterParams> {
    @Property
    spacing: number = 0;
}

export class AutoSizedSecondaryLabel<FormatterParams> extends BaseAutoSizedLabel<FormatterParams> {}
