import type {
    AreExact,
    ColorSpace,
    NormalisedColorType,
    NormalisedGradientColorStop,
    RequiredInternalAgGradientColor,
    RequiredInternalAgImageFill,
    RequiredInternalAgPatternColor,
} from 'ag-charts-core';
import { BaseProperties, Property, isEmptyObject, mergeDefaults } from 'ag-charts-core';
import type {
    AgColorRepeat,
    AgGradientColorBounds,
    AgGradientColorStop,
    AgGradientType,
    AgImageFillFit,
    AgPatternName,
    CssColor,
    Opacity,
    PixelSize,
    HighlightState as PublicHighlightState,
    SelectionState as PublicSelectionState,
} from 'ag-charts-types';

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

// Mid-drag styling: a selected verdict from either the candidate or the committed selection
// wins, so a replace/clear only demotes the committed state on commit.
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

export type SeriesItemHighlightStyle = HighlightOptions<object>;

/** Merges the highlight-state buckets that apply to `highlightState`, earlier keys taking precedence. */
export function getHighlightStyle<TStyle extends object>(
    highlight: { [K in HighlightStyleOptionKey]?: TStyle } | undefined,
    highlightState: HighlightState
): TStyle {
    const keys = getHighlightStyleOptionKeys(highlightState);
    if (highlight == null || keys.length === 0) return {} as TStyle;
    return mergeDefaults<TStyle>(...keys.map((key) => highlight[key]));
}

/** Merges the selection-state buckets that apply to `selectionState`, earlier keys taking precedence. */
export function getSelectionStyle<TStyle extends object>(
    selection: { [K in SelectionStyleOptionKey]?: TStyle } | undefined,
    selectionState: SelectionState
): TStyle {
    const keys = getSelectionStyleOptionKeys(selectionState);
    if (selection == null || keys.length === 0) return {} as TStyle;
    return mergeDefaults<TStyle>(...keys.map((key) => selection[key]));
}

/** Whether a highlight/selection bucket carries any overrides; an absent bucket carries none. */
export function hasStateStyle(bucket: object | undefined): boolean {
    return bucket != null && !isEmptyObject(bucket);
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
