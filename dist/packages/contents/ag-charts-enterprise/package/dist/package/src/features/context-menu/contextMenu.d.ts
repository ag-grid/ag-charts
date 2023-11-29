import { _ModuleSupport } from 'ag-charts-community';
type ContextMenuItem = 'download' | ContextMenuAction;
type ContextMenuAction = {
    id?: string;
    label: string;
    action: (params: ContextMenuActionParams) => void;
};
export type ContextMenuActionParams = {
    datum?: any;
    itemId?: string;
    seriesId?: string;
    event: MouseEvent;
};
export declare class ContextMenu extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    readonly ctx: _ModuleSupport.ModuleContext;
    enabled: boolean;
    /**
     * Extra menu actions with a label and callback.
     */
    extraActions: Array<ContextMenuAction>;
    /**
     * Extra menu actions that only appear when clicking on a node.
     */
    extraNodeActions: Array<ContextMenuAction>;
    private scene;
    private highlightManager;
    private interactionManager;
    private tooltipManager;
    private groups;
    private pickedNode?;
    private showEvent?;
    private x;
    private y;
    private canvasElement;
    private container;
    private coverElement;
    private element;
    private menuElement?;
    private intersectionObserver?;
    private mutationObserver?;
    private static contextMenuDocuments;
    private static defaultActions;
    private static nodeActions;
    private static disabledActions;
    constructor(ctx: _ModuleSupport.ModuleContext);
    static registerDefaultAction(action: ContextMenuAction): void;
    static registerNodeAction(action: ContextMenuAction): void;
    static enableAction(actionId: string): void;
    static disableAction(actionId: string): void;
    private onContextMenu;
    show(): void;
    hide(): void;
    renderMenu(): HTMLDivElement;
    renderItem(item: ContextMenuItem): HTMLElement | void;
    private createDividerElement;
    private createActionElement;
    private createButtonElement;
    private createDisabledElement;
    private reposition;
    destroy(): void;
}
export {};
