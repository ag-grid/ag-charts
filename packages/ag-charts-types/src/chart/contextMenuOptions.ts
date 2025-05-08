import type { Listener } from './callbackOptions';
import type {
    AgChartContextMenuEvent,
    AgNodeContextMenuActionEvent,
    AgSeriesAreaContextMenuActionEvent,
} from './eventOptions';
import type { AgChartLegendContextMenuEvent } from './legendOptions';

export type AgContextMenuItemLiteral =
    | 'defaults'
    | 'download'
    | 'zoom-to-cursor'
    | 'pan-to-cursor'
    | 'toggle-series-visibility'
    | 'toggle-other-series'
    | 'separator';

export type AgContextMenuItemShowOn = 'always' | 'series-area' | 'series-node' | 'legend-item';

export type AgContextMenuItemType = 'action' | 'separator';

interface ItemMixin {
    /**
     * The type of UI element that this item represents.
     *
     * Default: `'action'`
     */
    type?: AgContextMenuItemType;
    /**
     * Type of `'contextmenu'` clicks that this menu item should be shown for.
     *
     * Default: `'always'`
     */
    showOn?: AgContextMenuItemShowOn;
    /** The text label of this menu item. This property is required for Accessibility compliance. */
    label: string;
    /**
     * Dimmed state of this menu-item.
     *
     * Default: `true` */
    enabled?: boolean;
    /** The submenu items. If undefined or empty, then this item will just be treat like a regular menu item. Otherwise, this menu item will have a submenu popup attached to it. */
    items?: AgContextMenuItem[];
}

export interface AgContextMenuItemAlways extends ItemMixin {
    /**
     * Type of `'contextmenu'` clicks that this menu item should be shown for. `'always'` menu items are always shown.
     *
     * Default: `'always'`
     */
    showOn?: 'always';
    /** Function called when clicking on this menu item. */
    action?: (event: AgChartContextMenuEvent) => void;
}

export interface AgContextMenuItemSeriesArea extends ItemMixin {
    /** Type of `'contextmenu'` clicks that this menu item should be shown for. `'series-area'` menu items are always shown when clicking anywhere in the series area bounds, including on a datum node. */
    showOn: 'series-area';
    /** Function called when clicking on this menu item. */
    action?: (event: AgSeriesAreaContextMenuActionEvent) => void;
}

export interface AgContextMenuItemSeriesNode extends ItemMixin {
    /** Type of `'contextmenu'` clicks that this menu item should be shown for. `'series-node'` menu items only when clicking on a datum node. */
    showOn: 'series-node';
    /** Function called when clicking on this menu item. */
    action?: (event: AgNodeContextMenuActionEvent) => void;
}

export interface AgContextMenuItemLegendItem extends ItemMixin {
    /** Type of `'contextmenu'` clicks that this menu item should be shown for. `'legend-item'` menu items only when clicking on a legend item. */
    showOn: 'legend-item';
    /** Function called when clicking on this menu item. */
    action?: (event: AgChartLegendContextMenuEvent) => void;
}

export type AgContextMenuItem =
    | AgContextMenuItemLiteral
    | AgContextMenuItemAlways
    | AgContextMenuItemSeriesArea
    | AgContextMenuItemSeriesNode
    | AgContextMenuItemLegendItem;

export interface AgContextMenuOptions {
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
    items?: AgContextMenuItem[];
    /**
     * Custom actions displayed in the context menu when right-clicking anywhere on the chart.
     * @deprecated v11.3.0 use `items` instead.
     */
    // eslint-disable-next-line sonarjs/deprecation
    extraActions?: AgContextMenuAction<AgChartContextMenuEvent>[];
    /**
     * Custom actions displayed in the context menu when right-clicking anywhere on the series area.
     * @deprecated v11.3.0 use `items` instead.
     */
    // eslint-disable-next-line sonarjs/deprecation
    extraSeriesAreaActions?: AgContextMenuAction<AgSeriesAreaContextMenuActionEvent>[];
    /**
     * Custom actions displayed in the context menu when right-clicking on a series node.
     * @deprecated v11.3.0 use `items` instead.
     */
    // eslint-disable-next-line sonarjs/deprecation
    extraNodeActions?: AgContextMenuAction<AgNodeContextMenuActionEvent>[];
    /**
     * Custom actions displayed in the context menu when right-clicking on a legend item.
     * @deprecated v11.3.0 use `items` instead.
     */
    // eslint-disable-next-line sonarjs/deprecation
    extraLegendItemActions?: AgContextMenuAction<AgChartLegendContextMenuEvent>[];
}

/** @deprecated v11.3.0 use `AgContextMenuItem` instead. */
export interface AgContextMenuAction<TEvent = AgNodeContextMenuActionEvent> {
    /** The text to display in the context menu for the custom action. */
    label: string;
    /** Callback function for the custom action. */
    action: Listener<TEvent>;
}
