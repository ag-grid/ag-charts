import {
    AgDocument,
    CallbackCache,
    type DynamicContext,
    EventEmitter,
    type Logger,
    ModuleRegistry,
    ModuleType,
    ReactiveState,
    type StrictHTMLElement,
    createDynamicContext,
} from 'ag-charts-core';

import { ChartTypeOriginator } from '../api/preset/chartTypeOriginator';
import { HistoryManager } from '../api/state/historyManager';
import { StateManager } from '../api/state/stateManager';
import type { EventsHubMap } from '../core/eventsHub';
import { DOMManager } from '../dom/domManager';
import { ProxyInteractionService } from '../dom/proxyInteractionService';
import { LocaleManager } from '../locale/localeManager';
import type { ChartRegistry } from '../module/moduleContext';
import type { Group } from '../scene/group';
import { Scene } from '../scene/scene';
import type { Mutex } from '../util/mutex';
import type { TypedEvent } from '../util/observable';
import { AxisManager } from './axis/axisManager';
import type { ChartService } from './chartService';
import type { ChartState } from './chartState';
import type { ChartType } from './chartType';
import { DataService } from './data/dataService';
import { FontManager } from './fonts/fontManager';
import { FormatManager } from './formatter/formatManager';
import { ActiveManager } from './interaction/activeManager';
import { AnimationManager } from './interaction/animationManager';
import { CollapsedManager } from './interaction/collapsedManager';
import { HighlightManager } from './interaction/highlightManager';
import { InteractionManager } from './interaction/interactionManager';
import type { SyncManager } from './interaction/syncManager';
import { TooltipManager } from './interaction/tooltipManager';
import { WidgetSet } from './interaction/widgetSet';
import { ZoomManager } from './interaction/zoomManager';
import { LabelManager } from './layout/labelManager';
import { LayoutManager } from './layout/layoutManager';
import { OptionsGraphService } from './optionsGraphService';
import { SeriesStateManager } from './series/seriesStateManager';
import type { Tooltip } from './tooltip/tooltip';

export interface ChartContextVars {
    chartType: ChartType;
    scene?: Scene;
    root: Group;
    syncManager: SyncManager;
    container?: HTMLElement;
    agDocument: AgDocument;
    styleContainer?: HTMLElement;
    styleNonce?: string;
    skipCss?: boolean;
    domMode?: 'normal' | 'minimal';
    withDragInterpretation: boolean;
    fireEvent: <TEvent extends TypedEvent>(event: TEvent) => void;
    logger: Logger;
    updateMutex: Mutex;
    cssVariables?: Record<string, string>;
}

type ChartHost = ChartService & { annotationRoot: Group; tooltip: Tooltip };

export function createChartContext(chart: ChartHost, vars: ChartContextVars): DynamicContext<ChartRegistry> {
    const ctx = createDynamicContext<ChartRegistry>();

    // Eager construction for services that must be alive from t=0 (DOM/canvas setup,
    // seeded state, chart inputs). Every other service is lazy — see the `.service(...)`
    // block below. Order matters for destroy-cascade: entries registered later are
    // destroyed earlier (DynamicContext.destroy iterates in reverse-insertion order),
    // so dependents tear down before their dependencies.
    const eventsHub = new EventEmitter<EventsHubMap>();

    const chartState = new ReactiveState<ChartState>();
    chartState.setValue('activeItem', undefined);
    chartState.setValue('highlight', undefined);
    chartState.setValue('legendData', {});
    chartState.setValue('legendVisible', true);

    const domManager = new DOMManager(
        eventsHub,
        vars.styleNonce,
        vars.agDocument,
        vars.container,
        vars.styleContainer,
        vars.skipCss,
        vars.domMode,
        vars.cssVariables
    );
    const canvasElement = domManager.addChild(
        'canvas',
        'scene-canvas',
        vars.scene?.canvas.element
    ) as HTMLCanvasElement & StrictHTMLElement;
    const scene =
        vars.scene ??
        new Scene({ canvasElement, pixelRatio: vars.agDocument.window.devicePixelRatio ?? 1 }, vars.logger);
    scene.setRoot(vars.root);

    // Owned by the options processing that created it and shared with the chart that replaces this
    // one on a type switch, so it must outlive this context's destroy cascade.
    ctx.ref('logger', vars.logger)
        .constant('eventsHub', eventsHub)
        .constant('agDocument', vars.agDocument)
        // The chart is the host — it manages its own lifecycle and the context's.
        // Registering as `ref` keeps it readable via `ctx.chartService` without the
        // destroy cascade looping back into `chart.destroy()`.
        .ref('chartService', chart)
        .ref('annotationRoot', chart.annotationRoot)
        .constant('fireEvent', vars.fireEvent)
        .constant('syncManager', vars.syncManager)
        .constant('chartState', chartState)
        .constant('domManager', domManager)
        // Scene lifecycle is managed by `Chart.destroy()` — it may strip-without-destroy
        // when transferable resources are preserved across chart-type switches.
        .ref('scene', scene);

    ctx.service('callbackCache', (c) => new CallbackCache(c.logger))
        .service('formatManager', () => new FormatManager())
        .service('seriesStateManager', () => new SeriesStateManager())
        .service('stateManager', (c) => new StateManager(c.logger))
        .service('labelManager', () => new LabelManager())
        .service('interactionManager', () => new InteractionManager())
        .service('optionsGraphService', (c) => new OptionsGraphService(c.logger))
        .service('chartTypeOriginator', (c) => new ChartTypeOriginator(chart, c.logger))
        .service('widgets', (c) => new WidgetSet(c, { withDragInterpretation: vars.withDragInterpretation }))
        .service('axisManager', (c) => new AxisManager(c.eventsHub, vars.root))
        .service('highlightManager', (c) => new HighlightManager(c))
        .service('layoutManager', (c) => new LayoutManager(c.eventsHub))
        .service('localeManager', (c) => new LocaleManager(c.eventsHub))
        .service('historyManager', (c) => new HistoryManager(c))
        .service('collapsedManager', (c) => new CollapsedManager(c.eventsHub, c.chartService))
        .service(
            'animationManager',
            (c) => new AnimationManager(c.agDocument, c.interactionManager, vars.updateMutex, c.logger)
        )
        .service('activeManager', (c) => new ActiveManager(c))
        .service('proxyInteractionService', (c) => new ProxyInteractionService(c))
        .service('fontManager', (c) => new FontManager(c))
        .service('tooltipManager', (c) => new TooltipManager(c.eventsHub, c.localeManager, c.domManager, chart.tooltip))
        .service('dataService', (c) => new DataService<any>(c.eventsHub, chart, c.animationManager, c.logger))
        .service('zoomManager', (c) => new ZoomManager(c));

    // A scene transferred from a previous chart still points at that chart's logger.
    if (vars.scene) scene.setLogger(vars.logger);

    // Plugin modules register their own services (e.g. sharedToolbar) after the
    // core registry is complete but before any consumer reads from the context.
    for (const module of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
        if (!module.chartType || module.chartType === vars.chartType) {
            module.register?.(ctx);
        }
    }

    return ctx;
}
