import type { DataService } from '../data/dataService';
import type { DOMManager } from '../dom/domManager';
import type { AnimationManager } from '../interaction/animationManager';
import type { LayoutService } from '../layout/layoutService';
import type { LocaleManager } from '../locale/localeManager';
import type { ChartOverlays } from '../overlay/chartOverlays';
import type { ChartLike, UpdateProcessor } from './processor';
export declare class OverlaysProcessor<D extends object> implements UpdateProcessor {
    private readonly chartLike;
    private readonly overlays;
    private readonly dataService;
    private readonly layoutService;
    private readonly localeManager;
    private readonly animationManager;
    private readonly domManager;
    private readonly destroyFns;
    private readonly overlayElem;
    constructor(chartLike: ChartLike, overlays: ChartOverlays, dataService: DataService<D>, layoutService: LayoutService, localeManager: LocaleManager, animationManager: AnimationManager, domManager: DOMManager);
    destroy(): void;
    private onLayoutComplete;
    private toggleOverlay;
}
