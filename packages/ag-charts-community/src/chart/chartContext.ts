import {
    AgDocument,
    CallbackCache,
    CleanupRegistry,
    EventEmitter,
    ModuleRegistry,
    ModuleType,
    ReactiveState,
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
import type { ChartState } from './chartState';
import { DataService } from './data/dataService';
import type { ChartType } from './factory/expectedModules';
import { FontManager } from './fonts/fontManager';
import { FormatManager } from './formatter/formatManager';
import { ActiveManager } from './interaction/activeManager';
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

export class ChartContext implements ModuleContext {
    readonly eventsHub = new EventEmitter<EventsHubMap>();

    readonly callbackCache = new CallbackCache();
    readonly chartState = new ReactiveState<ChartState>();
    readonly highlightManager: HighlightManager;
    readonly formatManager = new FormatManager();
    readonly layoutManager = new LayoutManager(this.eventsHub);
    readonly localeManager = new LocaleManager(this.eventsHub);
    readonly seriesStateManager = new SeriesStateManager();
    readonly stateManager = new StateManager();
    readonly seriesLabelLayoutManager = new SeriesLabelLayoutManager();
    readonly cleanup = new CleanupRegistry();

    readonly activeManager: ActiveManager;
    readonly annotationRoot: Group;
    readonly fireEvent: <TEvent extends TypedEvent>(event: TEvent) => void;
    animationManager: AnimationManager;
    annotationManager: AnnotationManager;
    axisManager: AxisManager;
    legendManager: LegendManager;
    chartService: ChartService;
    chartTypeOriginator: ChartTypeOriginator;
    contextMenuRegistry: ContextMenuRegistry;
    dataService: DataService<any>;
    agDocument: AgDocument;
    domManager: DOMManager;
    fontManager: FontManager;
    historyManager: HistoryManager;
    interactionManager: InteractionManager;
    optionsGraphService: OptionsGraphService;
    proxyInteractionService: ProxyInteractionService;
    scene: Scene;
    syncManager: SyncManager;
    tooltipManager: TooltipManager;
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
            agDocument: AgDocument;
            styleContainer?: HTMLElement;
            skipCss?: boolean;
            domMode?: 'normal' | 'minimal';
            withDragInterpretation: boolean;
            fireEvent: <TEvent extends TypedEvent>(event: TEvent) => void;
            updateMutex: Mutex;
        }
    ) {
        const {
            scene,
            root,
            syncManager,
            agDocument,
            container,
            fireEvent,
            updateMutex,
            styleContainer,
            skipCss,
            chartType,
            domMode,
            withDragInterpretation,
        } = vars;

        this.chartService = chart;
        this.syncManager = syncManager;
        this.agDocument = agDocument;
        this.fireEvent = fireEvent;
        this.annotationRoot = chart.annotationRoot;
        this.highlightManager = new HighlightManager(this);
        this.domManager = new DOMManager(
            this.eventsHub,
            this.chartService,
            this.agDocument,
            container,
            styleContainer,
            skipCss,
            domMode
        );
        this.widgets = new WidgetSet(this.domManager, { withDragInterpretation });

        const localWindow = this.agDocument.window;

        // Sets canvas element if scene exists, otherwise use return value with scene constructor
        const canvasElement = this.domManager.addChild(
            'canvas',
            'scene-canvas',
            scene?.canvas.element
        ) as HTMLCanvasElement & StrictHTMLElement;

        this.scene = scene ?? new Scene({ canvasElement, pixelRatio: localWindow.devicePixelRatio ?? 1 });
        this.scene.setRoot(root);

        this.chartState.setValue('activeItem', undefined);
        this.chartState.setValue('highlight', undefined);
        this.chartState.setValue('legendData', {});
        this.chartState.setValue('legendVisible', true);

        this.axisManager = new AxisManager(this.eventsHub, root);
        this.legendManager = new LegendManager(this);
        this.annotationManager = new AnnotationManager(this);
        this.chartTypeOriginator = new ChartTypeOriginator(chart);
        this.interactionManager = new InteractionManager();
        this.contextMenuRegistry = new ContextMenuRegistry(this);
        this.optionsGraphService = new OptionsGraphService();
        this.activeManager = new ActiveManager(this);
        this.proxyInteractionService = new ProxyInteractionService(this);
        this.fontManager = new FontManager(this);
        this.historyManager = new HistoryManager(this);
        this.animationManager = new AnimationManager(this.agDocument, this.interactionManager, updateMutex);
        this.dataService = new DataService<any>(this.eventsHub, chart, this.animationManager);
        this.tooltipManager = new TooltipManager(this.eventsHub, this.localeManager, this.domManager, chart.tooltip);
        this.zoomManager = new ZoomManager(this);

        for (const module of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
            if (!module.chartType || module.chartType === chartType) {
                module.patchContext?.(this);
            }
        }
    }

    destroy() {
        // chart.ts handles the destruction of the scene.
        this.chartState.destroy();
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
