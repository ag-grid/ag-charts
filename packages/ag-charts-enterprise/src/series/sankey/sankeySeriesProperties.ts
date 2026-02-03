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
    type DatumDefault,
    type Styler,
    _ModuleSupport,
} from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';
import { BaseProperties, Property } from 'ag-charts-core';

import type { FlowProportionNodeDatumIndex } from '../flow-proportion/flowDatumIndex';
import type { FlowProportionLinkDatum, FlowProportionNodeDatum } from '../flow-proportion/flowProportionSeries';

const { FillGradientDefaults, FillPatternDefaults, FillImageDefaults, makeSeriesTooltip, SeriesProperties, Label } =
    _ModuleSupport;

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
    elbows: { x: number; y: number }[];
}

export type SankeyDatum = SankeyLinkDatum | SankeyNodeDatum;

export interface SankeyNodeLabelDatum {
    x: number;
    y: number;
    textAlign: 'left' | 'right' | 'center';
    text: string;
    size: number;
    nodeDatum: SankeyNodeDatum;
    datumIndex: FlowProportionNodeDatumIndex;
}

class SankeySeriesLabelProperties extends Label<AgSankeySeriesLabelFormatterParams> {
    @Property
    spacing: number = 1;

    @Property
    placement: 'left' | 'right' | 'center' | undefined = undefined;

    @Property
    edgePlacement: 'inside' | 'outside' | undefined = undefined;
}

class SankeySeriesLinkProperties extends BaseProperties<AgSankeySeriesLinkOptions<any>> {
    @Property
    fill: InternalAgColorType | undefined = undefined;

    @Property
    fillOpacity = 1;

    @Property
    stroke: string | undefined = undefined;

    @Property
    strokeOpacity = 1;

    @Property
    strokeWidth: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    itemStyler?: Styler<AgSankeySeriesLinkItemStylerParams<unknown>, AgSankeySeriesLinkStyle>;
}

class SankeySeriesNodeProperties extends BaseProperties<AgSankeySeriesNodeOptions<any>> {
    @Property
    spacing: number = 1;

    @Property
    minSpacing: number = 0;

    @Property
    width: number = 1;

    @Property
    alignment: 'left' | 'right' | 'center' | 'justify' = 'justify';

    @Property
    verticalAlignment: 'top' | 'bottom' | 'center' = 'center';

    @Property
    sort: 'data' | 'ascending' | 'descending' | 'auto' = 'auto';

    @Property
    fill: InternalAgColorType | undefined = undefined;

    @Property
    fillOpacity = 1;

    @Property
    stroke: string | undefined = undefined;

    @Property
    strokeOpacity = 1;

    @Property
    strokeWidth: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    itemStyler?: Styler<AgSankeySeriesNodeItemStylerParams<unknown>, AgSankeySeriesNodeStyle>;
}

export class SankeySeriesProperties extends SeriesProperties<AgSankeySeriesOptions> {
    @Property
    nodes: any[] | undefined = undefined;

    @Property
    fromKey!: string;

    @Property
    toKey!: string;

    @Property
    idKey: string = '';

    @Property
    idName: string | undefined = undefined;

    @Property
    labelKey: string | undefined = undefined;

    @Property
    labelName: string | undefined = undefined;

    @Property
    sizeKey: string | undefined = undefined;

    @Property
    sizeName: string | undefined = undefined;

    @Property
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

    @Property
    readonly fillImageDefaults = new FillImageDefaults();

    @Property
    defaultColorRange: string[][] = [];

    @Property
    defaultPatternFills: string[] = [];

    @Property
    fills: InternalAgColorType[] = [];

    @Property
    strokes: string[] = [];

    @Property
    readonly label = new SankeySeriesLabelProperties();

    @Property
    readonly link = new SankeySeriesLinkProperties();

    @Property
    readonly node = new SankeySeriesNodeProperties();

    @Property
    readonly tooltip = makeSeriesTooltip<AgSankeySeriesTooltipRendererParams<DatumDefault>>();

    getStyle(
        isLink: boolean,
        fills: InternalAgColorType[],
        strokes: string[],
        index: number
    ): Required<AgSankeySeriesLinkStyle> | Required<AgSankeySeriesNodeStyle> {
        const {
            fillOpacity,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            fill = fills[index % fills.length],
            stroke = strokes[index % fills.length],
        } = isLink ? this.link : this.node;
        return {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        };
    }
}
