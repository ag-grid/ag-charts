import type {
    AgCandlestickSeriesItemOptions,
    AgCandlestickSeriesItemStylerParams,
    AgCandlestickSeriesTooltipRendererParams,
    AgOhlcSeriesBaseOptions,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';

import { OhlcSeriesBaseProperties } from '../ohlc/ohlcSeriesProperties';

const { FillGradientDefaults, FillPatternDefaults, FillImageDefaults, BaseProperties, makeSeriesTooltip, Property } =
    _ModuleSupport;

class CandlestickSeriesWick extends BaseProperties {
    @Property
    stroke?: string;

    @Property
    strokeWidth?: number;

    @Property
    strokeOpacity?: number;

    @Property
    lineDash?: number[];

    @Property
    lineDashOffset?: number;
}

class CandlestickSeriesItem extends BaseProperties {
    @Property
    fill: InternalAgColorType = '#c16068';

    @Property
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

    @Property
    readonly fillImageDefaults = new FillImageDefaults();

    @Property
    fillOpacity = 1;

    @Property
    stroke: string = '#333';

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    cornerRadius: number = 0;

    @Property
    readonly wick = new CandlestickSeriesWick();
}

class CandlestickSeriesItems extends BaseProperties {
    @Property
    readonly up = new CandlestickSeriesItem();

    @Property
    readonly down = new CandlestickSeriesItem();
}

export class CandlestickSeriesProperties<T extends AgOhlcSeriesBaseOptions> extends OhlcSeriesBaseProperties<T> {
    @Property
    readonly item = new CandlestickSeriesItems();

    @Property
    override readonly tooltip = makeSeriesTooltip<AgCandlestickSeriesTooltipRendererParams<any>>();

    @Property
    itemStyler?: Styler<AgCandlestickSeriesItemStylerParams<unknown>, AgCandlestickSeriesItemOptions>;

    constructor() {
        super();
        this.highlightStyle.deprecated = false;
    }
}
