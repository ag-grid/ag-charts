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
    action: (params: AgNodeContextMenuActionEvent<any>) => void;
}
