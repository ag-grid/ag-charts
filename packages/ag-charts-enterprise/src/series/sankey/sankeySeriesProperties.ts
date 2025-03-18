import {
    type AgColorType,
    type AgGradientColor,
    type AgSankeySeriesLabelFormatterParams,
    type AgSankeySeriesLinkItemStylerParams,
    type AgSankeySeriesLinkOptions,
    type AgSankeySeriesLinkStyle,
    type AgSankeySeriesNodeItemStylerParams,
    type AgSankeySeriesNodeOptions,
    type AgSankeySeriesNodeStyle,
    type AgSankeySeriesOptions,
    type AgSankeySeriesTooltipRendererParams,
    type Styler,
    _ModuleSupport,
} from 'ag-charts-community';

import type { FlowProportionLinkDatum, FlowProportionNodeDatum } from '../flow-proportion/flowProportionSeries';

const {
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
    OR,
    COLOR_GRADIENT,
    RATIO,
    STRING,
    UNION,
    TempValidate,
    Label,
} = _ModuleSupport;

const ALIGNMENT = UNION(['left', 'right', 'center', 'justify'], 'a justification value');

export interface SankeyNodeDatum extends FlowProportionNodeDatum<SankeyNodeDatum, SankeyLinkDatum> {
    size: number;
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface SankeyLinkDatum extends FlowProportionLinkDatum<SankeyNodeDatum, SankeyLinkDatum> {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    height: number;
}

export type SankeyDatum = SankeyLinkDatum | SankeyNodeDatum;

export interface SankeyNodeLabelDatum {
    x: number;
    y: number;
    leading: boolean;
    text: string;
}

class SankeySeriesLabelProperties extends Label<AgSankeySeriesLabelFormatterParams> {
    @TempValidate(POSITIVE_NUMBER)
    spacing: number = 1;
}

class SankeySeriesLinkProperties extends BaseProperties<AgSankeySeriesLinkOptions<any>> {
    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING), { optional: true })
    fill: AgColorType | undefined = undefined;

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
    itemStyler?: Styler<AgSankeySeriesLinkItemStylerParams<unknown>, AgSankeySeriesLinkStyle>;
}

class SankeySeriesNodeProperties extends BaseProperties<AgSankeySeriesNodeOptions<any>> {
    @TempValidate(POSITIVE_NUMBER)
    spacing: number = 1;

    @TempValidate(POSITIVE_NUMBER)
    width: number = 1;

    @TempValidate(ALIGNMENT)
    alignment: 'left' | 'right' | 'center' | 'justify' = 'justify';

    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING), { optional: true })
    fill: AgColorType | undefined = undefined;

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
    itemStyler?: Styler<AgSankeySeriesNodeItemStylerParams<unknown>, AgSankeySeriesNodeStyle>;
}

export class SankeySeriesProperties extends SeriesProperties<AgSankeySeriesOptions> {
    @TempValidate(ARRAY, { optional: true })
    nodes: any[] | undefined = undefined;

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

    @TempValidate(COLOR_GRADIENT)
    fillGradientDefaults!: Required<AgGradientColor>;

    @TempValidate(ARRAY_OF(OR(COLOR_GRADIENT, COLOR_STRING)))
    fills: AgColorType[] = [];

    @TempValidate(COLOR_STRING_ARRAY)
    strokes: string[] = [];

    @TempValidate(OBJECT)
    readonly label = new SankeySeriesLabelProperties();

    @TempValidate(OBJECT)
    readonly link = new SankeySeriesLinkProperties();

    @TempValidate(OBJECT)
    readonly node = new SankeySeriesNodeProperties();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgSankeySeriesTooltipRendererParams<any>>();
}
