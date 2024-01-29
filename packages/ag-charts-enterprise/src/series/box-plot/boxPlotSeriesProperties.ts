import type {
    AgBoxPlotSeriesFormatterParams,
    AgBoxPlotSeriesOptions,
    AgBoxPlotSeriesStyles,
    AgBoxPlotSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

const {
    BaseProperties,
    AbstractBarSeriesProperties,
    SeriesTooltip,
    Validate,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    mergeDefaults,
} = _ModuleSupport;

class BoxPlotSeriesCap extends BaseProperties {
    @Validate(RATIO)
    lengthRatio = 0.5;
}

class BoxPlotSeriesWhisker extends BaseProperties {
    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;

    @Validate(POSITIVE_NUMBER)
    strokeWidth?: number;

    @Validate(RATIO)
    strokeOpacity?: number;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset?: number;
}

export class BoxPlotSeriesProperties extends AbstractBarSeriesProperties<AgBoxPlotSeriesOptions> {
    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    minKey!: string;

    @Validate(STRING)
    q1Key!: string;

    @Validate(STRING)
    medianKey!: string;

    @Validate(STRING)
    q3Key!: string;

    @Validate(STRING)
    maxKey!: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(STRING, { optional: true })
    minName?: string;

    @Validate(STRING, { optional: true })
    q1Name?: string;

    @Validate(STRING, { optional: true })
    medianName?: string;

    @Validate(STRING, { optional: true })
    q3Name?: string;

    @Validate(STRING, { optional: true })
    maxName?: string;

    @Validate(COLOR_STRING, { optional: true })
    fill: string = '#c16068';

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(COLOR_STRING)
    stroke: string = '#333';

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgBoxPlotSeriesFormatterParams<unknown>) => AgBoxPlotSeriesStyles;

    @Validate(OBJECT)
    readonly cap = new BoxPlotSeriesCap();

    @Validate(OBJECT)
    readonly whisker = new BoxPlotSeriesWhisker();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgBoxPlotSeriesTooltipRendererParams>();

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
