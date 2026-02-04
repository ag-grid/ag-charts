import type {
    ColorSpace,
    InternalAgColorType,
    RequiredInternalAgGradientColor,
    RequiredInternalAgImageFill,
    RequiredInternalAgPatternColor,
} from 'ag-charts-core';
import { BaseProperties, PropertiesArray, Property, mergeDefaults } from 'ag-charts-core';
import type {
    AgColorRepeat,
    AgColorType,
    AgGradientColorBounds,
    AgGradientColorStop,
    AgGradientType,
    AgImageFillFit,
    AgPatternName,
    AgSeriesSegmentation,
    AgSeriesShapeSegmentOptions,
    CssColor,
    InteractionRange,
    Opacity,
    PixelSize,
    HighlightState as PublicHighlightState,
} from 'ag-charts-types';

import type { SeriesTooltip } from './seriesTooltip';

export enum HighlightState {
    None,
    Item,
    Series,
    OtherSeries,
    OtherItem,
}

export const highlightStates = [
    HighlightState.None,
    HighlightState.Item,
    HighlightState.Series,
    HighlightState.OtherSeries,
    HighlightState.OtherItem,
];

export type HighlightStyleOptionKey =
    | 'highlightedItem'
    | 'unhighlightedItem'
    | 'highlightedSeries'
    | 'unhighlightedSeries';

export function getHighlightStyleOptionKeys(highlightState: HighlightState): HighlightStyleOptionKey[] {
    switch (highlightState) {
        case HighlightState.Item:
            return ['highlightedItem', 'highlightedSeries'];
        case HighlightState.OtherItem:
            return ['unhighlightedItem', 'highlightedSeries'];
        case HighlightState.Series:
            return ['highlightedSeries'];
        case HighlightState.OtherSeries:
            return ['unhighlightedSeries'];
        case HighlightState.None:
            return [];
    }
}

type HighlightMixins = {
    fill: AgColorType;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    opacity: number;
};

export function toHighlightString(state: HighlightState): PublicHighlightState {
    const unreachable = (a: never): never => a;
    switch (state) {
        case HighlightState.Item:
            return 'highlighted-item';
        case HighlightState.OtherItem:
            return 'unhighlighted-item';
        case HighlightState.Series:
            return 'highlighted-series';
        case HighlightState.OtherSeries:
            return 'unhighlighted-series';
        case HighlightState.None:
            return 'none';
        default:
            return unreachable(state);
    }
}

type HighlightOptions<TOpts extends object> = Partial<TOpts & HighlightMixins>;

export class SeriesItemHighlightStyle extends BaseProperties {
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
    lineDash?: number[];

    @Property
    lineDashOffset?: number;
}

export class HighlightProperties<TOpts extends object> extends BaseProperties {
    @Property
    enabled = true;

    @Property
    range: 'tooltip' | 'node' = 'tooltip';

    @Property
    bringToFront: boolean = true;

    @Property
    readonly highlightedItem: HighlightOptions<TOpts> = {};

    @Property
    readonly unhighlightedItem: HighlightOptions<TOpts> = {};

    @Property
    readonly highlightedSeries: HighlightOptions<TOpts> = {};

    @Property
    readonly unhighlightedSeries: HighlightOptions<TOpts> = {};

    getStyle(highlightState: HighlightState): HighlightOptions<TOpts> {
        const keys = getHighlightStyleOptionKeys(highlightState);
        if (keys.length === 0) return {};
        return mergeDefaults<HighlightOptions<TOpts>>(...keys.map((key) => this[key]));
    }
}

export class SegmentOptions extends BaseProperties implements AgSeriesShapeSegmentOptions {
    @Property
    start?: number;

    @Property
    stop?: number;

    @Property
    fill: InternalAgColorType = '#c16068';

    @Property
    fillOpacity = 1;

    @Property
    stroke: string = '#874349';

    @Property
    strokeWidth = 2;

    @Property
    strokeOpacity = 1;

    @Property
    lineDash: number[] = [0];

    @Property
    lineDashOffset: number = 0;
}

export class Segmentation implements AgSeriesSegmentation {
    @Property
    enabled?: boolean;

    @Property
    key: 'x' | 'y' = 'x';

    @Property
    segments = new PropertiesArray<SegmentOptions>(SegmentOptions);
}

export class FillGradientDefaults
    extends BaseProperties<RequiredInternalAgGradientColor>
    implements RequiredInternalAgGradientColor
{
    @Property
    type: 'gradient' = 'gradient' as const;

    @Property
    colorStops: AgGradientColorStop[] = [];

    @Property
    bounds: AgGradientColorBounds = 'item';

    @Property
    gradient: AgGradientType = 'linear';

    @Property
    rotation: number = 0;

    @Property
    reverse: boolean = false;

    @Property
    colorSpace: ColorSpace = 'rgb';
}

export class FillPatternDefaults
    extends BaseProperties<RequiredInternalAgPatternColor>
    implements RequiredInternalAgPatternColor
{
    @Property
    type: 'pattern' = 'pattern' as const;

    @Property
    colorStops: AgGradientColorStop[] = [];

    @Property
    bounds: AgGradientColorBounds = 'item';

    @Property
    gradient: AgGradientType = 'linear';

    @Property
    rotation: number = 0;

    @Property
    scale: number = 1;

    @Property
    reverse: boolean = false;

    @Property
    path?: string;

    @Property
    pattern: AgPatternName = 'forward-slanted-lines';

    @Property
    width: number = 26;

    @Property
    height: number = 26;

    @Property
    padding: number = 6;

    @Property
    fill: CssColor = 'black';

    @Property
    fillOpacity: Opacity = 1;

    @Property
    backgroundFill: CssColor = 'white';

    @Property
    backgroundFillOpacity: Opacity = 1;

    @Property
    stroke: CssColor = 'black';

    @Property
    strokeOpacity: number = 1;

    @Property
    strokeWidth: PixelSize = 0;
}

export class FillImageDefaults
    extends BaseProperties<RequiredInternalAgImageFill>
    implements RequiredInternalAgImageFill
{
    @Property
    type: 'image' = 'image' as const;

    @Property
    url: string = '';

    @Property
    rotation: number = 0;

    @Property
    scale: number = 1;

    @Property
    backgroundFill: CssColor = 'black';

    @Property
    backgroundFillOpacity: Opacity = 1;

    @Property
    repeat: AgColorRepeat = 'no-repeat';

    @Property
    fit: AgImageFillFit = 'contain';
}

export abstract class SeriesProperties<T extends object> extends BaseProperties<T> {
    @Property
    id?: string;

    // Private - use series.visible
    @Property
    protected readonly visible: boolean = true;

    @Property
    focusPriority?: number = Infinity;

    @Property
    showInLegend: boolean = true;

    @Property
    cursor = 'default';

    @Property
    nodeClickRange: InteractionRange = 'exact';

    @Property
    readonly highlight: HighlightProperties<T> = new HighlightProperties();

    abstract tooltip: SeriesTooltip<never>;

    // User pass-through option: no validation-decorator required.
    context?: unknown;

    // Internal option to allow null values as discrete keys (undocumented).
    allowNullKeys?: boolean;

    override handleUnknownProperties(unknownKeys: Set<unknown>, properties: T) {
        if ('context' in properties) {
            this.context = properties.context;
            unknownKeys.delete('context');
        }
        if ('allowNullKeys' in properties) {
            this.allowNullKeys = (properties as { allowNullKeys?: boolean }).allowNullKeys;
            unknownKeys.delete('allowNullKeys');
        }
    }
}
