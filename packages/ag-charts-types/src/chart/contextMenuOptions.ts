import type { Listener } from './callbackOptions';
import type {
    AgChartContextMenuEvent,
    AgNodeContextMenuActionEvent,
    AgSeriesAreaContextMenuActionEvent,
} from './eventOptions';
import type { AgChartLegendContextMenuEvent } from './legendOptions';

type AgContextMenuItemLiteral =
    | 'defaults'
    | 'download'
    | 'zoom-to-cursor'
    | 'pan-to-cursor'
    | 'toggle-series-visibility'
    | 'toggle-other-series'
    | 'reset-zoom';

type AgContextMenuItemShowOn = 'all' | 'series-area' | 'series-node' | 'legend-item';

type AgContextMenuItemType = 'action' | 'submenu' | 'separator';

interface ItemMixin {
    /**  TODO: writeme. */
    type: AgContextMenuItemType;
    /**  TODO: writeme. */
    showOn: AgContextMenuItemShowOn;
    /**  TODO: writeme. */
    label: string;
    /**  TODO: writeme. */
    iconUrl?: string;
    /**  TODO: writeme. */
    enable?: boolean;
    /**  TODO: writeme. */
    items?: AgContextMenuItem;
}

interface AgContextMenuItemAll extends ItemMixin {
    /**  TODO: writeme. */
    showOn: 'all';
    /**  TODO: writeme. */
    action?: (event: AgChartContextMenuEvent) => void;
}

interface AgContextMenuItemSeriesArea extends ItemMixin {
    /**  TODO: writeme. */
    showOn: 'series-area';
    /**  TODO: writeme. */
    action?: (event: AgSeriesAreaContextMenuActionEvent) => void;
}

interface AgContextMenuItemSeriesNode extends ItemMixin {
    /**  TODO: writeme. */
    showOn: 'series-node';
    /**  TODO: writeme. */
    action?: (event: AgNodeContextMenuActionEvent) => void;
}

interface AgContextMenuItemLegendItem extends ItemMixin {
    /**  TODO: writeme. */
    showOn: 'legend-item';
    /**  TODO: writeme. */
    action?: (event: AgChartLegendContextMenuEvent) => void;
}

type AgContextMenuItem =
    | AgContextMenuItemLiteral
    | AgContextMenuItemAll
    | AgContextMenuItemSeriesArea
    | AgContextMenuItemSeriesNode
    | AgContextMenuItemLegendItem;

export interface AgContextMenuOptions {
    /**  Whether to show the context menu. */
    enabled?: boolean;
    /**  TODO: writeme. */
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
