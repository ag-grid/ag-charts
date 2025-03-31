import type {
    AgChartContextMenuEvent,
    AgNodeContextMenuActionEvent,
    AgSeriesAreaContextMenuActionEvent,
} from './eventOptions';
import type { AgChartLegendContextMenuEvent } from './legendOptions';

export interface AgContextMenuOptions<TDatum> {
    /**  Whether to show the context menu. */
    enabled?: boolean;
    /**  Custom actions displayed in the context menu when right-clicking anywhere on the chart. */
    extraActions?: AgContextMenuAction<TDatum, AgChartContextMenuEvent>[];
    /**  Custom actions displayed in the context menu when right-clicking anywhere on the series area. */
    extraSeriesAreaActions?: AgContextMenuAction<TDatum, AgSeriesAreaContextMenuActionEvent>[];
    /**  Custom actions displayed in the context menu when right-clicking on a series node. */
    extraNodeActions?: AgContextMenuAction<TDatum, AgNodeContextMenuActionEvent<TDatum>>[];
    /**  Custom actions displayed in the context menu when right-clicking on a legend item. */
    extraLegendItemActions?: AgContextMenuAction<TDatum, AgChartLegendContextMenuEvent>[];
}

export interface AgContextMenuAction<TDatum = unknown, TEvent = AgNodeContextMenuActionEvent<TDatum>> {
    /** The text to display in the context menu for the custom action. */
    label: string;
    /** Callback function for the custom action. */
    action: (event: TEvent) => void;
}
