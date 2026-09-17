import type {
    AgMultiSeriesHighlightOptions,
    AgSelectionOptions,
    AgSeriesListeners,
    AgSeriesTooltip,
    AgSeriesTooltipRendererParams,
    AgTooltipPositionOptions,
    AgTooltipRendererResult,
    CssColor,
    InteractionRange,
    Renderer,
} from 'ag-charts-types';

import type { RequireOptional } from '../global';
import type { Normalised } from './normalise';
import type { NormalisedColorType } from './normalisedCommonOptions';

/** Style overrides a highlight or selection state bucket may carry once colour refs are resolved. */
export interface NormalisedSeriesStateStyle {
    fill?: NormalisedColorType;
    fillOpacity?: number;
    stroke?: CssColor;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    opacity?: number;
}

export type NormalisedSeriesHighlightOptions<TStyle extends object = NormalisedSeriesStateStyle> = Normalised<
    AgMultiSeriesHighlightOptions<Partial<TStyle & NormalisedSeriesStateStyle>>,
    'enabled'
>;

export type NormalisedSeriesSelectionOptions<TStyle extends object = NormalisedSeriesStateStyle> = Normalised<
    AgSelectionOptions<Partial<TStyle & NormalisedSeriesStateStyle>>,
    'enabled' | 'containment'
> & {
    /** Pie-only: distance a selected sector moves away from the centre. */
    selectedOffset?: number;
};

export type NormalisedTooltipPositionOptions = Normalised<AgTooltipPositionOptions, 'xOffset' | 'yOffset'>;

/** `TRendererParams` is the renderer's full params type, already passed through `RequireOptional`. */
export type NormalisedSeriesTooltipOptions<TRendererParams = RequireOptional<AgSeriesTooltipRendererParams<any>>> =
    Normalised<
        AgSeriesTooltip<any>,
        'position',
        {
            position: NormalisedTooltipPositionOptions;
            // Method syntax keeps the params bivariant, so a tooltip typed on richer renderer params satisfies a plainer caller.
            renderer?(this: void, params: TRendererParams): ReturnType<Renderer<never, AgTooltipRendererResult>>;
        }
    >;

type NormaliseSeriesTooltip<T> = T extends { tooltip?: AgSeriesTooltip<infer P> }
    ? NormalisedSeriesTooltipOptions<RequireOptional<Omit<P, 'context'>>>
    : NormalisedSeriesTooltipOptions;

export type SeriesCommonOptionKey =
    | 'id'
    | 'cursor'
    | 'nodeClickRange'
    | 'showInLegend'
    | 'highlight'
    | 'selection'
    | 'tooltip'
    | 'listeners'
    | 'context'
    | 'allowNullKeys'
    | 'focusPriority';

/** The series-specific part of its options: everything the common block does not own. */
export type NormalisedSeriesOwnOptions<T extends object> = Omit<T, SeriesCommonOptionKey>;

/** Options every series reads, resolved by the theme before the series sees them. */
export interface NormalisedSeriesOptionsCommon<T extends object = object> {
    id?: string;
    /** Absent on series types whose public options omit it. */
    cursor?: string;
    /** Absent on series types whose public options omit it. */
    nodeClickRange?: InteractionRange;
    /** Absent on series types whose public options omit it. */
    showInLegend?: boolean;
    /** Absent on series types whose public options omit it. */
    highlight?: NormalisedSeriesHighlightOptions<NormalisedSeriesOwnOptions<T>>;
    /** Absent on series types whose public options omit it. */
    selection?: NormalisedSeriesSelectionOptions<NormalisedSeriesOwnOptions<T>>;
    tooltip: NormaliseSeriesTooltip<T>;
    listeners?: AgSeriesListeners<unknown, unknown> & { seriesVisibilityChange?: never };
    context?: unknown;
    /** Undocumented: allow null values as discrete keys. */
    allowNullKeys?: boolean;
    /** Undocumented: keyboard focus order across series; lower is focused first. */
    focusPriority?: number;
}

/** The post-theme shape of a series' options; `T` is the public options type or a normalised alias of it. */
export type NormalisedSeriesOptions<T extends object> = NormalisedSeriesOwnOptions<T> &
    NormalisedSeriesOptionsCommon<T>;
