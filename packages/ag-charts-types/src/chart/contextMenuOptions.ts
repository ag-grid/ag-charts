import type { Listener } from './callbackOptions';
import type {
    AgChartContextMenuEvent,
    AgNodeContextMenuActionEvent,
    AgSeriesAreaContextMenuActionEvent,
} from './eventOptions';
import type { AgChartLegendContextMenuEvent } from './legendOptions';

interface ContextMenuItemMixin<TType extends AgContextMenuItemType, TEvent extends  { type: string; event: Event }> {
    /**  TODO: writeme. */
    type: TType;
    /**  TODO: writeme. */
    label: string;
    /**  TODO: writeme. */
    iconUrl?: string;
    /**  TODO: writeme. */
    enable?: boolean;
    /**  TODO: writeme. */
    action?: (event: TEvent) => void;
    /**  TODO: writeme. */
    items?: AgContextMenuItem;
}

type AgContextMenuItemLiteral =
    | 'defaults'
    | 'download'
    | 'zoom-to-cursor'
    | 'pan-to-cursor'
    | 'toggle-series-visibility'
    | 'toggle-other-series'
    | 'reset-zoom';

type AgContextMenuItemType = 'all' | 'series-area' | 'node' | 'legend';

type AgContextMenuItem =
    | AgContextMenuItemLiteral
    | ContextMenuItemMixin<'all', AgChartContextMenuEvent>
    | ContextMenuItemMixin<'series-area', AgSeriesAreaContextMenuActionEvent>
    | ContextMenuItemMixin<'node', AgNodeContextMenuActionEvent>
    | ContextMenuItemMixin<'legend', AgChartLegendContextMenuEvent>;

export interface AgContextMenuOptions {
    /**  Whether to show the context menu. */
    enabled?: boolean;
    /**  TODO: writeme. */
    items?: AgContextMenuItem[];
    /**
     * Custom actions displayed in the context menu when right-clicking anywhere on the chart.
     * @deprecated v11.3.0 use `items` instead.
     */
    extraActions?: AgContextMenuAction<AgChartContextMenuEvent>[];
    /**
     * Custom actions displayed in the context menu when right-clicking anywhere on the series area.
     * @deprecated v11.3.0 use `items` instead.
     */
    extraSeriesAreaActions?: AgContextMenuAction<AgSeriesAreaContextMenuActionEvent>[];
    /**
     * Custom actions displayed in the context menu when right-clicking on a series node.
     * @deprecated v11.3.0 use `items` instead.
     */
    extraNodeActions?: AgContextMenuAction<AgNodeContextMenuActionEvent>[];
    /**
     * Custom actions displayed in the context menu when right-clicking on a legend item.
     * @deprecated v11.3.0 use `items` instead.
     */
    extraLegendItemActions?: AgContextMenuAction<AgChartLegendContextMenuEvent>[];
}

/** @deprecated v11.3.0 use `AgContextMenuItem` instead. */
export interface AgContextMenuAction<TEvent = AgNodeContextMenuActionEvent> {
    /** The text to display in the context menu for the custom action. */
    label: string;
    /** Callback function for the custom action. */
    action: Listener<TEvent>;
}
