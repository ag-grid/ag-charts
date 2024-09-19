import { HistoryManager } from '../api/state/historyManager';
import { StateManager } from '../api/state/stateManager';
import { DOMManager } from '../dom/domManager';
import { FocusIndicator } from '../dom/focusIndicator';
import { ProxyInteractionService } from '../dom/proxyInteractionService';
import { LocaleManager } from '../locale/localeManager';
import type { ModuleContext } from '../module/moduleContext';
import type { Group } from '../scene/group';
import { Scene } from '../scene/scene';
import { CallbackCache } from '../util/callbackCache';
import { Destructible, weak } from '../util/destroy';
import type { Mutex } from '../util/mutex';
import { AnnotationManager } from './annotation/annotationManager';
import { AxisManager } from './axis/axisManager';
import type { ChartService } from './chartService';
import { DataService } from './data/dataService';
import { AnimationManager } from './interaction/animationManager';
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
import { ZoomManager } from './interaction/zoomManager';
import type { Keyboard } from './keyboard';
import { LayoutManager } from './layout/layoutManager';
import { SeriesStateManager } from './series/seriesStateManager';
import type { Tooltip } from './tooltip/tooltip';
import { type UpdateCallback, UpdateService } from './updateService';

export class ChartContext extends Destructible implements ModuleContext {
    readonly callbackCache = new CallbackCache();
    readonly chartEventManager = new ChartEventManager();
    readonly highlightManager = new HighlightManager();
    readonly layoutManager = new LayoutManager();
    readonly localeManager = new LocaleManager();
    readonly seriesStateManager = new SeriesStateManager();
    readonly stateManager = new StateManager();
    readonly toolbarManager = new ToolbarManager();
    readonly zoomManager = new ZoomManager();

    animationManager: AnimationManager;
    annotationManager: AnnotationManager;
    axisManager: AxisManager;
    chartService: ChartService;
    contextMenuRegistry: ContextMenuRegistry;
    cursorManager: CursorManager;
    dataService: DataService<any>;
    domManager: DOMManager;
    focusIndicator: FocusIndicator;
    gestureDetector: GestureDetector;
    historyManager: HistoryManager;
    interactionManager: InteractionManager;
    keyNavManager: KeyNavManager;
    proxyInteractionService: ProxyInteractionService;
    regionManager: RegionManager;
    @weak scene: Scene;
    syncManager: SyncManager;
    tooltipManager: TooltipManager;
    updateService: UpdateService;

    constructor(
        chart: ChartService & { annotationRoot: Group; keyboard: Keyboard; tooltip: Tooltip },
        vars: {
            scene?: Scene;
            root: Group;
            syncManager: SyncManager;
            container?: HTMLElement;
            updateCallback: UpdateCallback;
            updateMutex: Mutex;
            pixelRatio?: number;
        }
    ) {
        super();
        const { scene, root, syncManager, container, updateCallback, updateMutex, pixelRatio } = vars;

        this.chartService = chart;
        this.syncManager = syncManager;
        this.domManager = new DOMManager(container);

        // Sets canvas element if scene exists, otherwise use return value with scene constructor
        const canvasElement = this.domManager.addChild(
            'canvas',
            'scene-canvas',
            scene?.canvas.element
        ) as HTMLCanvasElement;

        this.scene = scene ?? new Scene({ pixelRatio, canvasElement });
        this.scene.setRoot(root);

        this.axisManager = new AxisManager(root);
        this.annotationManager = new AnnotationManager(chart.annotationRoot);
        this.cursorManager = new CursorManager(this.domManager);
        this.interactionManager = new InteractionManager(chart.keyboard, this.domManager);
        this.keyNavManager = new KeyNavManager(this.interactionManager);
        this.focusIndicator = new FocusIndicator(this.domManager);
        this.regionManager = new RegionManager(this.interactionManager);
        this.contextMenuRegistry = new ContextMenuRegistry(this.regionManager);
        this.gestureDetector = new GestureDetector(this.domManager);
        this.updateService = new UpdateService(updateCallback);
        this.proxyInteractionService = new ProxyInteractionService(this.localeManager, this.domManager);
        this.historyManager = new HistoryManager(this.domManager);
        this.animationManager = new AnimationManager(this.interactionManager, updateMutex);
        this.dataService = new DataService<any>(this.animationManager);
        this.tooltipManager = new TooltipManager(this.domManager, chart.tooltip);

        this.zoomManager.addLayoutListeners(this.layoutManager);
    }

    protected override destructor() {}
}
