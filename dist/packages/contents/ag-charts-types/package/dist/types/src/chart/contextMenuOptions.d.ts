import type { AgChartContextMenuEvent, AgNodeContextMenuActionEvent } from './eventOptions';
import type { AgChartLegendContextMenuEvent } from './legendOptions';
export interface AgContextMenuOptions {
    /**  Whether to show the context menu. */
    enabled?: boolean;
    /**  Custom actions displayed in the context menu when right-clicking anywhere on the chart. */
    extraActions?: AgContextMenuAction<AgChartContextMenuEvent>[];
    /**  Custom actions displayed in the context menu when right-clicking on a series node. */
    extraSeriesActions?: AgContextMenuAction<AgChartContextMenuEvent>[];
    /**  Custom actions displayed in the context menu when right-clicking on a series node. */
    extraNodeActions?: AgContextMenuAction<AgNodeContextMenuActionEvent>[];
    /**  Custom actions displayed in the context menu when right-clicking on a legend item. */
    extraLegendItemActions?: AgContextMenuAction<AgChartLegendContextMenuEvent>[];
}
export interface AgContextMenuAction<TEvent = AgNodeContextMenuActionEvent> {
    /** The text to display in the context menu for the custom action. */
    label: string;
    /** Callback function for the custom action. */
    action: (event: TEvent) => void;
}
