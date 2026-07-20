import type { SelectionState } from './callbackOptions';
import type {
    AgAxisContextMenuActionEvent,
    AgCaptionContextMenuActionEvent,
    AgChartContextMenuEvent,
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

export type AgContextMenuItemShowOn = 'always' | 'axis' | 'caption' | 'series-area' | 'series-node' | 'legend-item';

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
    | AgContextMenuItemSeriesArea<TDatum, TContext>
    | AgContextMenuItemSeriesNode<TDatum, TContext>
    | AgContextMenuItemLegendItem<TDatum, TContext>;

type GetItemsParamsOmissions = 'type' | 'event';

/**
 * The regions under the pointer when the context menu was opened. More than one entry is present where
 * regions overlap — for example a datum node drawn over an axis positioned with `crossAt` yields both
 * `series-node` and `axis`. Each entry carries the same data the corresponding single-region params carry.
 */
export interface AgContextMenuRegions<TDatum = DatumDefault, TContext = ContextDefault> {
    /** Set when the pointer is over a datum node. */
    'series-node'?: Omit<AgNodeContextMenuActionEvent<TDatum, TContext>, GetItemsParamsOmissions>;
    /** Set when the pointer is within the series area bounds. */
    'series-area'?: Omit<AgSeriesAreaContextMenuActionEvent<TContext>, GetItemsParamsOmissions>;
    /** Set when the pointer is over an axis, including where an axis overlaps the series area (e.g. `crossAt`). */
    axis?: Omit<AgAxisContextMenuActionEvent<TContext>, GetItemsParamsOmissions>;
    /** Set when the pointer is over a caption (title, subtitle or footnote). */
    caption?: Omit<AgCaptionContextMenuActionEvent<TContext>, GetItemsParamsOmissions>;
    /** Set when the pointer is over a legend item. */
    'legend-item'?: Omit<AgChartLegendContextMenuEvent<TContext>, GetItemsParamsOmissions> & {
        /** Whether the series of this legend item is visible or hidden. */
        visible: boolean;
    };
}

interface GetItemsParamsMixin<TDatum, TContext> {
    /** The default menu items that would be shown without customisation. */
    defaultItems: AgContextMenuItem<TDatum, TContext>[];
    /**
     * All regions under the pointer, keyed by region. When regions overlap, more than one entry is set,
     * letting the callback build a single combined menu. `showOn` reports the primary region for
     * backwards compatibility, but `regions` is the complete set.
     */
    regions: AgContextMenuRegions<TDatum, TContext>;
}

// Note: The unused `_TDatumReserved = never` are reserved for future-proofing.
//
// Using <TContext> instead of <_TDatum, TContext> would make the API very susceptible to breaking changes and/or inconsistency.
//
// If we ever need to add a `datum: TDatum` property, then changing <TContext> to <TDatum, TContext> would be a breaking
// change, because code that uses these generic types would need to be updated to shift generic TContext parameter by
// one position to the right. A workaround could be to change <TContext> to <TContext, TDatum = DatumDefault>, but this
// is inconsistent with the ordering of other generic types in our API.

export interface AgContextMenuGetItemsParamsAlways<_TDatumReserved = never, TContext = ContextDefault>
    extends
        Omit<AgChartContextMenuEvent<TContext>, GetItemsParamsOmissions>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'always';
}

export interface AgContextMenuGetItemsParamsAxis<_TDatumReserved = never, TContext = ContextDefault>
    extends
        Omit<AgAxisContextMenuActionEvent<TContext>, GetItemsParamsOmissions>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'axis';
}

export interface AgContextMenuGetItemsParamsCaption<_TDatumReserved = never, TContext = ContextDefault>
    extends
        Omit<AgCaptionContextMenuActionEvent<TContext>, GetItemsParamsOmissions>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'caption';
}

export interface AgContextMenuGetItemsParamsSeriesArea<_TDatumReserved = never, TContext = ContextDefault>
    extends
        Omit<AgSeriesAreaContextMenuActionEvent<TContext>, GetItemsParamsOmissions>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'series-area';
}

export interface AgContextMenuGetItemsParamsSeriesNode<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<AgNodeContextMenuActionEvent<TDatum, TContext>, GetItemsParamsOmissions>,
        GetItemsParamsMixin<TDatum, TContext> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'series-node';
    /** The current selection state of this datum. Set to `undefined` if the selection module is not enabled. */
    selectionState?: SelectionState;
    /** Whether this datum is collapsed. */
    isCollapsed: boolean;
}

export interface AgContextMenuGetItemsParamsLegendItem<_TDatumReserved = never, TContext = ContextDefault>
    extends
        Omit<AgChartLegendContextMenuEvent<TContext>, GetItemsParamsOmissions>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'legend-item';
    /** Whether the series of this legend item is visible or hidden. */
    visible: boolean;
}

export type AgContextMenuGetItemsParams<TDatum = DatumDefault, TContext = ContextDefault> =
    | AgContextMenuGetItemsParamsAlways<TDatum, TContext>
    | AgContextMenuGetItemsParamsAxis<TDatum, TContext>
    | AgContextMenuGetItemsParamsCaption<TDatum, TContext>
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
