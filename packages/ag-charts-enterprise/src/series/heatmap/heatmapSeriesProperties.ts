import type {
    AgHeatmapSeriesItemStylerParams,
    AgHeatmapSeriesLabelFormatterParams,
    AgHeatmapSeriesOptions,
    AgHeatmapSeriesStyle,
    AgHeatmapSeriesTooltipRendererParams,
    Styler,
    TextAlign,
    VerticalAlign,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { Property } from 'ag-charts-core';

import { AutoSizedLabel } from '../util/autoSizedLabel';

const { CartesianSeriesProperties, ColorScaleProperties, makeSeriesTooltip } = _ModuleSupport;
export class HeatmapSeriesProperties extends CartesianSeriesProperties<AgHeatmapSeriesOptions> {
    @Property
    title?: string;

    @Property
    xKey!: string;

    @Property
    yKey!: string;

    @Property
    colorKey?: string;

    @Property
    xName?: string;

    @Property
    yName?: string;

    @Property
    colorName?: string;

    @Property
    colorRange: string[] = ['black', 'black'];

    @Property
    readonly colorScale = new ColorScaleProperties();

    @Property
    stroke: string = 'black';

    @Property
    strokeOpacity: number = 1;

    @Property
    strokeWidth: number = 0;

    @Property
    textAlign: TextAlign = 'center';

    @Property
    verticalAlign: VerticalAlign = 'middle';

    @Property
    itemPadding: number = 0;

    @Property
    itemStyler?: Styler<AgHeatmapSeriesItemStylerParams<unknown>, AgHeatmapSeriesStyle>;

    @Property
    readonly label = new AutoSizedLabel<AgHeatmapSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = makeSeriesTooltip<AgHeatmapSeriesTooltipRendererParams<any>>();
}
