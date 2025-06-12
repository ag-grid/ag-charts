import type {
    AgCandlestickSeriesItemOptions,
    AgCandlestickSeriesItemStylerParams,
    AgCandlestickSeriesTooltipRendererParams,
    AgOhlcSeriesBaseOptions,
    AgOhlcSeriesItemOptions,
    AgOhlcSeriesItemStylerParams,
    AgOhlcSeriesOptions,
    AgOhlcSeriesTooltipRendererParams,
    FillOptions,
    LineDashOptions,
    StrokeOptions,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type {
    RequiredInternalAgGradientColor,
    RequiredInternalAgImageFill,
    RequiredInternalAgPatternColor,
} from 'ag-charts-core';

const { BaseProperties, Property, AbstractBarSeriesProperties, makeSeriesTooltip } = _ModuleSupport;

class OhlcSeriesItem extends BaseProperties {
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
}

class OhlcSeriesItems extends BaseProperties {
    @Property
    readonly up = new OhlcSeriesItem();

    @Property
    readonly down = new OhlcSeriesItem();
}

export abstract class OhlcSeriesBaseProperties<
    T extends AgOhlcSeriesBaseOptions,
> extends AbstractBarSeriesProperties<T> {
    abstract item: Record<
        'up' | 'down',
        FillOptions &
            StrokeOptions &
            LineDashOptions & {
                fillGradientDefaults?: RequiredInternalAgGradientColor;
                fillPatternDefaults?: RequiredInternalAgPatternColor;
                fillImageDefaults?: RequiredInternalAgImageFill;
            }
    >;

    @Property
    xKey!: string;

    @Property
    openKey!: string;

    @Property
    closeKey!: string;

    @Property
    highKey!: string;

    @Property
    lowKey!: string;

    @Property
    xName?: string;

    @Property
    yName?: string;

    @Property
    openName?: string;

    @Property
    closeName?: string;

    @Property
    highName?: string;

    @Property
    lowName?: string;

    abstract override readonly tooltip: _ModuleSupport.SeriesTooltip<
        AgOhlcSeriesTooltipRendererParams<any> & AgCandlestickSeriesTooltipRendererParams<any>
    >;

    abstract itemStyler?: Styler<AgOhlcSeriesItemStylerParams<unknown>, AgOhlcSeriesItemOptions> &
        Styler<AgCandlestickSeriesItemStylerParams<unknown>, AgCandlestickSeriesItemOptions>;
}

export class OhlcSeriesProperties extends OhlcSeriesBaseProperties<AgOhlcSeriesOptions> {
    @Property
    readonly tooltip = makeSeriesTooltip<AgOhlcSeriesTooltipRendererParams<any>>();

    @Property
    readonly item = new OhlcSeriesItems();

    @Property
    itemStyler?: Styler<AgOhlcSeriesItemStylerParams<unknown>, AgOhlcSeriesItemOptions>;
}
