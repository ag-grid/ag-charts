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

import { AutoSizedLabel, AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

const { BaseProperties, HierarchySeriesProperties, HighlightStyle, SeriesTooltip, Property, Label } = _ModuleSupport;

class TreemapGroupLabel extends Label<AgTreemapSeriesLabelFormatterParams<unknown>> {
    @Property
    spacing: number = 0;
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
    readonly label = new AutoSizedLabel<AgTreemapSeriesLabelFormatterParams<unknown>>();

    @Property
    readonly secondaryLabel = new AutoSizedSecondaryLabel<AgTreemapSeriesLabelFormatterParams<unknown>>();
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
    readonly label = new AutoSizedLabel<AgTreemapSeriesLabelFormatterParams<unknown>>();
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
    readonly label = new AutoSizedLabel<AgTreemapSeriesLabelFormatterParams<unknown>>();

    @Property
    readonly secondaryLabel = new AutoSizedSecondaryLabel<AgTreemapSeriesLabelFormatterParams<unknown>>();
}

class TreemapSeriesHighlightStyle extends HighlightStyle {
    @Property
    readonly group = new TreemapSeriesGroupHighlightStyle();

    @Property
    readonly tile = new TreemapSeriesTileHighlightStyle();
}

export class TreemapSeriesProperties extends HierarchySeriesProperties<AgTreemapSeriesOptions<unknown>> {
    @Property
    sizeName?: string;

    @Property
    labelKey?: string;

    @Property
    secondaryLabelKey?: string;

    @Property
    itemStyler?: Styler<AgTreemapSeriesItemStylerParams<unknown>, AgTreemapSeriesStyle>;

    @Property
    override readonly highlightStyle = new TreemapSeriesHighlightStyle();

    @Property
    readonly tooltip = new SeriesTooltip<AgTreemapSeriesTooltipRendererParams<any>>();

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
}
