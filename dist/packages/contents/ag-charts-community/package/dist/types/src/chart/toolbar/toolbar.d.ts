import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import { ToolbarGroupProperties } from './toolbarProperties';
export declare class Toolbar extends BaseModuleInstance implements ModuleInstance {
    private readonly ctx;
    enabled: boolean;
    annotations: ToolbarGroupProperties;
    ranges: ToolbarGroupProperties;
    zoom: ToolbarGroupProperties;
    private margin;
    private floatingDetectionRange;
    private readonly container;
    private elements;
    private positions;
    private positionAlignments;
    private groupCallers;
    private groupButtons;
    private pendingButtonToggledEvents;
    private groupProxied;
    constructor(ctx: ModuleContext);
    private destroyElements;
    private onHover;
    private onLeave;
    private onGroupChanged;
    private onGroupButtonsChanged;
    private onLayoutComplete;
    private onButtonToggled;
    private onGroupToggled;
    private onProxyGroupOptions;
    private createGroup;
    private createGroupButtons;
    private toggleGroup;
    private processPendingEvents;
    performLayout({ shrinkRect }: {
        shrinkRect: BBox;
    }): Promise<{
        shrinkRect: BBox;
    }>;
    performCartesianLayout(opts: {
        seriesRect: BBox;
    }): Promise<void>;
    private toggleVisibilities;
    private translateFloatingElements;
    private renderToolbar;
    private createButtonElement;
    private onButtonPress;
}
