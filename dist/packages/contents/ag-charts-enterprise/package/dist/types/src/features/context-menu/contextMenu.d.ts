import { _ModuleSupport } from 'ag-charts-community';
type ContextMenuAction = _ModuleSupport.ContextMenuAction;
type ContextMenuItem = 'download' | ContextMenuAction;
export declare class ContextMenu extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    readonly ctx: _ModuleSupport.ModuleContext;
    enabled: boolean;
    darkTheme: boolean;
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
    private registry;
    private groups;
    private pickedNode?;
    private showEvent?;
    private x;
    private y;
    private canvasElement;
    private container;
    private element;
    private menuElement?;
    private intersectionObserver?;
    private mutationObserver?;
    private static contextMenuDocuments;
    constructor(ctx: _ModuleSupport.ModuleContext);
    private isShown;
    private onClick;
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
