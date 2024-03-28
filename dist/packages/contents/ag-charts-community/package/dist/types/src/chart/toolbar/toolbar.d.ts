import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
export declare class Toolbar extends BaseModuleInstance implements ModuleInstance {
    private readonly ctx;
    enabled: boolean;
    private y;
    private height;
    private margin;
    private activeButton?;
    private buttonNodes;
    private buttonOffsetX;
    private buttonSpacingX;
    private container;
    constructor(ctx: ModuleContext);
    performLayout({ shrinkRect }: {
        shrinkRect: BBox;
    }): Promise<{
        shrinkRect: BBox;
    }>;
    performCartesianLayout(opts: {
        seriesRect: BBox;
    }): Promise<void>;
    private onHover;
    private onClick;
    private onVisibility;
    private onButtonAdded;
    private onButtonRemoved;
    private layoutNodes;
}
