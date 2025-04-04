import type { Listener } from './callbackOptions';
import type {
    AgChartContextMenuEvent,
    AgNodeContextMenuActionEvent,
    AgSeriesAreaContextMenuActionEvent,
} from './eventOptions';
import type { AgChartLegendContextMenuEvent } from './legendOptions';

type ShowOnActionEventMap = {
    'series-area': AgSeriesAreaContextMenuActionEvent;
    'series-node': AgNodeContextMenuActionEvent;
    'legend-item': AgChartLegendContextMenuEvent;
};

type AgContextMenuItemLiteral =
    | 'defaults'
    | 'download'
    | 'zoom-to-cursor'
    | 'pan-to-cursor'
    | 'toggle-series-visibility'
    | 'toggle-other-series'
    | 'reset-zoom';

type AgContextMenuItemShowOn = 'series-area' | 'series-node' | 'legend-item';

type AgContextMenuItemType = 'action' | 'submenu' | 'separator';

type AgContextMenuItem = AgContextMenuItemLiteral | AgContextMenuItemEntry<AgContextMenuItemShowOn>;

interface AgContextMenuItemEntry<TShowOn extends AgContextMenuItemShowOn> {
    /**  TODO: writeme. */
    type: AgContextMenuItemType;
    /**  TODO: writeme. */
    showOn: readonly TShowOn[];
    /**  TODO: writeme. */
    label: string;
    /**  TODO: writeme. */
    iconUrl?: string;
    /**  TODO: writeme. */
    enable?: boolean;
    /**  TODO: writeme. */
    action?: (event: ShowOnActionEventMap[TShowOn]) => void;
    /**  TODO: writeme. */
    items?: AgContextMenuItem;
}

export interface AgContextMenuOptions {
    /**  Whether to show the context menu. */
    enabled?: boolean;
    /**  TODO: writeme. */
    items?: readonly AgContextMenuItem[];
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
