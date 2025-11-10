import type {
    AgTooltipRendererResult,
    AgWaterfallSeriesItemStylerParams,
    AgWaterfallSeriesItemType,
    AgWaterfallSeriesLabelFormatterParams,
    AgWaterfallSeriesLabelPlacement,
    AgWaterfallSeriesOptions,
    AgWaterfallSeriesStyle,
    AgWaterfallSeriesTooltipRendererParams,
    PixelSize,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { Property, BaseProperties, PropertiesArray} from 'ag-charts-core';
import type { InternalAgColorType } from 'ag-charts-core';

const { AbstractBarSeriesProperties, makeSeriesTooltip, DropShadow, Label } = _ModuleSupport;
export class WaterfallSeriesTotal extends BaseProperties {
    @Property
    totalType!: 'subtotal' | 'total';

    @Property
    index!: number;

    @Property
    axisLabel!: string;
}

class WaterfallSeriesItemTooltip extends BaseProperties {
    @Property
    renderer?: (params: AgWaterfallSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

class WaterfallSeriesLabel extends Label<AgWaterfallSeriesLabelFormatterParams> {
    @Property
    placement: AgWaterfallSeriesLabelPlacement = 'outside-end';

    @Property
    spacing: PixelSize = 0;
}

export class WaterfallSeriesItem extends BaseProperties {
    @Property
    name?: string;

    @Property
    fill: InternalAgColorType = '#c16068';

    @Property
    stroke: string = '#c16068';

    @Property
    fillOpacity = 1;

    @Property
    strokeOpacity = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    strokeWidth: number = 1;

    @Property
    cornerRadius: number = 0;

    @Property
    itemStyler?: Styler<AgWaterfallSeriesItemStylerParams<unknown>, AgWaterfallSeriesStyle>;

    @Property
    readonly shadow = new DropShadow().set({ enabled: false });

    @Property
    readonly label = new WaterfallSeriesLabel();

    @Property
    readonly tooltip = new WaterfallSeriesItemTooltip();
}

class WaterfallSeriesConnectorLine extends BaseProperties {
    @Property
    enabled: boolean = true;

    @Property
    stroke: string = 'black';

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    strokeWidth: number = 2;
}

class WaterfallSeriesItems extends BaseProperties {
    @Property
    readonly positive = new WaterfallSeriesItem();

    @Property
    readonly negative = new WaterfallSeriesItem();

    @Property
    readonly total = new WaterfallSeriesItem();
}

export class WaterfallSeriesProperties extends AbstractBarSeriesProperties<AgWaterfallSeriesOptions> {
    @Property
    xKey!: string;

    @Property
    yKey!: string;

    @Property
    xName?: string;

    @Property
    yName?: string;

    @Property
    readonly item = new WaterfallSeriesItems();

    @Property
    readonly totals: WaterfallSeriesTotal[] = new PropertiesArray(WaterfallSeriesTotal);

    @Property
    readonly line = new WaterfallSeriesConnectorLine();

    @Property
    readonly tooltip = makeSeriesTooltip<AgWaterfallSeriesTooltipRendererParams>();

    getStyle(itemId: AgWaterfallSeriesItemType): Required<AgWaterfallSeriesStyle> & { opacity: number } {
        const { fillOpacity, strokeWidth, strokeOpacity, fill, stroke, lineDash, lineDashOffset, cornerRadius } =
            this.item[itemId === 'subtotal' ? 'total' : itemId];
        return {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cornerRadius,
            opacity: 1,
        };
    }
}
