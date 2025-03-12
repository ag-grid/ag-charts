import type {
    AgSunburstSeriesItemStylerParams,
    AgSunburstSeriesLabelFormatterParams,
    AgSunburstSeriesOptions,
    AgSunburstSeriesStyle,
    AgSunburstSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { AutoSizedLabel, AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

const {
    HierarchySeriesProperties,
    HighlightStyle,
    SeriesTooltip,
    TempValidate,
    COLOR_STRING,
    FUNCTION,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
} = _ModuleSupport;

class SunburstSeriesTileHighlightStyle extends HighlightStyle {
    @TempValidate(STRING, { optional: true })
    fill?: string;

    @TempValidate(RATIO, { optional: true })
    fillOpacity?: number;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number;

    @TempValidate(RATIO, { optional: true })
    strokeOpacity?: number;

    @TempValidate(OBJECT)
    readonly label = new AutoSizedLabel<AgSunburstSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly secondaryLabel = new AutoSizedLabel<AgSunburstSeriesLabelFormatterParams>();
}

export class SunburstSeriesProperties extends HierarchySeriesProperties<AgSunburstSeriesOptions> {
    @TempValidate(STRING, { optional: true })
    sizeName?: string;

    @TempValidate(STRING, { optional: true })
    labelKey?: string;

    @TempValidate(STRING, { optional: true })
    secondaryLabelKey?: string;

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 0;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(NUMBER, { optional: true })
    sectorSpacing?: number;

    @TempValidate(NUMBER, { optional: true })
    padding?: number;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgSunburstSeriesItemStylerParams<unknown>, AgSunburstSeriesStyle>;

    @TempValidate(OBJECT)
    override highlightStyle = new SunburstSeriesTileHighlightStyle();

    @TempValidate(OBJECT)
    readonly label = new AutoSizedLabel<AgSunburstSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly secondaryLabel = new AutoSizedSecondaryLabel<AgSunburstSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgSunburstSeriesTooltipRendererParams<any>>();
}
