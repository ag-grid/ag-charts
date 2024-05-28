import {
    type AgChordSeriesFormatterParams,
    type AgChordSeriesLabelFormatterParams,
    type AgChordSeriesLinkStyle,
    type AgChordSeriesOptions,
    type AgChordSeriesTooltipRendererParams,
    _ModuleSupport,
    _Scene,
} from 'ag-charts-community';

const {
    BaseProperties,
    SeriesTooltip,
    SeriesProperties,
    ARRAY,
    COLOR_STRING,
    COLOR_STRING_ARRAY,
    FUNCTION,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} = _ModuleSupport;
const { Label } = _Scene;

export class SankeySeriesLabelProperties extends Label<AgChordSeriesLabelFormatterParams> {
    @Validate(POSITIVE_NUMBER)
    spacing: number = 1;

    @Validate(POSITIVE_NUMBER)
    maxWidth: number = 1;
}

export class ChordSeriesLinkProperties extends BaseProperties<AgChordSeriesOptions> {
    @Validate(COLOR_STRING, { optional: true })
    fill: string | undefined = undefined;

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(COLOR_STRING, { optional: true })
    stroke: string | undefined = undefined;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

export class ChordSeriesNodeProperties extends BaseProperties<AgChordSeriesOptions> {
    @Validate(POSITIVE_NUMBER)
    spacing: number = 1;

    @Validate(POSITIVE_NUMBER)
    width: number = 1;

    @Validate(COLOR_STRING, { optional: true })
    fill: string | undefined = undefined;

    @Validate(RATIO)
    fillOpacity = 1;

    @Validate(COLOR_STRING, { optional: true })
    stroke: string | undefined = undefined;

    @Validate(RATIO)
    strokeOpacity = 1;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(POSITIVE_NUMBER)
    lineDashOffset: number = 0;
}

export class ChordSeriesProperties extends SeriesProperties<AgChordSeriesOptions> {
    @Validate(STRING)
    fromKey!: string;

    @Validate(STRING)
    toKey!: string;

    @Validate(STRING)
    idKey: string = '';

    @Validate(STRING, { optional: true })
    idName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    labelKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    labelName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    sizeKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    sizeName: string | undefined = undefined;

    @Validate(ARRAY, { optional: true })
    nodes: any[] | undefined = undefined;

    @Validate(COLOR_STRING_ARRAY)
    fills: string[] = [];

    @Validate(COLOR_STRING_ARRAY)
    strokes: string[] = [];

    @Validate(OBJECT)
    readonly label = new SankeySeriesLabelProperties();

    @Validate(OBJECT)
    readonly link = new ChordSeriesLinkProperties();

    @Validate(OBJECT)
    readonly node = new ChordSeriesNodeProperties();

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgChordSeriesFormatterParams<any>) => AgChordSeriesLinkStyle;

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgChordSeriesTooltipRendererParams>();
}
