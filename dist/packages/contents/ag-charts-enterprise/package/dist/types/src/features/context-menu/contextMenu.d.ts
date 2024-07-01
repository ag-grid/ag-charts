import type { AgContextMenuOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
export declare class ContextMenu extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    readonly ctx: _ModuleSupport.ModuleContext;
    enabled: boolean;
    darkTheme: boolean;
    /**
     * Extra menu actions with a label and callback.
     */
    extraActions: NonNullable<AgContextMenuOptions['extraActions']>;
    /**
     * Extra menu actions that only appear when clicking on a node.
     */
    extraNodeActions: NonNullable<AgContextMenuOptions['extraNodeActions']>;
    /**
     * Extra menu actions that only appear when clicking on a legend item
     */
    extraLegendItemActions: NonNullable<AgContextMenuOptions['extraLegendItemActions']>;
    private readonly scene;
    private readonly interactionManager;
    private readonly registry;
    private readonly groups;
    private pickedNode?;
    private pickedLegendItem?;
    private showEvent?;
    private x;
    private y;
    private readonly element;
    private menuElement?;
    private menuElementDestroyFns;
    private lastFocus?;
    private readonly mutationObserver?;
    constructor(ctx: _ModuleSupport.ModuleContext);
    private isShown;
    private onClick;
    private onContext;
    private getLastFocus;
    private show;
    private hide;
    private renderMenu;
    private appendMenuGroup;
    private renderItem;
    private createDividerElement;
    private createActionElement;
    private createButtonOnClick;
    private createButtonElement;
    private reposition;
    destroy(): void;
}
