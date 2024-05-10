import type { ModuleContext } from '../module/moduleContext';
import type { Group } from '../scene/group';
import { Scene } from '../scene/scene';
import { CallbackCache } from '../util/callbackCache';
import type { Mutex } from '../util/mutex';
import { AnnotationManager } from './annotation/annotationManager';
import type { ChartService } from './chartService';
import { DataService } from './data/dataService';
import { DOMManager } from './dom/domManager';
import { FocusIndicator } from './dom/focusIndicator';
import { ProxyInteractionService } from './dom/proxyInteractionService';
import { AnimationManager } from './interaction/animationManager';
import { AriaAnnouncementService } from './interaction/ariaAnnouncementServices';
import { ChartEventManager } from './interaction/chartEventManager';
import { ContextMenuRegistry } from './interaction/contextMenuRegistry';
import { CursorManager } from './interaction/cursorManager';
import { GestureDetector } from './interaction/gestureDetector';
import { HighlightManager } from './interaction/highlightManager';
import { InteractionManager } from './interaction/interactionManager';
import { KeyNavManager } from './interaction/keyNavManager';
import { RegionManager } from './interaction/regionManager';
import type { SyncManager } from './interaction/syncManager';
import { ToolbarManager } from './interaction/toolbarManager';
import { TooltipManager } from './interaction/tooltipManager';
import type { ZoomManager } from './interaction/zoomManager';
import type { Keyboard } from './keyboard';
import { LayoutService } from './layout/layoutService';
import { SeriesStateManager } from './series/seriesStateManager';
import type { Tooltip } from './tooltip/tooltip';
import { type UpdateCallback, UpdateService } from './updateService';

export class ChartContext implements ModuleContext {
    scene: Scene;

    callbackCache: CallbackCache;
    gestureDetector: GestureDetector;

    chartService: ChartService;
    dataService: DataService<any>;
    layoutService: LayoutService;
    updateService: UpdateService;

    animationManager: AnimationManager;
    annotationManager: AnnotationManager;
    ariaAnnouncementService: AriaAnnouncementService;
    chartEventManager: ChartEventManager;
    contextMenuRegistry: ContextMenuRegistry;
    cursorManager: CursorManager;
    domManager: DOMManager;
    focusIndicator: FocusIndicator;
    highlightManager: HighlightManager;
    interactionManager: InteractionManager;
    keyNavManager: KeyNavManager;
    proxyInteractionService: ProxyInteractionService;
    regionManager: RegionManager;
    seriesStateManager: SeriesStateManager;
    syncManager: SyncManager;
    toolbarManager: ToolbarManager;
    tooltipManager: TooltipManager;
    zoomManager: ZoomManager;

    constructor(
        chart: ChartService & { zoomManager: ZoomManager; annotationRoot: Group; keyboard: Keyboard; tooltip: Tooltip },
        vars: {
            scene?: Scene;
            syncManager: SyncManager;
            container?: HTMLElement;
            updateCallback: UpdateCallback;
            updateMutex: Mutex;
            overrideDevicePixelRatio?: number;
        }
    ) {
        const { scene, syncManager, container, updateCallback, updateMutex, overrideDevicePixelRatio } = vars;
        this.chartService = chart;
        this.syncManager = syncManager;
        this.zoomManager = chart.zoomManager;
        this.domManager = new DOMManager(container);
        scene?.setContainer(this.domManager);
        this.scene = scene ?? new Scene({ pixelRatio: overrideDevicePixelRatio, domManager: this.domManager });

        this.annotationManager = new AnnotationManager(chart.annotationRoot);
        this.ariaAnnouncementService = new AriaAnnouncementService(this.scene.canvas.element);
        this.chartEventManager = new ChartEventManager();
        this.contextMenuRegistry = new ContextMenuRegistry();
        this.cursorManager = new CursorManager(this.domManager);
        this.highlightManager = new HighlightManager();
        this.interactionManager = new InteractionManager(chart.keyboard, this.domManager);
        this.keyNavManager = new KeyNavManager(this.interactionManager, this.domManager);
        this.focusIndicator = new FocusIndicator(this.domManager);
        this.regionManager = new RegionManager(this.interactionManager, this.keyNavManager, this.focusIndicator);
        this.proxyInteractionService = new ProxyInteractionService(this.domManager, this.focusIndicator);
        this.toolbarManager = new ToolbarManager();
        this.gestureDetector = new GestureDetector(this.domManager);
        this.layoutService = new LayoutService();
        this.updateService = new UpdateService(updateCallback);
        this.seriesStateManager = new SeriesStateManager();
        this.callbackCache = new CallbackCache();

        this.animationManager = new AnimationManager(this.interactionManager, updateMutex);
        this.animationManager.skip();
        this.animationManager.play();

        this.dataService = new DataService<any>(this.animationManager);
        this.tooltipManager = new TooltipManager(this.domManager, chart.tooltip);
    }

    destroy() {
        // chart.ts handles the destruction of the scene and zoomManager.
        this.tooltipManager.destroy();
        this.proxyInteractionService.destroy();
        this.regionManager.destroy();
        this.focusIndicator.destroy();
        this.keyNavManager.destroy();
        this.interactionManager.destroy();
        this.animationManager.stop();
        this.animationManager.destroy();
        this.ariaAnnouncementService.destroy();
        this.chartEventManager.destroy();
        this.highlightManager.destroy();
        this.callbackCache.invalidateCache();
        this.animationManager.reset();
        this.syncManager.destroy();
        this.domManager.destroy();
    }
}
