import {
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
    _Scene,
    _Util,
} from 'ag-charts-community';

import type { FlowProportionLinkDatum, FlowProportionNodeDatum } from '../flow-proportion/flowProportionSeries';

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
    UNION,
    Validate,
} = _ModuleSupport;
const { Label } = _Scene;

const ALIGNMENT = UNION(['left', 'right', 'center', 'justify'], 'a justification value');

export interface SankeyNodeDatum extends FlowProportionNodeDatum {
    size: number;
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface SankeyLinkDatum extends FlowProportionLinkDatum<SankeyNodeDatum> {
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

export class SankeySeriesLabelProperties extends Label<AgSankeySeriesLabelFormatterParams> {
    @Validate(POSITIVE_NUMBER)
    spacing: number = 1;
}

export class SankeySeriesLinkProperties extends BaseProperties<AgSankeySeriesLinkOptions> {
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

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgSankeySeriesLinkItemStylerParams<unknown>, AgSankeySeriesLinkStyle>;
}

export class SankeySeriesNodeProperties extends BaseProperties<AgSankeySeriesNodeOptions> {
    @Validate(POSITIVE_NUMBER)
    spacing: number = 1;

    @Validate(POSITIVE_NUMBER)
    width: number = 1;

    @Validate(ALIGNMENT)
    alignment: 'left' | 'right' | 'center' | 'justify' = 'justify';

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

    @Validate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgSankeySeriesNodeItemStylerParams<unknown>, AgSankeySeriesNodeStyle>;
}
export class SankeySeriesProperties extends SeriesProperties<AgSankeySeriesOptions> {
    @Validate(ARRAY, { optional: true })
    nodes: any[] | undefined = undefined;

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

    @Validate(COLOR_STRING_ARRAY)
    fills: string[] = [];

    @Validate(COLOR_STRING_ARRAY)
    strokes: string[] = [];

    @Validate(OBJECT)
    readonly label = new SankeySeriesLabelProperties();

    @Validate(OBJECT)
    readonly link = new SankeySeriesLinkProperties();

    @Validate(OBJECT)
    readonly node = new SankeySeriesNodeProperties();

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgSankeySeriesTooltipRendererParams<any>>();
}
