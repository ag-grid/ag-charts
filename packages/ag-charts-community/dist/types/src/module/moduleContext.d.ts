import type { AnnotationManager } from '../chart/annotation/annotationManager';
import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { ChartService } from '../chart/chartService';
import type { DataService } from '../chart/data/dataService';
import type { AnimationManager } from '../chart/interaction/animationManager';
import type { AriaAnnouncementService } from '../chart/interaction/ariaAnnouncementServices';
import type { ChartEventManager } from '../chart/interaction/chartEventManager';
import type { ContextMenuRegistry } from '../chart/interaction/contextMenuRegistry';
import type { CursorManager } from '../chart/interaction/cursorManager';
import type { GestureDetector } from '../chart/interaction/gestureDetector';
import type { HighlightManager } from '../chart/interaction/highlightManager';
import type { InteractionManager } from '../chart/interaction/interactionManager';
import type { RegionManager } from '../chart/interaction/regionManager';
import type { SyncManager } from '../chart/interaction/syncManager';
import type { ToolbarManager } from '../chart/interaction/toolbarManager';
import type { TooltipManager } from '../chart/interaction/tooltipManager';
import type { ZoomManager } from '../chart/interaction/zoomManager';
import type { LayoutService } from '../chart/layout/layoutService';
import type { SeriesStateManager } from '../chart/series/seriesStateManager';
import type { UpdateService } from '../chart/updateService';
import type { AgCartesianAxisPosition } from '../options/agChartOptions';
import type { Scene } from '../scene/scene';
import type { CallbackCache } from '../util/callbackCache';
export interface ModuleContext {
    readonly scene: Scene;
    readonly callbackCache: CallbackCache;
    readonly gestureDetector: GestureDetector;
    readonly chartService: ChartService;
    readonly dataService: DataService<any>;
    readonly layoutService: LayoutService;
    readonly updateService: UpdateService;
    readonly animationManager: AnimationManager;
    readonly annotationManager: AnnotationManager;
    readonly ariaAnnouncementService: AriaAnnouncementService;
    readonly chartEventManager: ChartEventManager;
    readonly contextMenuRegistry: ContextMenuRegistry;
    readonly cursorManager: CursorManager;
    readonly highlightManager: HighlightManager;
    readonly interactionManager: InteractionManager;
    readonly regionManager: RegionManager;
    readonly seriesStateManager: SeriesStateManager;
    readonly syncManager: SyncManager;
    readonly toolbarManager: ToolbarManager;
    readonly tooltipManager: TooltipManager;
    readonly zoomManager: ZoomManager;
}
export interface ModuleContextWithParent<P> extends ModuleContext {
    parent: P;
}
export interface AxisContext {
    axisId: string;
    continuous: boolean;
    direction: ChartAxisDirection;
    position?: AgCartesianAxisPosition;
    keys(): string[];
    seriesKeyProperties(): string[];
    scaleBandwidth(): number;
    scaleConvert(val: any): number;
    scaleInvert(position: number): any;
    scaleValueFormatter(specifier?: string): ((x: any) => string) | undefined;
}
export interface SeriesContext extends ModuleContext {
    series: {
        type: string;
    };
}
