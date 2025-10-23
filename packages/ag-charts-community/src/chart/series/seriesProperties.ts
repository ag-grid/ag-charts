import {
    type ColorSpace,
    type InternalAgColorType,
    type RequiredInternalAgGradientColor,
    type RequiredInternalAgImageFill,
    type RequiredInternalAgPatternColor,
} from 'ag-charts-core';
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

import { mergeDefaults } from '../../util/object';
import { BaseProperties, PropertiesArray, Property } from '../../util/properties';
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
    bringToFront: boolean = false;

    @Property
    readonly highlightedItem: HighlightOptions<TOpts> = {};

    @Property
    readonly unhighlightedItem: HighlightOptions<TOpts> = {};

    @Property
    readonly highlightedSeries: HighlightOptions<TOpts> = {};

    @Property
    readonly unhighlightedSeries: HighlightOptions<TOpts> = {};

    private getItemHighlightStyle(highlightState: HighlightState): HighlightOptions<TOpts> | undefined {
        switch (highlightState) {
            case HighlightState.Item:
                return this.highlightedItem;
            case HighlightState.OtherItem:
                return this.unhighlightedItem;
            case HighlightState.Series:
                return this.highlightedSeries;
            case HighlightState.OtherSeries:
                return this.unhighlightedSeries;
        }
    }

    private getSeriesHighlightStyle(highlightState: HighlightState): HighlightOptions<TOpts> | undefined {
        switch (highlightState) {
            case HighlightState.Item:
            case HighlightState.OtherItem:
            case HighlightState.Series:
                return this.highlightedSeries;
            case HighlightState.OtherSeries:
                return this.unhighlightedSeries;
        }
    }

    getStyle(highlightState: HighlightState): HighlightOptions<TOpts> {
        return mergeDefaults<HighlightOptions<TOpts>>(
            this.getItemHighlightStyle(highlightState),
            this.getSeriesHighlightStyle(highlightState)
        );
    }
}

class SeriesHighlightStyle extends BaseProperties {
    @Property
    strokeWidth?: number;

    @Property
    dimOpacity?: number;

    @Property
    enabled?: boolean;
}

class TextHighlightStyle extends BaseProperties {
    @Property
    color?: string = 'black';
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

export class HighlightStyle extends BaseProperties {
    @Property
    readonly item = new SeriesItemHighlightStyle();

    @Property
    readonly series = new SeriesHighlightStyle();

    @Property
    readonly text = new TextHighlightStyle();
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

    // user pass-through option: no validation-decorator required.
    context?: unknown;

    override handleUnknownProperties(unknownKeys: Set<unknown>, properties: T) {
        if ('context' in properties) {
            this.context = properties.context;
            unknownKeys.delete('context');
        }
    }
}
