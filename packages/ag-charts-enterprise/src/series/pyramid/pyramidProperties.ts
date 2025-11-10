import type {
    AgColorType,
    AgPyramidSeriesItemStylerParams,
    AgPyramidSeriesLabelFormatterParams,
    AgPyramidSeriesOptions,
    AgPyramidSeriesStyle,
    AgPyramidSeriesTooltipRendererParams,
    Direction,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { Property } from 'ag-charts-core';
const { SeriesProperties, makeSeriesTooltip, Label, DropShadow } = _ModuleSupport;
class PyramidSeriesLabel extends Label<AgPyramidSeriesLabelFormatterParams> {}

class PyramidSeriesStageLabel extends Label<AgPyramidSeriesLabelFormatterParams> {
    @Property
    spacing: number = 0;

    @Property
    placement?: string;
}

export class PyramidProperties extends SeriesProperties<AgPyramidSeriesOptions> {
    @Property
    stageKey!: string;

    @Property
    valueKey!: string;

    @Property
    fills: AgColorType[] = [];

    @Property
    fillOpacity: number = 1;

    @Property
    strokes: string[] = [];

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;

    @Property
    direction: Direction = 'vertical';

    @Property
    reverse?: boolean = undefined;

    @Property
    spacing: number = 0;

    @Property
    aspectRatio?: number = undefined;

    @Property
    itemStyler?: Styler<AgPyramidSeriesItemStylerParams<unknown>, AgPyramidSeriesStyle>;

    @Property
    readonly shadow = new DropShadow().set({ enabled: false });

    @Property
    readonly label = new PyramidSeriesLabel();

    @Property
    readonly stageLabel = new PyramidSeriesStageLabel();

    @Property
    readonly tooltip = makeSeriesTooltip<AgPyramidSeriesTooltipRendererParams<unknown>>();

    getStyle(index: number = 0): Required<AgPyramidSeriesStyle> & { opacity: number } {
        const { fills, strokes, fillOpacity, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this;
        return {
            fill: fills[index % fills.length],
            fillOpacity,
            stroke: strokes[index % strokes.length],
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            opacity: 1,
        };
    }
}
