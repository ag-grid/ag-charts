import {
    CallbackCache,
    CleanupRegistry,
    EventEmitter,
    ModuleRegistry,
    ModuleType,
    type StrictHTMLElement,
} from 'ag-charts-core';

import { ChartTypeOriginator } from '../api/preset/chartTypeOriginator';
import { HistoryManager } from '../api/state/historyManager';
import { StateManager } from '../api/state/stateManager';
import type { EventsHubMap } from '../core/eventsHub';
import { DOMManager } from '../dom/domManager';
import { ProxyInteractionService } from '../dom/proxyInteractionService';
import { LocaleManager } from '../locale/localeManager';
import type { ModuleContext } from '../module/moduleContext';
import type { Group } from '../scene/group';
import { Scene } from '../scene/scene';
import type { Mutex } from '../util/mutex';
import type { TypedEvent } from '../util/observable';
import { AnnotationManager } from './annotation/annotationManager';
import { AxisManager } from './axis/axisManager';
import type { ChartService } from './chartService';
import { ChartUpdateType } from 'ag-charts-core';
import { DataService } from './data/dataService';
import type { ChartType } from './factory/expectedModules';
import { FontManager } from './fonts/fontManager';
import { FormatManager } from './formatter/formatManager';
import { AnimationManager } from './interaction/animationManager';
import { ContextMenuRegistry } from './interaction/contextMenuRegistry';
import { HighlightManager } from './interaction/highlightManager';
import { InteractionManager } from './interaction/interactionManager';
import type { SyncManager } from './interaction/syncManager';
import { TooltipManager } from './interaction/tooltipManager';
import { WidgetSet } from './interaction/widgetSet';
import { ZoomManager } from './interaction/zoomManager';
import { LayoutManager } from './layout/layoutManager';
import { SeriesLabelLayoutManager } from './layout/seriesLabelLayoutManager';
import { LegendManager } from './legend/legendManager';
import { OptionsGraphService } from './optionsGraphService';
import { SeriesStateManager } from './series/seriesStateManager';
import type { Tooltip } from './tooltip/tooltip';
import { type UpdateCallback, UpdateService } from './updateService';

export class ChartContext implements ModuleContext {
    readonly eventsHub = new EventEmitter<EventsHubMap>();

    readonly callbackCache = new CallbackCache();
    readonly highlightManager = new HighlightManager(this.eventsHub);
    readonly formatManager = new FormatManager();
    readonly layoutManager = new LayoutManager(this.eventsHub);
    readonly localeManager = new LocaleManager(this.eventsHub);
    readonly seriesStateManager = new SeriesStateManager();
    readonly stateManager = new StateManager();
    readonly seriesLabelLayoutManager = new SeriesLabelLayoutManager();
    readonly cleanup = new CleanupRegistry();

    animationManager: AnimationManager;
    annotationManager: AnnotationManager;
    axisManager: AxisManager;
    legendManager: LegendManager;
    chartService: ChartService;
    chartTypeOriginator: ChartTypeOriginator;
    contextMenuRegistry: ContextMenuRegistry;
    dataService: DataService<any>;
    domManager: DOMManager;
    fontManager: FontManager;
    historyManager: HistoryManager;
    interactionManager: InteractionManager;
    optionsGraphService: OptionsGraphService;
    proxyInteractionService: ProxyInteractionService;
    scene: Scene;
    syncManager: SyncManager;
    tooltipManager: TooltipManager;
    updateService: UpdateService;
    widgets: WidgetSet;
    zoomManager: ZoomManager;

    constructor(
        chart: ChartService & { annotationRoot: Group; tooltip: Tooltip },
        vars: {
            chartType: ChartType;
            scene?: Scene;
            root: Group;
            syncManager: SyncManager;
            container?: HTMLElement;
            styleContainer?: HTMLElement;
            domMode?: 'normal' | 'minimal';
            withDragInterpretation: boolean;
            fireEvent: <TEvent extends TypedEvent>(event: TEvent) => void;
            updateCallback: UpdateCallback;
            updateMutex: Mutex;
        }
    ) {
        const {
            scene,
            root,
            syncManager,
            container,
            fireEvent,
            updateCallback,
            updateMutex,
            styleContainer,
            chartType,
            domMode,
            withDragInterpretation,
        } = vars;

        this.chartService = chart;
        this.syncManager = syncManager;
        this.domManager = new DOMManager(this.eventsHub, this.chartService, container, styleContainer, domMode);
        this.widgets = new WidgetSet(this.domManager, { withDragInterpretation });

        // Sets canvas element if scene exists, otherwise use return value with scene constructor
        const canvasElement = this.domManager.addChild(
            'canvas',
            'scene-canvas',
            scene?.canvas.element
        ) as HTMLCanvasElement & StrictHTMLElement;

        this.scene = scene ?? new Scene({ canvasElement });
        this.scene.setRoot(root);
        this.cleanup.register(
            this.scene.on('scene-changed', () => {
                this.updateService.update(ChartUpdateType.SCENE_RENDER);
            })
        );

        this.axisManager = new AxisManager(this.eventsHub, root);
        this.legendManager = new LegendManager(this.eventsHub);
        this.annotationManager = new AnnotationManager(this.eventsHub, chart.annotationRoot, fireEvent);
        this.chartTypeOriginator = new ChartTypeOriginator(chart);
        this.interactionManager = new InteractionManager();
        this.contextMenuRegistry = new ContextMenuRegistry(this.eventsHub);
        this.optionsGraphService = new OptionsGraphService();
        this.updateService = new UpdateService(updateCallback);
        this.proxyInteractionService = new ProxyInteractionService(this.eventsHub, this.localeManager, this.domManager);
        this.fontManager = new FontManager(this.domManager, this.updateService);
        this.historyManager = new HistoryManager(this.eventsHub);
        this.animationManager = new AnimationManager(this.interactionManager, updateMutex);
        this.dataService = new DataService<any>(this.eventsHub, chart, this.animationManager);
        this.tooltipManager = new TooltipManager(this.eventsHub, this.localeManager, this.domManager, chart.tooltip);
        this.zoomManager = new ZoomManager(this.eventsHub, this.updateService, fireEvent);

        for (const module of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
            if (!module.chartType || module.chartType === chartType) {
                module.patchContext?.(this);
            }
        }
    }

    destroy() {
        // chart.ts handles the destruction of the scene.
        this.animationManager.destroy();
        this.axisManager.destroy();
        this.callbackCache.invalidateCache();
        this.domManager.destroy();
        this.fontManager.destroy();
        this.proxyInteractionService.destroy();
        this.tooltipManager.destroy();
        this.zoomManager.destroy();
        this.widgets.destroy();
        this.cleanup.flush();
    }
}
