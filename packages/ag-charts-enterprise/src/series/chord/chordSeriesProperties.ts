import {
    type AgChordSeriesLabelFormatterParams,
    type AgChordSeriesLinkItemStylerParams,
    type AgChordSeriesLinkStyle,
    type AgChordSeriesNodeItemStylerParams,
    type AgChordSeriesNodeStyle,
    type AgChordSeriesOptions,
    type AgChordSeriesTooltipRendererParams,
    type Styler,
    _ModuleSupport,
} from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';

const {
    FillGradientDefaults,
    FillPatternDefaults,
    BaseProperties,
    SeriesTooltip,
    SeriesProperties,
    ARRAY,
    ARRAY_OF,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    OR,
    COLOR_GRADIENT,
    TempValidate,
    COLOR_PATTERN,
    Label,
} = _ModuleSupport;

class ChordSeriesLabelProperties extends Label<AgChordSeriesLabelFormatterParams> {
    @TempValidate(POSITIVE_NUMBER)
    spacing: number = 1;

    @TempValidate(POSITIVE_NUMBER)
    maxWidth: number = 1;
}

class ChordSeriesLinkProperties extends BaseProperties<AgChordSeriesOptions> {
    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING, COLOR_PATTERN), { optional: true })
    fill: InternalAgColorType | undefined = undefined;

    @TempValidate(RATIO)
    fillOpacity = 1;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke: string | undefined = undefined;

    @TempValidate(RATIO)
    strokeOpacity = 1;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(RATIO)
    tension = 0;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgChordSeriesLinkItemStylerParams<unknown>, AgChordSeriesLinkStyle>;
}

class ChordSeriesNodeProperties extends BaseProperties<AgChordSeriesOptions> {
    @TempValidate(POSITIVE_NUMBER)
    spacing: number = 1;

    @TempValidate(POSITIVE_NUMBER)
    width: number = 1;

    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING, COLOR_PATTERN), { optional: true })
    fill: InternalAgColorType | undefined = undefined;

    @TempValidate(RATIO)
    fillOpacity = 1;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke: string | undefined = undefined;

    @TempValidate(RATIO)
    strokeOpacity = 1;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(LINE_DASH)
    lineDash: number[] = [0];

    @TempValidate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgChordSeriesNodeItemStylerParams<unknown>, AgChordSeriesNodeStyle>;
}

export class ChordSeriesProperties extends SeriesProperties<AgChordSeriesOptions> {
    @TempValidate(STRING)
    fromKey!: string;

    @TempValidate(STRING)
    toKey!: string;

    @TempValidate(STRING)
    idKey: string = '';

    @TempValidate(STRING, { optional: true })
    idName: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    labelKey: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    labelName: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    sizeKey: string | undefined = undefined;

    @TempValidate(STRING, { optional: true })
    sizeName: string | undefined = undefined;

    @TempValidate(ARRAY, { optional: true })
    nodes: any[] | undefined = undefined;

    @TempValidate(OBJECT)
    readonly fillGradientDefaults = new FillGradientDefaults();

    @TempValidate(OBJECT)
    readonly fillPatternDefaults = new FillPatternDefaults();

    @TempValidate(ARRAY_OF(OR(COLOR_GRADIENT, COLOR_STRING, COLOR_PATTERN)))
    fills: InternalAgColorType[] = [];

    @TempValidate(COLOR_STRING_ARRAY)
    strokes: string[] = [];

    @TempValidate(OBJECT)
    readonly label = new ChordSeriesLabelProperties();

    @TempValidate(OBJECT)
    readonly link = new ChordSeriesLinkProperties();

    @TempValidate(OBJECT)
    readonly node = new ChordSeriesNodeProperties();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgChordSeriesTooltipRendererParams<any>>();
}
