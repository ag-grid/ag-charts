import type {
    AgRangeBarSeriesItemStylerParams,
    AgRangeBarSeriesLabelFormatterParams,
    AgRangeBarSeriesLabelPlacement,
    AgRangeBarSeriesOptions,
    AgRangeBarSeriesStyle,
    AgRangeBarSeriesStylerParams,
    AgRangeBarSeriesTooltipRendererParams,
    PixelSize,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';
import { Property } from 'ag-charts-core';

const { AbstractBarSeriesProperties, makeSeriesTooltip, DropShadow, Label } = _ModuleSupport;
class RangeBarSeriesLabel extends Label<AgRangeBarSeriesLabelFormatterParams> {
    @Property
    placement: AgRangeBarSeriesLabelPlacement = 'inside';

    @Property
    spacing: PixelSize = 0;
}

export class RangeBarProperties extends AbstractBarSeriesProperties<AgRangeBarSeriesOptions> {
    @Property
    xKey!: string;

    @Property
    yLowKey!: string;

    @Property
    yHighKey!: string;

    @Property
    xName?: string;

    @Property
    yName?: string;

    @Property
    yLowName?: string;

    @Property
    yHighName?: string;

    @Property
    fill: InternalAgColorType = '#99CCFF';

    @Property
    fillOpacity: number = 1;

    @Property
    stroke: string = '#99CCFF';

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    cornerRadius: number = 0;

    @Property
    styler?: Styler<AgRangeBarSeriesStylerParams<unknown, unknown>, AgRangeBarSeriesStyle>;

    @Property
    itemStyler?: Styler<AgRangeBarSeriesItemStylerParams<unknown>, AgRangeBarSeriesStyle>;

    @Property
    readonly shadow = new DropShadow().set({ enabled: false });

    @Property
    readonly label = new RangeBarSeriesLabel();

    @Property
    readonly tooltip = makeSeriesTooltip<AgRangeBarSeriesTooltipRendererParams<unknown>>();
}
