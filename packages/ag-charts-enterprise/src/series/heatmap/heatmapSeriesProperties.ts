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

import { AutoSizedLabel } from '../util/autoSizedLabel';

const {
    CartesianSeriesProperties,
    SeriesTooltip,
    TempValidate,
    AND,
    ARRAY,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    TEXT_ALIGN,
    VERTICAL_ALIGN,
} = _ModuleSupport;

export class HeatmapSeriesProperties extends CartesianSeriesProperties<AgHeatmapSeriesOptions> {
    @TempValidate(STRING, { optional: true })
    title?: string;

    @TempValidate(STRING)
    xKey!: string;

    @TempValidate(STRING)
    yKey!: string;

    @TempValidate(STRING, { optional: true })
    colorKey?: string;

    @TempValidate(STRING, { optional: true })
    xName?: string;

    @TempValidate(STRING, { optional: true })
    yName?: string;

    @TempValidate(STRING, { optional: true })
    colorName?: string;

    @TempValidate(AND(COLOR_STRING_ARRAY, ARRAY.restrict({ minLength: 1 })))
    colorRange: string[] = ['black', 'black'];

    @TempValidate(COLOR_STRING, { optional: true })
    stroke: string = 'black';

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    strokeWidth: number = 0;

    @TempValidate(TEXT_ALIGN)
    textAlign: TextAlign = 'center';

    @TempValidate(VERTICAL_ALIGN)
    verticalAlign: VerticalAlign = 'middle';

    @TempValidate(POSITIVE_NUMBER)
    itemPadding: number = 0;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgHeatmapSeriesItemStylerParams<unknown>, AgHeatmapSeriesStyle>;

    @TempValidate(OBJECT)
    readonly label = new AutoSizedLabel<AgHeatmapSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgHeatmapSeriesTooltipRendererParams<any>>();
}
