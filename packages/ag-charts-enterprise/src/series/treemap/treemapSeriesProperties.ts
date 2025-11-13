import type {
    AgTreemapSeriesItemStylerParams,
    AgTreemapSeriesLabelFormatterParams,
    AgTreemapSeriesOptions,
    AgTreemapSeriesStyle,
    AgTreemapSeriesTooltipRendererParams,
    Styler,
    TextAlign,
    VerticalAlign,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { InternalAgColorType } from 'ag-charts-core';
import { BaseProperties, Property } from 'ag-charts-core';

import { AutoSizedLabel, AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

const { HierarchySeriesProperties, makeSeriesTooltip, Label } = _ModuleSupport;
class TreemapGroupLabel extends Label<AgTreemapSeriesLabelFormatterParams> {
    @Property
    spacing: number = 0;
}

class TreemapSeriesGroupHighlightStyle extends BaseProperties {
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
    opacity?: number;
}

class TreemapSeriesGroupHighlight extends BaseProperties {
    @Property
    readonly highlightedItem = new TreemapSeriesGroupHighlightStyle();

    @Property
    readonly unhighlightedItem = new TreemapSeriesGroupHighlightStyle();
}

class TreemapSeriesTileHighlightStyle extends BaseProperties {
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
    opacity?: number;
}

class TreemapSeriesTileHighlight extends BaseProperties {
    @Property
    readonly highlightedBranch = new TreemapSeriesTileHighlightStyle();

    @Property
    readonly highlightedItem = new TreemapSeriesTileHighlightStyle();

    @Property
    readonly unhighlightedItem = new TreemapSeriesTileHighlightStyle();

    @Property
    readonly unhighlightedBranch = new TreemapSeriesTileHighlightStyle();
}

class TreemapSeriesGroup extends BaseProperties {
    @Property
    fill: InternalAgColorType | undefined = undefined;

    @Property
    fillOpacity: number = 1;

    @Property
    stroke?: string;

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;

    @Property
    cornerRadius: number = 0;

    @Property
    textAlign: TextAlign = 'center';

    @Property
    gap: number = 0;

    @Property
    padding: number = 0;

    @Property
    interactive: boolean = true;

    @Property
    readonly label = new TreemapGroupLabel();

    @Property
    readonly highlight = new TreemapSeriesGroupHighlight();
}

class TreemapSeriesTile extends BaseProperties {
    @Property
    fill: InternalAgColorType | undefined = undefined;

    @Property
    fillOpacity: number = 1;

    @Property
    stroke?: string;

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;

    @Property
    cornerRadius: number = 0;

    @Property
    textAlign: TextAlign = 'center';

    @Property
    verticalAlign: VerticalAlign = 'middle';

    @Property
    gap: number = 0;

    @Property
    padding: number = 0;

    @Property
    readonly label = new AutoSizedLabel<AgTreemapSeriesLabelFormatterParams>();

    @Property
    readonly secondaryLabel = new AutoSizedSecondaryLabel<AgTreemapSeriesLabelFormatterParams>();

    @Property
    readonly highlight = new TreemapSeriesTileHighlight();
}

export class TreemapSeriesProperties extends HierarchySeriesProperties<AgTreemapSeriesOptions> {
    @Property
    sizeName?: string;

    @Property
    labelKey?: string;

    @Property
    secondaryLabelKey?: string;

    @Property
    itemStyler?: Styler<AgTreemapSeriesItemStylerParams<unknown>, AgTreemapSeriesStyle>;

    @Property
    readonly tooltip = makeSeriesTooltip<AgTreemapSeriesTooltipRendererParams<any>>();

    @Property
    readonly group = new TreemapSeriesGroup();

    @Property
    readonly tile = new TreemapSeriesTile();

    // We haven't decided how to expose this yet, but we need to have this property, so it can change between light and dark themes
    @Property
    undocumentedGroupFills: string[] = [];

    // We haven't decided how to expose this yet, but we need to have this property, so it can change between light and dark themes
    @Property
    undocumentedGroupStrokes: string[] = [];

    getStyle(
        isLeaf: boolean,
        fills: InternalAgColorType[],
        strokes: string[],
        index: number
    ): Required<AgTreemapSeriesStyle> & { opacity: number } {
        const {
            fillOpacity,
            strokeWidth,
            strokeOpacity,
            fill = isLeaf ? fills[index % fills.length] : fills[Math.min(index, fills.length)],
            stroke = isLeaf ? strokes[index % fills.length] : strokes[Math.min(index, strokes.length)],
        } = isLeaf ? this.tile : this.group;
        return {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            opacity: 1,
        };
    }
}
