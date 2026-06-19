import type {
    AreExact,
    ColorSpace,
    InternalAgColorType,
    NormalisedColorType,
    NormalisedGradientColorStop,
    NormalisedSeriesSegmentation,
    RequiredInternalAgGradientColor,
    RequiredInternalAgImageFill,
    RequiredInternalAgPatternColor,
} from 'ag-charts-core';
import { BaseProperties, PropertiesArray, Property, mergeDefaults } from 'ag-charts-core';
import type {
    AgColorRepeat,
    AgGradientColorBounds,
    AgGradientColorStop,
    AgGradientType,
    AgImageFillFit,
    AgPatternName,
    AgSelectionContainment,
    AgSeriesShapeSegmentOptions,
    CssColor,
    InteractionRange,
    Opacity,
    PixelSize,
    HighlightState as PublicHighlightState,
    SelectionState as PublicSelectionState,
} from 'ag-charts-types';

import type { SeriesTooltip } from './seriesTooltip';
import { HighlightState, SelectionState } from './seriesTypes';

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

export type SelectionStyleOptionKey = 'selectedItem' | 'unselectedItem' | 'unselectedSeries';

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

export function getSelectionStyleOptionKeys(selectionState: SelectionState): SelectionStyleOptionKey[] {
    switch (selectionState) {
        case SelectionState.Item:
            return ['selectedItem'];
        case SelectionState.OtherItem:
            return ['unselectedItem'];
        case SelectionState.OtherSeries:
            return ['unselectedSeries'];
        case SelectionState.None:
            return [];
        default: {
            const unreachable = (a: never): never => a;
            return unreachable(selectionState);
        }
    }
}

type StyleMixins = {
    fill: NormalisedColorType;
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

export function toSelectionString(state: SelectionState | undefined): PublicSelectionState | undefined {
    const unreachable = (a: never): never => a;
    switch (state) {
        case SelectionState.Item:
            return 'selected-item';
        case SelectionState.OtherItem:
            return 'unselected-item';
        case SelectionState.OtherSeries:
            return 'unselected-series';
        case SelectionState.None:
            return 'none';
        case undefined:
            return undefined;
        default:
            return unreachable(state);
    }
}

export function isUnselected(state: SelectionState | undefined): boolean {
    if (
        state === undefined ||
        state === SelectionState.None ||
        state === SelectionState.OtherItem ||
        state === SelectionState.OtherSeries
    ) {
        // Compile-time check for SelectionState exhaustiveness:
        type ActualComplement = Exclude<SelectionState, typeof state>;
        type ExpectedComplement = SelectionState.Item;
        return true satisfies AreExact<ActualComplement, ExpectedComplement>;
    }
    return false;
}

// A "relevant" selection state is one that affects the styling.
export function isRelevantSelectionState(
    state: SelectionState | undefined
): state is Exclude<SelectionState, SelectionState.None> {
    const isIrrelevant: boolean = state === undefined || state === SelectionState.None;
    return !isIrrelevant;
}

// The state that should be styled mid-drag: the in-progress candidacy layers on
// top of the committed selection, so a selected verdict from either source wins.
// An out-of-rect committed selection is therefore not demoted by the candidate's
// "unselected" verdict — the replace/clear only takes effect on commit.
export function stagedSelectionState(
    selectionState: SelectionState | undefined,
    candidateState: SelectionState | undefined
): SelectionState | undefined {
    if (selectionState === SelectionState.Item || candidateState === SelectionState.Item) {
        return SelectionState.Item;
    }
    return isRelevantSelectionState(candidateState) ? candidateState : selectionState;
}

type HighlightOptions<TOpts extends object> = Partial<TOpts & StyleMixins>;
type SelectionOptions<TOpts extends object> = Partial<TOpts & StyleMixins>;

export type SeriesItemHighlightStyle = HighlightOptions<object>;

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

export class SeriesSelectionProperties<TOpts extends object> extends BaseProperties {
    @Property
    enabled = false;

    @Property
    containment: AgSelectionContainment = 'any';

    @Property
    readonly selectedItem: SelectionOptions<TOpts> = {};

    @Property
    readonly unselectedItem: SelectionOptions<TOpts> = {};

    @Property
    readonly unselectedSeries: SelectionOptions<TOpts> = {};

    @Property
    selectedOffset = 0; // pie-only

    getStyle(selectionState: SelectionState): SelectionOptions<TOpts> {
        const keys = getSelectionStyleOptionKeys(selectionState);
        if (keys.length === 0) return {};
        return mergeDefaults<SelectionOptions<TOpts>>(...keys.map((key) => this[key]));
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

export class Segmentation implements NormalisedSeriesSegmentation {
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
    colorStops: NormalisedGradientColorStop[] = [];

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

    @Property
    readonly selection: SeriesSelectionProperties<T> = new SeriesSelectionProperties();

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
