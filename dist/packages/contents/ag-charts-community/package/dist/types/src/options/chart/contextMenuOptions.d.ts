import type { AgChartCallbackParams } from './callbackOptions';
import type { AgNodeContextMenuActionEvent } from './eventOptions';
export interface AgContextMenuOptions {
    /**  Whether to show the context menu. */
    enabled?: boolean;
    /**  Custom actions displayed in the context menu when right-clicking anywhere on the chart. */
    extraActions?: AgContextMenuAction[];
    /**  Custom actions displayed in the context menu when right-clicking on a series node. */
    extraNodeActions?: AgContextMenuAction[];
}
export interface AgContextMenuAction {
    /** The text to display in the context menu for the custom action. */
    label: string;
    /** Callback function for the custom action. */
    action: (event: AgNodeContextMenuActionEvent) => void;
}
/**
 * @deprecated v9.2 use AgNodeContextMenuActionEvent instead.
 */
export interface AgContextMenuActionParams<TDatum = any> extends AgChartCallbackParams<TDatum> {
    event: MouseEvent;
}
