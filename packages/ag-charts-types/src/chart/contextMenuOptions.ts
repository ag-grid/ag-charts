import type { SelectionState } from './callbackOptions';
import type {
    AgAxisContextMenuActionEvent,
    AgCaptionContextMenuActionEvent,
    AgChartContextMenuEvent,
    AgCrossLineContextMenuActionEvent,
    AgNodeContextMenuActionEvent,
    AgSeriesAreaContextMenuActionEvent,
} from './eventOptions';
import type { AgChartLegendContextMenuEvent } from './legendOptions';
import type { ContextDefault, DatumDefault } from './types';

export type AgContextMenuItemLiteral =
    | 'defaults'
    | 'download'
    | 'zoom-to-cursor'
    | 'pan-to-cursor'
    | 'reset-zoom'
    | 'toggle-series-visibility'
    | 'toggle-other-series'
    | 'separator';

export type AgContextMenuItemShowOn =
    | 'always'
    | 'axis'
    | 'caption'
    | 'cross-line'
    | 'series-area'
    | 'series-node'
    | 'legend-item';

export type AgContextMenuItemType = 'action' | 'separator';

interface ItemMixin<TDatum = DatumDefault, TContext = ContextDefault> {
    /**
     * The type of UI element that this item represents.
     *
     * Default: `'action'`
     */
    type?: AgContextMenuItemType;
    /**
     * Which clicked element this menu item should be shown for.
     *
     * Default: `'always'`
     */
    showOn?: AgContextMenuItemShowOn;
    /** The text label of this menu item. This property is required for Accessibility compliance. */
    label: string;
    /**
     * State of this menu-item.
     *
     * Default: `true` */
    enabled?: boolean;
    /** The submenu items. If undefined or empty, then this item will just be treat like a regular menu item. Otherwise, this menu item will have a submenu popup attached to it. */
    items?: AgContextMenuItem<TDatum, TContext>[];
}

export interface AgContextMenuItemAlways<TDatum = DatumDefault, TContext = ContextDefault> extends ItemMixin<
    TDatum,
    TContext
> {
    /**
     * Which clicked element this menu item should be shown for. `'always'` menu items are always shown.
     *
     * Default: `'always'`
     */
    showOn?: 'always';
    /** Function called when clicking on this menu item. */
    action?: (event: AgChartContextMenuEvent<TContext>) => void;
}

export interface AgContextMenuItemAxis<TDatum = DatumDefault, TContext = ContextDefault> extends ItemMixin<
    TDatum,
    TContext
> {
    /**
     * Which clicked element this menu item should be shown for. `'axis'` menu items are when clicking any part of an axis.
     *
     * Default: `'axis'`
     */
    showOn: 'axis';
    /** Function called when clicking on this menu item. */
    action?: (event: AgAxisContextMenuActionEvent<TContext>) => void;
}

export interface AgContextMenuItemCrossLine<TDatum = DatumDefault, TContext = ContextDefault> extends ItemMixin<
    TDatum,
    TContext
> {
    /**
     * Which clicked element this menu item should be shown for. `'cross-line'` menu items are shown when right-clicking a cross line's line or fill.
     */
    showOn: 'cross-line';
    /** Function called when clicking on this menu item. */
    action?: (event: AgCrossLineContextMenuActionEvent<TContext>) => void;
}

export interface AgContextMenuItemCaption<TDatum = DatumDefault, TContext = ContextDefault> extends ItemMixin<
    TDatum,
    TContext
> {
    /**
     * Which clicked element this menu item should be shown for. `'caption'` menu items are when clicking on a caption (title, subtitle, footnote).
     *
     * Default: `'caption'`
     */
    showOn: 'caption';
    /** Function called when clicking on this menu item. */
    action?: (event: AgCaptionContextMenuActionEvent<TContext>) => void;
}

export interface AgContextMenuItemSeriesArea<TDatum = DatumDefault, TContext = ContextDefault> extends ItemMixin<
    TDatum,
    TContext
> {
    /**
     *  Which clicked element this menu item should be shown for. `'series-area'` menu items are shown when clicking anywhere within the series area bounds.
     */
    showOn: 'series-area';
    /** Function called when clicking on this menu item. */
    action?: (event: AgSeriesAreaContextMenuActionEvent<TContext>) => void;
}

export interface AgContextMenuItemSeriesNode<TDatum = DatumDefault, TContext = ContextDefault> extends ItemMixin<
    TDatum,
    TContext
