import type {
    AgSunburstSeriesItemStylerParams,
    AgSunburstSeriesLabelFormatterParams,
    AgSunburstSeriesOptions,
    AgSunburstSeriesStyle,
    AgSunburstSeriesTooltipRendererParams,
    Styler,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { Property } from 'ag-charts-core';
import { AutoSizedLabel, AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

const { HierarchySeriesProperties, HighlightStyle, makeSeriesTooltip } = _ModuleSupport;
class SunburstSeriesTileHighlightStyle extends HighlightStyle {
    @Property
    fill?: string;

    @Property
    fillOpacity?: number;

    @Property
    stroke?: string;

    @Property
    strokeWidth?: number;

    @Property
    strokeOpacity?: number;

    @Property
    readonly label = new AutoSizedLabel<AgSunburstSeriesLabelFormatterParams>();

    @Property
    readonly secondaryLabel = new AutoSizedLabel<AgSunburstSeriesLabelFormatterParams>();
}

export class SunburstSeriesProperties extends HierarchySeriesProperties<AgSunburstSeriesOptions> {
    @Property
    sizeName?: string;

    @Property
    labelKey?: string;

    @Property
    secondaryLabelKey?: string;

    @Property
    fillOpacity: number = 1;

    @Property
    strokeWidth: number = 0;

    @Property
    strokeOpacity: number = 1;

    @Property
    cornerRadius: number = 0;

    @Property
    sectorSpacing?: number;

    @Property
    padding?: number;

    @Property
    itemStyler?: Styler<AgSunburstSeriesItemStylerParams<unknown>, AgSunburstSeriesStyle>;

    @Property
    highlightStyle = new SunburstSeriesTileHighlightStyle();

    @Property
    readonly label = new AutoSizedLabel<AgSunburstSeriesLabelFormatterParams>();

    @Property
    readonly secondaryLabel = new AutoSizedSecondaryLabel<AgSunburstSeriesLabelFormatterParams>();

    @Property
    readonly tooltip = makeSeriesTooltip<AgSunburstSeriesTooltipRendererParams<any>>();

    getStyle(index: number): Required<AgSunburstSeriesStyle> & { opacity: number } {
        const { fills, strokes, fillOpacity, strokeWidth, strokeOpacity } = this;
        return {
            fill: fills[index % fills.length],
            fillOpacity,
            stroke: strokes[index % strokes.length],
            strokeWidth,
            strokeOpacity,
            opacity: 1,
        };
    }
}
