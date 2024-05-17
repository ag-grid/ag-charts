import type {
    AgSankeySeriesFormatterParams,
    AgSankeySeriesLinkOptions,
    AgSankeySeriesLinkStyle,
    AgSankeySeriesNodeOptions,
    AgSankeySeriesOptions,
    AgSankeySeriesTooltipRendererParams,
} from '../../../options/series/flow-proportion/sankeyOptions';
import { BaseProperties } from '../../../util/properties';
import {
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
} from '../../../util/validation';
import { DEFAULT_FILLS, DEFAULT_STROKES } from '../../themes/defaultColors';
import { SeriesProperties } from '../seriesProperties';
import { SeriesTooltip } from '../seriesTooltip';
import type { SeriesNodeDatum } from '../seriesTypes';

export enum SankeyDatumType {
    Link,
    Node,
}
export interface SankeyLinkDatum extends SeriesNodeDatum {
    type: SankeyDatumType.Link;
    fromNode: SankeyNodeDatum;
    toNode: SankeyNodeDatum;
    size: number;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    height: number;
}

export interface SankeyNodeDatum extends SeriesNodeDatum {
    type: SankeyDatumType.Node;
    id: string;
    label: string | undefined;
    size: number;
    fill: string;
    stroke: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export type SankeyDatum = SankeyLinkDatum | SankeyNodeDatum;

export interface SankeyNodeLabelDatum {}

export class ChordSeriesLinkProperties extends BaseProperties<AgSankeySeriesLinkOptions> {
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

export class ChordSeriesNodeProperties extends BaseProperties<AgSankeySeriesNodeOptions> {
    @Validate(POSITIVE_NUMBER)
    spacing: number = 1;

    @Validate(POSITIVE_NUMBER)
    width: number = 1;

    @Validate(STRING)
    justify: 'left' | 'right' | 'center' | 'justify' = 'justify';

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
export class SankeySeriesProperties extends SeriesProperties<AgSankeySeriesOptions> {
    @Validate(STRING)
    fromIdKey: string = '';

    @Validate(STRING, { optional: true })
    fromIdName: string | undefined = undefined;

    @Validate(STRING)
    toIdKey: string = '';

    @Validate(STRING, { optional: true })
    toIdName: string | undefined = undefined;

    @Validate(STRING)
    nodeIdKey: string = '';

    @Validate(STRING, { optional: true })
    nodeIdName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    labelKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    labelName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    sizeKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    sizeName: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    nodeSizeKey: string | undefined = undefined;

    @Validate(STRING, { optional: true })
    nodeSizeName: string | undefined = undefined;

    @Validate(ARRAY, { optional: true })
    nodes: any[] | undefined = undefined;

    @Validate(COLOR_STRING_ARRAY)
    fills: string[] = Object.values(DEFAULT_FILLS);

    @Validate(COLOR_STRING_ARRAY)
    strokes: string[] = Object.values(DEFAULT_STROKES);

    @Validate(OBJECT)
    readonly link = new ChordSeriesLinkProperties();

    @Validate(OBJECT)
    readonly node = new ChordSeriesNodeProperties();

    @Validate(FUNCTION, { optional: true })
    formatter?: (params: AgSankeySeriesFormatterParams<any>) => AgSankeySeriesLinkStyle;

    @Validate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgSankeySeriesTooltipRendererParams>();
}
