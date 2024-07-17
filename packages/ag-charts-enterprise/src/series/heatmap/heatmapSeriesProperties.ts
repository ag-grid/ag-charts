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
    Validate,
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
    @Validate(STRING, { optional: true })
    title?: string;

    @Validate(STRING)
    xKey!: string;

    @Validate(STRING)
    yKey!: string;

    @Validate(STRING, { optional: true })
    colorKey?: string;

    @Validate(STRING, { optional: true })
    xName?: string;

    @Validate(STRING, { optional: true })
    yName?: string;

    @Validate(STRING, { optional: true })
    colorName?: string;

    @Validate(AND(COLOR_STRING_ARRAY, ARRAY.restrict({ minLength: 1 })))
    colorRange: string[] = ['black', 'black'];

    @Validate(COLOR_STRING, { optional: true })
    stroke: string = 'black';

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number;

    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth: number = 0;

    @Validate(TEXT_ALIGN)
    textAlign: TextAlign = 'center';

    @Validate(VERTICAL_ALIGN)
    verticalAlign: VerticalAlign = 'middle';

    @Validate(POSITIVE_NUMBER)
    itemPadding: number = 0;

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgHeatmapSeriesItemStylerParams<unknown>, AgHeatmapSeriesStyle>;

    @Validate(OBJECT)
    readonly label = new AutoSizedLabel<AgHeatmapSeriesLabelFormatterParams>();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgHeatmapSeriesTooltipRendererParams<any>>();
}
