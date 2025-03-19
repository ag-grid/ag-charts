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

import { AutoSizedLabel, AutoSizedSecondaryLabel } from '../util/autoSizedLabel';

const {
    BaseProperties,
    HierarchySeriesProperties,
    HighlightStyle,
    SeriesTooltip,
    TempValidate,
    BOOLEAN,
    COLOR_STRING,
    FUNCTION,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    STRING_ARRAY,
    TEXT_ALIGN,
    VERTICAL_ALIGN,
    COLOR_GRADIENT,
    COLOR_PATTERN,
    OR,
    Label,
} = _ModuleSupport;

class TreemapGroupLabel extends Label<AgTreemapSeriesLabelFormatterParams> {
    @TempValidate(NUMBER)
    spacing: number = 0;
}

class TreemapSeriesGroup extends BaseProperties {
    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING, COLOR_PATTERN), { optional: true })
    fill: _ModuleSupport.InternalAgColorType | undefined = undefined;

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string;

    @TempValidate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(TEXT_ALIGN)
    textAlign: TextAlign = 'center';

    @TempValidate(POSITIVE_NUMBER)
    gap: number = 0;

    @TempValidate(POSITIVE_NUMBER)
    padding: number = 0;

    @TempValidate(BOOLEAN)
    interactive: boolean = true;

    @TempValidate(OBJECT)
    readonly label = new TreemapGroupLabel();
}

class TreemapSeriesTile extends BaseProperties {
    @TempValidate(OR(COLOR_GRADIENT, COLOR_STRING, COLOR_PATTERN), { optional: true })
    fill: _ModuleSupport.InternalAgColorType | undefined = undefined;

    @TempValidate(RATIO)
    fillOpacity: number = 1;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    strokeWidth: number = 1;

    @TempValidate(RATIO)
    strokeOpacity: number = 1;

    @TempValidate(POSITIVE_NUMBER)
    cornerRadius: number = 0;

    @TempValidate(TEXT_ALIGN)
    textAlign: TextAlign = 'center';

    @TempValidate(VERTICAL_ALIGN)
    verticalAlign: VerticalAlign = 'middle';

    @TempValidate(POSITIVE_NUMBER)
    gap: number = 0;

    @TempValidate(POSITIVE_NUMBER)
    padding: number = 0;

    @TempValidate(OBJECT)
    readonly label = new AutoSizedLabel<AgTreemapSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly secondaryLabel = new AutoSizedSecondaryLabel<AgTreemapSeriesLabelFormatterParams>();
}

class TreemapSeriesGroupHighlightStyle extends BaseProperties {
    @TempValidate(STRING, { optional: true })
    fill?: string;

    @TempValidate(RATIO, { optional: true })
    fillOpacity?: number;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number;

    @TempValidate(RATIO, { optional: true })
    strokeOpacity?: number;

    @TempValidate(OBJECT)
    readonly label = new AutoSizedLabel<AgTreemapSeriesLabelFormatterParams>();
}

class TreemapSeriesTileHighlightStyle extends BaseProperties {
    @TempValidate(STRING, { optional: true })
    fill?: string;

    @TempValidate(RATIO, { optional: true })
    fillOpacity?: number;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number;

    @TempValidate(RATIO, { optional: true })
    strokeOpacity?: number;

    @TempValidate(OBJECT)
    readonly label = new AutoSizedLabel<AgTreemapSeriesLabelFormatterParams>();

    @TempValidate(OBJECT)
    readonly secondaryLabel = new AutoSizedSecondaryLabel<AgTreemapSeriesLabelFormatterParams>();
}

class TreemapSeriesHighlightStyle extends HighlightStyle {
    @TempValidate(OBJECT)
    readonly group = new TreemapSeriesGroupHighlightStyle();

    @TempValidate(OBJECT)
    readonly tile = new TreemapSeriesTileHighlightStyle();
}

export class TreemapSeriesProperties extends HierarchySeriesProperties<AgTreemapSeriesOptions> {
    @TempValidate(STRING, { optional: true })
    sizeName?: string;

    @TempValidate(STRING, { optional: true })
    labelKey?: string;

    @TempValidate(STRING, { optional: true })
    secondaryLabelKey?: string;

    @TempValidate(FUNCTION, { optional: true })
    itemStyler?: Styler<AgTreemapSeriesItemStylerParams<unknown>, AgTreemapSeriesStyle>;

    @TempValidate(OBJECT)
    override readonly highlightStyle = new TreemapSeriesHighlightStyle();

    @TempValidate(OBJECT)
    readonly tooltip = new SeriesTooltip<AgTreemapSeriesTooltipRendererParams<any>>();

    @TempValidate(OBJECT)
    readonly group = new TreemapSeriesGroup();

    @TempValidate(OBJECT)
    readonly tile = new TreemapSeriesTile();

    // We haven't decided how to expose this yet, but we need to have this property, so it can change between light and dark themes
    @TempValidate(STRING_ARRAY)
    undocumentedGroupFills: string[] = [];

    // We haven't decided how to expose this yet, but we need to have this property, so it can change between light and dark themes
    @TempValidate(STRING_ARRAY)
    undocumentedGroupStrokes: string[] = [];
}
