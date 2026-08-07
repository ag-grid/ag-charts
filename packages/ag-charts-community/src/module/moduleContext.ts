import { AgDocument, type CallbackCache, type Logger, type ReactiveState } from 'ag-charts-core';

import type { ChartTypeOriginator } from '../api/preset/chartTypeOriginator';
import type { HistoryManager } from '../api/state/historyManager';
import type { StateManager } from '../api/state/stateManager';
import type { AnnotationManager } from '../chart/annotation/annotationManager';
import type { AxisManager } from '../chart/axis/axisManager';
import type { ChartService } from '../chart/chartService';
import type { ChartState } from '../chart/chartState';
import type { CrossLine } from '../chart/crossline/crossLine';
import type { IDataSelectionService } from '../chart/data/dataSelectionServiceTypes';
import type { DataService } from '../chart/data/dataService';
import type { FontManager } from '../chart/fonts/fontManager';
import type { FormatManager } from '../chart/formatter/formatManager';
import type { ActiveManager } from '../chart/interaction/activeManager';
import type { AnimationManager } from '../chart/interaction/animationManager';
import type { CollapsedManager } from '../chart/interaction/collapsedManager';
import type { ContextMenuRegistry } from '../chart/interaction/contextMenuRegistry';
import type { HighlightManager } from '../chart/interaction/highlightManager';
import type { InteractionManager } from '../chart/interaction/interactionManager';
import type { SyncManager } from '../chart/interaction/syncManager';
import type { TooltipManager } from '../chart/interaction/tooltipManager';
import type { WidgetSet } from '../chart/interaction/widgetSet';
import type { ZoomManager } from '../chart/interaction/zoomManager';
import type { LabelManager } from '../chart/layout/labelManager';
import type { LayoutManager } from '../chart/layout/layoutManager';
import type { LegendManager } from '../chart/legend/legendManager';
import type { OptionsGraphService } from '../chart/optionsGraphService';
import type { SeriesStateManager } from '../chart/series/seriesStateManager';
import type { EventsHub } from '../core/eventsHub';
import type { DOMManager } from '../dom/domManager';
import type { ProxyInteractionService } from '../dom/proxyInteractionService';
import type { LocaleManager } from '../locale/localeManager';
import type { Group } from '../scene/group';
import type { Scene } from '../scene/scene';

/**
 * Minimal contract for a shared toolbar instance registered by enterprise plugins.
 * Enterprise modules provide the concrete implementation; community only relies on
 * the destroy cascade. Consumers that need the full toolbar API cast at the use site.
 * TODO: widen this interface once the generic return-type mismatch with the enterprise
 * `SharedToolbar.getSharedToolbar<ButtonOptions>` signature can be resolved.
 */
export interface SharedToolbarLike {
    destroy(): void;
}

/**
 * Typed registry enumerating every service exposed by the chart's DynamicContext.
 * This is the source of truth for the chart's service surface — both reads
 * (`ctx.foo`) and registrations (`ctx.service('foo', ...)`) are constrained by it.
 */
export interface ChartRegistry {
    readonly scene: Scene;
    readonly annotationRoot: Group;

    readonly agDocument: AgDocument;
    readonly eventsHub: EventsHub;
    readonly callbackCache: CallbackCache;
    readonly logger: Logger;

    readonly chartService: ChartService;
    readonly chartTypeOriginator: ChartTypeOriginator;
    readonly dataService: DataService<any>;
    readonly dataSelectionService?: IDataSelectionService;
    readonly layoutManager: LayoutManager;
    readonly optionsGraphService: OptionsGraphService;

    readonly axisManager: AxisManager;
    readonly chartState: ReactiveState<ChartState>;
    readonly legendManager?: LegendManager;

    readonly activeManager: ActiveManager;
    readonly animationManager: AnimationManager;
    readonly annotationManager?: AnnotationManager;
    readonly collapsedManager: CollapsedManager;
    readonly contextMenuRegistry?: ContextMenuRegistry;
    readonly formatManager: FormatManager;
    readonly domManager: DOMManager;
    readonly fontManager: FontManager;
    readonly highlightManager: HighlightManager;
    readonly historyManager: HistoryManager;
    readonly interactionManager: InteractionManager;
    readonly localeManager: LocaleManager;
    readonly proxyInteractionService: ProxyInteractionService;
    readonly seriesStateManager: SeriesStateManager;
    readonly labelManager: LabelManager;
    readonly stateManager: StateManager;
    readonly syncManager: SyncManager;
    readonly tooltipManager: TooltipManager;
    readonly widgets: WidgetSet;
    readonly zoomManager?: ZoomManager;

    readonly sharedToolbar?: SharedToolbarLike;
}

export interface ChartAxisRegistry<P> extends ChartRegistry {
    parent: P;
    /**
     * Per-axis cross-line factory installed by the owning cross-lines module's `register` hook.
     * Each access (`ctx.crossLine`) yields a fresh instance via `DynamicContext.factory()`.
     * Community `CrossLinesModule` installs the cartesian implementation on cartesian axes;
     * enterprise `PolarCrossLinesModule` installs a polar-aware factory on polar axes.
     */
    crossLine: CrossLine;
}

export interface ChartSeriesRegistry extends ChartRegistry {
    series: { type: string };
}
