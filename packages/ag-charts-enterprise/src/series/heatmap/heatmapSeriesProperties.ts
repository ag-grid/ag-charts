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
import { Property, ProxyPropertyOnWrite } from 'ag-charts-core';

import { AutoSizedLabel } from '../util/autoSizedLabel';

const { CartesianSeriesProperties, ColorScaleProperties, makeSeriesTooltip } = _ModuleSupport;

export class HeatmapLabelProperties extends AutoSizedLabel<AgHeatmapSeriesLabelFormatterParams> {
    @Property
    textAlign: TextAlign = 'center';

    @Property
    verticalAlign: VerticalAlign = 'middle';
}

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
    readonly colorScale = new ColorScaleProperties();

    @Property
    stroke: string = 'black';

    @Property
    strokeOpacity: number = 1;

    @Property
    strokeWidth: number = 0;

    // Declared before `label` so an explicit `label.textAlign` wins: BaseProperties.set() applies
    // properties in declaration order, and an initialiser here would fire before `label` exists.
    @Property
    @ProxyPropertyOnWrite('label', 'textAlign')
    textAlign?: TextAlign;

    @Property
    @ProxyPropertyOnWrite('label', 'verticalAlign')
    verticalAlign?: VerticalAlign;

    @Property
    itemPadding: number = 0;

    @Property
    cornerRadius: number = 0;

    @Property
    itemStyler?: Styler<AgHeatmapSeriesItemStylerParams<unknown>, AgHeatmapSeriesStyle>;

    @Property
    readonly label = new HeatmapLabelProperties();

    @Property
    readonly tooltip = makeSeriesTooltip<AgHeatmapSeriesTooltipRendererParams<any>>();
}
