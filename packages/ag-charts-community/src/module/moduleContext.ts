import { AgDocument, type CallbackCache } from 'ag-charts-core';

import type { HistoryManager } from '../api/state/historyManager';
import type { StateManager } from '../api/state/stateManager';
import type { AnnotationManager } from '../chart/annotation/annotationManager';
import type { AxisManager } from '../chart/axis/axisManager';
import type { ChartService } from '../chart/chartService';
import type { DataService } from '../chart/data/dataService';
import type { FormatManager } from '../chart/formatter/formatManager';
import type { ActiveManager } from '../chart/interaction/activeManager';
import type { AnimationManager } from '../chart/interaction/animationManager';
import type { ContextMenuRegistry } from '../chart/interaction/contextMenuRegistry';
import type { HighlightManager } from '../chart/interaction/highlightManager';
import type { InteractionManager } from '../chart/interaction/interactionManager';
import type { SyncManager } from '../chart/interaction/syncManager';
import type { TooltipManager } from '../chart/interaction/tooltipManager';
import type { WidgetSet } from '../chart/interaction/widgetSet';
import type { ZoomManager } from '../chart/interaction/zoomManager';
import type { LayoutManager } from '../chart/layout/layoutManager';
import type { SeriesLabelLayoutManager } from '../chart/layout/seriesLabelLayoutManager';
import type { LegendManager } from '../chart/legend/legendManager';
import type { OptionsGraphService } from '../chart/optionsGraphService';
import type { SeriesStateManager } from '../chart/series/seriesStateManager';
import type { UpdateService } from '../chart/updateService';
import type { EventsHub } from '../core/eventsHub';
import type { DOMManager } from '../dom/domManager';
import type { ProxyInteractionService } from '../dom/proxyInteractionService';
import type { LocaleManager } from '../locale/localeManager';
import type { Scene } from '../scene/scene';

export interface ModuleContext {
    readonly scene: Scene;

    readonly agDocument: AgDocument;
    readonly eventsHub: EventsHub;
    readonly callbackCache: CallbackCache;

    readonly chartService: ChartService;
    readonly dataService: DataService<any>;
    readonly layoutManager: LayoutManager;
    readonly optionsGraphService: OptionsGraphService;
    readonly updateService: UpdateService;

    readonly axisManager: AxisManager;
    readonly legendManager: LegendManager;

    readonly activeManager: ActiveManager;
    readonly animationManager: AnimationManager;
    readonly annotationManager: AnnotationManager;
    readonly contextMenuRegistry: ContextMenuRegistry;
    readonly formatManager: FormatManager;
    readonly domManager: DOMManager;
    readonly highlightManager: HighlightManager;
    readonly historyManager: HistoryManager;
    readonly interactionManager: InteractionManager;
    readonly localeManager: LocaleManager;
    readonly proxyInteractionService: ProxyInteractionService;
    readonly seriesStateManager: SeriesStateManager;
    readonly seriesLabelLayoutManager: SeriesLabelLayoutManager;
    readonly stateManager: StateManager;
    readonly syncManager: SyncManager;
    readonly tooltipManager: TooltipManager;
    readonly widgets: WidgetSet;
    readonly zoomManager: ZoomManager;
}

export interface ModuleContextWithParent<P> extends ModuleContext {
    parent: P;
}

export interface SeriesContext extends ModuleContext {
    series: { type: string };
}