> {
    /**
     *  Which clicked element this menu item should be shown for. `'series-node'` menu items are shown when clicking when clicking on a datum node.
     */
    showOn: 'series-node';
    /** Function called when clicking on this menu item. */
    action?: (event: AgNodeContextMenuActionEvent<TDatum, TContext>) => void;
}

export interface AgContextMenuItemLegendItem<TDatum = DatumDefault, TContext = ContextDefault> extends ItemMixin<
    TDatum,
    TContext
> {
    /**
     *  Which clicked element this menu item should be shown for. `'legend-item'` menu items are shown when clicking on a legend item.
     */
    showOn: 'legend-item';
    /** Function called when clicking on this menu item. */
    action?: (event: AgChartLegendContextMenuEvent<TContext>) => void;
}

export type AgContextMenuItem<TDatum = DatumDefault, TContext = ContextDefault> =
    | AgContextMenuItemLiteral
    | AgContextMenuItemAlways<TDatum, TContext>
    | AgContextMenuItemAxis<TDatum, TContext>
    | AgContextMenuItemCaption<TDatum, TContext>
    | AgContextMenuItemCrossLine<TDatum, TContext>
    | AgContextMenuItemSeriesArea<TDatum, TContext>
    | AgContextMenuItemSeriesNode<TDatum, TContext>
    | AgContextMenuItemLegendItem<TDatum, TContext>;

type GetItemsParamsOmissions = 'type' | 'event';

// Note: The unused `_TDatumReserved = never` are reserved for future-proofing.
//
// Using <TContext> instead of <_TDatum, TContext> would make the API very susceptible to breaking changes and/or inconsistency.
//
// If we ever need to add a `datum: TDatum` property, then changing <TContext> to <TDatum, TContext> would be a breaking
// change, because code that uses these generic types would need to be updated to shift generic TContext parameter by
// one position to the right. A workaround could be to change <TContext> to <TContext, TDatum = DatumDefault>, but this
// is inconsistent with the ordering of other generic types in our API.

export interface AgContextMenuShowOnParamsAlways<_TDatumReserved = never, TContext = ContextDefault> extends Omit<
    AgChartContextMenuEvent<TContext>,
    GetItemsParamsOmissions
> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'always';
}

export interface AgContextMenuShowOnParamsAxis<_TDatumReserved = never, TContext = ContextDefault> extends Omit<
    AgAxisContextMenuActionEvent<TContext>,
    GetItemsParamsOmissions
> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'axis';
}

export interface AgContextMenuShowOnParamsCrossLine<_TDatumReserved = never, TContext = ContextDefault> extends Omit<
    AgCrossLineContextMenuActionEvent<TContext>,
    GetItemsParamsOmissions
> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'cross-line';
}

export interface AgContextMenuShowOnParamsCaption<_TDatumReserved = never, TContext = ContextDefault> extends Omit<
    AgCaptionContextMenuActionEvent<TContext>,
    GetItemsParamsOmissions
> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'caption';
}

export interface AgContextMenuShowOnParamsSeriesArea<_TDatumReserved = never, TContext = ContextDefault> extends Omit<
    AgSeriesAreaContextMenuActionEvent<TContext>,
    GetItemsParamsOmissions
> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'series-area';
}

export interface AgContextMenuShowOnParamsSeriesNode<TDatum = DatumDefault, TContext = ContextDefault> extends Omit<
    AgNodeContextMenuActionEvent<TDatum, TContext>,
    GetItemsParamsOmissions
> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'series-node';
    /** The current selection state of this datum. Set to `undefined` if the selection module is not enabled. */
    selectionState?: SelectionState;
    /** Whether this datum is collapsed. */
    isCollapsed?: boolean;
}

export interface AgContextMenuShowOnParamsLegendItem<_TDatumReserved = never, TContext = ContextDefault> extends Omit<
    AgChartLegendContextMenuEvent<TContext>,
    GetItemsParamsOmissions
> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'legend-item';
    /** Whether the series of this legend item is visible or hidden. */
    visible: boolean;
}

/**
 * One matched `showOn` scope's params, discriminated by its `showOn` field. This is the element type of
 * `allShowOnParams` — the same shape a scope passes as its top-level params when it wins outright, without the
 * callback-level `defaultItems`.
 *
 * Keyed by array position rather than by scope, because one scope can match more than once at a single click
 * point — e.g. overlapping markers each contribute their own `series-node` entry.
 */
