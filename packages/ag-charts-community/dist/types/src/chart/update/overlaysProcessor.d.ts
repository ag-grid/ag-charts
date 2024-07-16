import type { DataService } from '../data/dataService';
import type { AnimationManager } from '../interaction/animationManager';
import type { LayoutService } from '../layout/layoutService';
import type { ChartOverlays } from '../overlay/chartOverlays';
import type { ChartLike, UpdateProcessor } from './processor';
export declare class OverlaysProcessor<D extends object> implements UpdateProcessor {
    private readonly chartLike;
    private readonly overlays;
    private readonly dataService;
    private readonly layoutService;
    private readonly animationManager;
    private destroyFns;
    constructor(chartLike: ChartLike, overlays: ChartOverlays, dataService: DataService<D>, layoutService: LayoutService, animationManager: AnimationManager);
    destroy(): void;
    private onLayoutComplete;
    private toggleOverlay;
}
