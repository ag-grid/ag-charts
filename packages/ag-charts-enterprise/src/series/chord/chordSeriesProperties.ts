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
import { BaseProperties, Property } from 'ag-charts-core';

const { FillGradientDefaults, FillPatternDefaults, FillImageDefaults, makeSeriesTooltip, SeriesProperties, Label } =
    _ModuleSupport;

class ChordSeriesLabelProperties extends Label<AgChordSeriesLabelFormatterParams> {
    @Property
    spacing: number = 1;

    @Property
    maxWidth: number = 1;
}

class ChordSeriesLinkProperties extends BaseProperties<AgChordSeriesOptions> {
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
    tension = 0;

    @Property
    itemStyler?: Styler<AgChordSeriesLinkItemStylerParams<unknown>, AgChordSeriesLinkStyle>;

    getStyle(fills: InternalAgColorType[], strokes: string[], index: number): Required<AgChordSeriesLinkStyle> {
        const { fillOpacity, strokeWidth, strokeOpacity, lineDash, lineDashOffset, tension } = this;
        const fill = this.fill ?? fills[index % fills.length];
        const stroke = this.stroke ?? strokes[index % fills.length];
        return {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            tension,
        };
    }
}

class ChordSeriesNodeProperties extends BaseProperties<AgChordSeriesOptions> {
    @Property
    spacing: number = 1;

    @Property
    width: number = 1;

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
    itemStyler?: Styler<AgChordSeriesNodeItemStylerParams<unknown>, AgChordSeriesNodeStyle>;

    getStyle(fills: InternalAgColorType[], strokes: string[], index: number): Required<AgChordSeriesNodeStyle> {
        const { fillOpacity, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this;
        const fill = this.fill ?? fills[index % fills.length];
        const stroke = this.stroke ?? strokes[index % fills.length];
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

export class ChordSeriesProperties extends SeriesProperties<AgChordSeriesOptions> {
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
    nodes: any[] | undefined = undefined;

    @Property
    readonly fillGradientDefaults = new FillGradientDefaults();

    @Property
    readonly fillPatternDefaults = new FillPatternDefaults();

    @Property
    readonly fillImageDefaults = new FillImageDefaults();

    @Property
    fills: InternalAgColorType[] = [];

    @Property
    strokes: string[] = [];

    @Property
    readonly label = new ChordSeriesLabelProperties();

    @Property
    readonly link = new ChordSeriesLinkProperties();

    @Property
    readonly node = new ChordSeriesNodeProperties();

    @Property
    readonly tooltip = makeSeriesTooltip<AgChordSeriesTooltipRendererParams<any>>();
}