export type AgContextMenuShowOnParams<TDatum = DatumDefault, TContext = ContextDefault> =
    | AgContextMenuShowOnParamsAlways<TDatum, TContext>
    | AgContextMenuShowOnParamsAxis<TDatum, TContext>
    | AgContextMenuShowOnParamsCaption<TDatum, TContext>
    | AgContextMenuShowOnParamsCrossLine<TDatum, TContext>
    | AgContextMenuShowOnParamsSeriesArea<TDatum, TContext>
    | AgContextMenuShowOnParamsSeriesNode<TDatum, TContext>
    | AgContextMenuShowOnParamsLegendItem<TDatum, TContext>;

interface GetItemsParamsMixin<TDatum, TContext> {
    /** The default menu items that would be shown without customisation. */
    defaultItems: AgContextMenuItem<TDatum, TContext>[];
    /**
     * Every `showOn` scope that matched at the click point, including the winning scope carried by these root
     * params. Lets the callback build one combined menu when scopes overlap — for example a datum node drawn
     * over an axis positioned with `crossAt`. Scopes that did not match are absent from the array. A scope
     * appears more than once when several of its contexts match the same point, such as overlapping markers.
     */
    allShowOnParams: AgContextMenuShowOnParams<TDatum, TContext>[];
}

export interface AgContextMenuGetItemsParamsAlways<_TDatumReserved = never, TContext = ContextDefault>
    extends
        AgContextMenuShowOnParamsAlways<_TDatumReserved, TContext>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {}

export interface AgContextMenuGetItemsParamsAxis<_TDatumReserved = never, TContext = ContextDefault>
    extends AgContextMenuShowOnParamsAxis<_TDatumReserved, TContext>, GetItemsParamsMixin<_TDatumReserved, TContext> {}

export interface AgContextMenuGetItemsParamsCrossLine<_TDatumReserved = never, TContext = ContextDefault>
    extends
        AgContextMenuShowOnParamsCrossLine<_TDatumReserved, TContext>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {}

export interface AgContextMenuGetItemsParamsCaption<_TDatumReserved = never, TContext = ContextDefault>
    extends
        AgContextMenuShowOnParamsCaption<_TDatumReserved, TContext>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {}

export interface AgContextMenuGetItemsParamsSeriesArea<_TDatumReserved = never, TContext = ContextDefault>
    extends
        AgContextMenuShowOnParamsSeriesArea<_TDatumReserved, TContext>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {}

export interface AgContextMenuGetItemsParamsSeriesNode<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgContextMenuShowOnParamsSeriesNode<TDatum, TContext>, GetItemsParamsMixin<TDatum, TContext> {}

export interface AgContextMenuGetItemsParamsLegendItem<_TDatumReserved = never, TContext = ContextDefault>
    extends
        AgContextMenuShowOnParamsLegendItem<_TDatumReserved, TContext>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {}

export type AgContextMenuGetItemsParams<TDatum = DatumDefault, TContext = ContextDefault> =
    | AgContextMenuGetItemsParamsAlways<TDatum, TContext>
    | AgContextMenuGetItemsParamsAxis<TDatum, TContext>
    | AgContextMenuGetItemsParamsCaption<TDatum, TContext>
    | AgContextMenuGetItemsParamsCrossLine<TDatum, TContext>
    | AgContextMenuGetItemsParamsSeriesArea<TDatum, TContext>
    | AgContextMenuGetItemsParamsSeriesNode<TDatum, TContext>
    | AgContextMenuGetItemsParamsLegendItem<TDatum, TContext>;

export type AgContextMenuGetItemsCallback<TDatum = DatumDefault, TContext = ContextDefault> = (
    params: AgContextMenuGetItemsParams<TDatum, TContext>
) => AgContextMenuItem<TDatum, TContext>[] | undefined;

export interface AgContextMenuOptions<TDatum = DatumDefault, TContext = ContextDefault> {
    /**
     * Whether to show the context menu.
     *
     * Default: `true`
     */
    enabled?: boolean;
    /**
     * List of menu items (and submenus) for the context menu.
     *
     * Default: `['defaults']`
     */
    items?: AgContextMenuItem<TDatum, TContext>[];
    /**
     * Callback to list the menu items (and submenus) for the context menu. Overrides `items` if return-value is defined, otherwise `items` is used as a fallback.
     *
     * Default: `undefined`
     */
    getItems?: AgContextMenuGetItemsCallback<TDatum, TContext>;
}
