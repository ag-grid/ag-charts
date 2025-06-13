import type {
    RequiredInternalAgGradientColor,
    RequiredInternalAgImageFill,
    RequiredInternalAgPatternColor,
} from 'ag-charts-core';
import type {
    AgColorRepeat,
    AgGradientColorBounds,
    AgGradientColorStop,
    AgGradientType,
    AgImageFillFit,
    AgPatternName,
    CssColor,
    InteractionRange,
    Opacity,
    PixelSize,
} from 'ag-charts-types';

import { mergeDefaults } from '../../util/object';
import { BaseProperties } from '../../util/properties';
import { Property } from '../../util/properties';
import type { SeriesTooltip } from './seriesTooltip';

export enum HighlightState {
    None,
    Item,
    Series,
    OtherSeries,
    OtherItem,
}
export class SeriesItemHighlightStyle extends BaseProperties {
    @Property
    fill?: string = 'rgba(255,255,255, 0.33)';

    @Property
    fillOpacity?: number;

    @Property
    stroke?: string = `rgba(0, 0, 0, 0.4)`;

    @Property
    strokeWidth?: number = 2;

    @Property
    strokeOpacity?: number;

    @Property
    lineDash?: number[];

    @Property
    lineDashOffset?: number;
}

export class HighlightOptions extends BaseProperties {
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

    @Property
    opacity?: number;
}

export class HighlightProperties<T> extends BaseProperties {
    @Property
    enabled = true;

    @Property
    public range: 'tooltip' | 'node' = 'tooltip';

    @Property
    readonly highlightedItem: Partial<T> = {};

    @Property
    readonly unhighlightedItem: Partial<T> = {};

    @Property
    readonly highlightedSeries: Partial<T> = {};

    @Property
    readonly unhighlightedSeries: Partial<T> = {};

    private getItemHighlightStyle(highlightState: HighlightState) {
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

    private getSeriesHighlightStyle(highlightState: HighlightState) {
        switch (highlightState) {
            case HighlightState.Item:
            case HighlightState.OtherItem:
            case HighlightState.Series:
                return this.highlightedSeries;
            case HighlightState.OtherSeries:
                return this.unhighlightedSeries;
        }
    }

    getStyle(highlightState: HighlightState) {
        return mergeDefaults(this.getItemHighlightStyle(highlightState), this.getSeriesHighlightStyle(highlightState));
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

    @Property
    readonly highlightStyle = new HighlightStyle();

    abstract tooltip: SeriesTooltip<never>;

    // user pass-through option: no validation-decorator required.
    context?: unknown;

    override handleUnknownProperties(unknownKeys: Set<string>, properties: T) {
        if ('context' in properties) {
            this.context = properties.context;
            unknownKeys.delete('context');
        }
    }
}
