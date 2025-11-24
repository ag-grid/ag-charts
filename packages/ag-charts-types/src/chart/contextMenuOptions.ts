import type {
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

export type AgContextMenuItemShowOn = 'always' | 'series-area' | 'series-node' | 'legend-item';

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

export interface AgContextMenuItemAlways<TDatum = DatumDefault, TContext = ContextDefault>
    extends ItemMixin<TDatum, TContext> {
    /**
     * Which clicked element this menu item should be shown for. `'always'` menu items are always shown.
     *
     * Default: `'always'`
     */
    showOn?: 'always';
    /** Function called when clicking on this menu item. */
    action?: (event: AgChartContextMenuEvent<TContext>) => void;
}

export interface AgContextMenuItemSeriesArea<TDatum = DatumDefault, TContext = ContextDefault>
    extends ItemMixin<TDatum, TContext> {
    /**
     *  Which clicked element this menu item should be shown for. `'series-area'` menu items are shown when clicking anywhere within the series area bounds.
     */
    showOn: 'series-area';
    /** Function called when clicking on this menu item. */
    action?: (event: AgSeriesAreaContextMenuActionEvent<TContext>) => void;
}

export interface AgContextMenuItemSeriesNode<TDatum = DatumDefault, TContext = ContextDefault>
    extends ItemMixin<TDatum, TContext> {
    /**
     *  Which clicked element this menu item should be shown for. `'series-node'` menu items are shown when clicking when clicking on a datum node.
     */
    showOn: 'series-node';
    /** Function called when clicking on this menu item. */
    action?: (event: AgNodeContextMenuActionEvent<TDatum, TContext>) => void;
}

export interface AgContextMenuItemLegendItem<TDatum = DatumDefault, TContext = ContextDefault>
    extends ItemMixin<TDatum, TContext> {
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
    | AgContextMenuItemSeriesArea<TDatum, TContext>
    | AgContextMenuItemSeriesNode<TDatum, TContext>
    | AgContextMenuItemLegendItem<TDatum, TContext>;

type GetItemsParamsOmissions = 'type' | 'event';

interface GetItemsParamsMixin<TDatum, TContext> {
    defaultItems: AgContextMenuItem<TDatum, TContext>[];
}

// Note: The unused `_TDatumReserved = never` are reserved for future-proofing.
//
// Using <TContext> instead of <_TDatum, TContext> would make the API very susectible to breaking changes and/or inconsistency.
//
// If we ever need to add a `datum: TDatum` property, then changing <TContext> to <TDatum, TContext> would be a breaking
// change, because code that uses these generic types would need to be updated to shift generic TContext parameter by
// one position to the right. A workaround could be to change <TContext> to <TContext, TDatum = DatumDefault>, but this
// is inconsistent with the ordering of other generic types in our API.

export interface AgContextMenuGetItemsParamsAlways<_TDatumReserved = never, TContext = ContextDefault>
    extends Omit<AgChartContextMenuEvent<TContext>, GetItemsParamsOmissions>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'always';
}

export interface AgContextMenuGetItemsParamsSeriesArea<_TDatumReserved = never, TContext = ContextDefault>
    extends Omit<AgSeriesAreaContextMenuActionEvent<TContext>, GetItemsParamsOmissions>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'series-area';
}

export interface AgContextMenuGetItemsParamsSeriesNode<TDatum = DatumDefault, TContext = ContextDefault>
    extends Omit<AgNodeContextMenuActionEvent<TDatum, TContext>, GetItemsParamsOmissions>,
        GetItemsParamsMixin<TDatum, TContext> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'series-node';
}

export interface AgContextMenuGetItemsParamsLegendItem<_TDatumReserved = never, TContext = ContextDefault>
    extends Omit<AgChartLegendContextMenuEvent<TContext>, GetItemsParamsOmissions>,
        GetItemsParamsMixin<_TDatumReserved, TContext> {
    /** Which clicked element this menu item should be shown for. */
    showOn: 'legend-item';
    /** Whether the series of this legend item is visible or hidden. */
    visible: boolean;
}

export type AgContextMenuGetItemsParams<TDatum = DatumDefault, TContext = ContextDefault> =
    | AgContextMenuGetItemsParamsAlways<TDatum, TContext>
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
