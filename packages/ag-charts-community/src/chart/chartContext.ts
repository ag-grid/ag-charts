import type { ModuleContext } from '../module/moduleContext';
import type { Group } from '../scene/group';
import { Scene } from '../scene/scene';
import { CallbackCache } from '../util/callbackCache';
import { ObjectDestroyer } from '../util/destroy';
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

    private readonly owned: ObjectDestroyer;

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

        // Sonar does not like us using assignments in expression, however this is intended.
        // We want to use assignments so that the Typescript compiler can check that we are not using an
        // uninitialised property, but we also want to guarantee that ObjectDestroyer knows the
        // initialisation order so that it can destroy the objects in reverse.
        this.owned = new ObjectDestroyer(
            this.domManager,
            (this.annotationManager = new AnnotationManager(chart.annotationRoot)), // NOSONAR
            (this.ariaAnnouncementService = new AriaAnnouncementService(this.scene.canvas.element)), // NOSONAR
            (this.chartEventManager = new ChartEventManager()), // NOSONAR
            (this.contextMenuRegistry = new ContextMenuRegistry()), // NOSONAR
            (this.cursorManager = new CursorManager(this.domManager)), // NOSONAR
            (this.highlightManager = new HighlightManager()), // NOSONAR
            (this.interactionManager = new InteractionManager(chart.keyboard, this.domManager)), // NOSONAR
            (this.keyNavManager = new KeyNavManager(this.interactionManager, this.domManager)), // NOSONAR
            (this.focusIndicator = new FocusIndicator(this.domManager)), // NOSONAR
            (this.regionManager = new RegionManager(this.interactionManager, this.keyNavManager, this.focusIndicator)), // NOSONAR
            (this.toolbarManager = new ToolbarManager()), // NOSONAR
            (this.gestureDetector = new GestureDetector(this.domManager)), // NOSONAR
            (this.layoutService = new LayoutService()), // NOSONAR
            (this.updateService = new UpdateService(updateCallback)), // NOSONAR
            (this.proxyInteractionService = new ProxyInteractionService(this.updateService, this.focusIndicator)), // NOSONAR
            (this.seriesStateManager = new SeriesStateManager()), // NOSONAR
            (this.callbackCache = new CallbackCache()), // NOSONAR
            (this.animationManager = this.createAnimationManager(this.interactionManager, updateMutex)), // NOSONAR
            (this.dataService = new DataService<any>(this.animationManager)), // NOSONAR
            (this.tooltipManager = new TooltipManager(this.domManager, chart.tooltip)) // NOSONAR
        );
    }

    private createAnimationManager(interactionManager: InteractionManager, updateMutex: Mutex): AnimationManager {
        const animationManager = new AnimationManager(interactionManager, updateMutex);
        animationManager.skip();
        animationManager.play();
        return animationManager;
    }

    destroy() {
        // chart.ts handles the destruction of the scene and zoomManager.
        this.owned.destroy();
    }
}
