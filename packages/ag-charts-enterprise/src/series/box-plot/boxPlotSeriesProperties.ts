import type {
    AgBoxPlotSeriesItemStylerParams,
    AgBoxPlotSeriesOptions,
    AgBoxPlotSeriesStyle,
    AgBoxPlotSeriesTooltipRendererParams,
    AgColorType,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

const {
    BaseProperties,
    AbstractBarSeriesProperties,
    SeriesTooltip,
    TempValidate,
    COLOR_STRING,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    mergeDefaults,
    COLOR_STRING_ARRAY,
    COLOR_GRADIENT,
    OR,
} = _ModuleSupport;

class BoxPlotSeriesCap extends BaseProperties {
    @TempValidate(RATIO)
    lengthRatio = 0.5;
}

class BoxPlotSeriesWhisker extends BaseProperties {
    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth?: number;

    @TempValidate(RATIO)
    strokeOpacity?: number;

    @TempValidate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset?: number;
}

export class BoxPlotSeriesProperties extends AbstractBarSeriesProperties<AgBoxPlotSeriesOptions> {
    @TempValidate(STRING)
    xKey!: string;

    @TempValidate(STRING)
    minKey!: string;

    @TempValidate(STRING)
    q1Key!: string;

    @TempValidate(STRING)
    medianKey!: string;

    @TempValidate(STRING)
    q3Key!: string;

    @TempValidate(STRING)
    maxKey!: string;

    @TempValidate(STRING, { optional: true })
    xName?: string;

    @TempValidate(STRING, { optional: true })
    yName?: string;

    @TempValidate(STRING, { optional: true })
    minName?: string;

    @TempValidate(STRING, { optional: true })
    q1Name?: string;

    @TempValidate(STRING, { optional: true })
    medianName?: string;

    @TempValidate(STRING, { optional: true })
    q3Name?: string;

    @TempValidate(STRING, { optional: true })
    maxName?: string;

    @TempValidate(COLOR_STRING_ARRAY)
    defaultColorRange: string[] = [];

    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING), { optional: true })
    fill: AgColorType = '#c16068';

    @TempValidate(RATIO)
    fillOpacity = 1;

    @TempValidate(COLOR_STRING)
    stroke: string = '#333';

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgBoxPlotSeriesItemStylerParams<unknown>, AgBoxPlotSeriesStyle>;

    @TempValidate(OBJECT)
    readonly cap = new BoxPlotSeriesCap();

    @TempValidate(OBJECT)
    readonly whisker = new BoxPlotSeriesWhisker();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgBoxPlotSeriesTooltipRendererParams<any>>();

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
