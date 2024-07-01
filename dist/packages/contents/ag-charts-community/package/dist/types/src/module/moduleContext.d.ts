import type { StateManager } from '../api/state/stateManager';
import type { AnnotationManager } from '../chart/annotation/annotationManager';
import type { AxisManager } from '../chart/axis/axisManager';
import type { ChartService } from '../chart/chartService';
import type { DataService } from '../chart/data/dataService';
import type { DOMManager } from '../chart/dom/domManager';
import type { FocusIndicator } from '../chart/dom/focusIndicator';
import type { ProxyInteractionService } from '../chart/dom/proxyInteractionService';
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
import type { LocaleManager } from '../chart/locale/localeManager';
import type { SeriesStateManager } from '../chart/series/seriesStateManager';
import type { UpdateService } from '../chart/updateService';
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
    readonly axisManager: AxisManager;
    readonly animationManager: AnimationManager;
    readonly annotationManager: AnnotationManager;
    readonly ariaAnnouncementService: AriaAnnouncementService;
    readonly chartEventManager: ChartEventManager;
    readonly contextMenuRegistry: ContextMenuRegistry;
    readonly cursorManager: CursorManager;
    readonly domManager: DOMManager;
    readonly focusIndicator: FocusIndicator;
    readonly highlightManager: HighlightManager;
    readonly interactionManager: InteractionManager;
    readonly localeManager: LocaleManager;
    readonly proxyInteractionService: ProxyInteractionService;
    readonly regionManager: RegionManager;
    readonly seriesStateManager: SeriesStateManager;
    readonly stateManager: StateManager;
    readonly syncManager: SyncManager;
    readonly toolbarManager: ToolbarManager;
    readonly tooltipManager: TooltipManager;
    readonly zoomManager: ZoomManager;
}
export interface ModuleContextWithParent<P> extends ModuleContext {
    parent: P;
}
export interface SeriesContext extends ModuleContext {
    series: {
        type: string;
    };
}
