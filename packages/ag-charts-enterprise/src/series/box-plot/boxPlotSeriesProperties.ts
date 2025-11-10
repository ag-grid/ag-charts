import type {
    AgBoxPlotSeriesItemStylerParams,
    AgBoxPlotSeriesOptions,
    AgBoxPlotSeriesStyle,
    AgBoxPlotSeriesStylerParams,
    AgBoxPlotSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { Property, BaseProperties, mergeDefaults} from 'ag-charts-core';
import type { InternalAgColorType } from 'ag-charts-core';

const { AbstractBarSeriesProperties, makeSeriesTooltip } = _ModuleSupport;
class BoxPlotSeriesCap extends BaseProperties {
    @Property
    lengthRatio = 0.5;
}

class BoxPlotSeriesWhisker extends BaseProperties {
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

export class BoxPlotSeriesProperties extends AbstractBarSeriesProperties<AgBoxPlotSeriesOptions> {
    @Property
    xKey!: string;

    @Property
    minKey!: string;

    @Property
    q1Key!: string;

    @Property
    medianKey!: string;

    @Property
    q3Key!: string;

    @Property
    maxKey!: string;

    @Property
    xName?: string;

    @Property
    yName?: string;

    @Property
    minName?: string;

    @Property
    q1Name?: string;

    @Property
    medianName?: string;

    @Property
    q3Name?: string;

    @Property
    maxName?: string;

    @Property
    fill: InternalAgColorType = '#c16068';

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
    styler?: Styler<AgBoxPlotSeriesStylerParams<unknown, unknown>, AgBoxPlotSeriesStyle>;

    @Property
    itemStyler?: Styler<AgBoxPlotSeriesItemStylerParams<unknown>, AgBoxPlotSeriesStyle>;

    @Property
    readonly cap = new BoxPlotSeriesCap();

    @Property
    readonly whisker = new BoxPlotSeriesWhisker();

    @Property
    readonly tooltip = makeSeriesTooltip<AgBoxPlotSeriesTooltipRendererParams<any>>();

    override toJson() {
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this;
        const properties = super.toJson();

        properties.whisker = mergeDefaults(properties.whisker, {
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        });

        return properties;
    }
}
