import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import type { Group } from '../../scene/group';
import { RangeHandle } from './shapes/rangeHandle';
import { RangeMask } from './shapes/rangeMask';
export declare class Navigator extends BaseModuleInstance implements ModuleInstance {
    private readonly ctx;
    miniChart: unknown;
    enabled: boolean;
    mask: RangeMask;
    minHandle: RangeHandle;
    maxHandle: RangeHandle;
    height: number;
    margin: number;
    min?: number;
    max?: number;
    protected x: number;
    protected y: number;
    protected width: number;
    private rangeSelector;
    private dragging?;
    private panStart?;
    private _min;
    private _max;
    private minRange;
    constructor(ctx: ModuleContext);
    updateBackground(oldGroup?: Group, newGroup?: Group): void;
    private updateGroupVisibility;
    performLayout({ shrinkRect }: {
        shrinkRect: BBox;
    }): Promise<{
        shrinkRect: BBox;
    }>;
    performCartesianLayout(opts: {
        seriesRect: BBox;
    }): Promise<void>;
    private onHover;
    private onDragStart;
    private onDrag;
    private onDragEnd;
    private onLeave;
    private onZoomChange;
    private layoutNodes;
    private updateNodes;
    private updateZoom;
}
