import type { ModuleInstance } from '../module/baseModule';
import type { LegendModule, RootModule } from '../module/coreModules';
import type { Module } from '../module/module';
import type { ModuleContext } from '../module/moduleContext';
import type {
    AgChartClickEvent,
    AgChartDoubleClickEvent,
    AgChartInstance,
    AgChartOptions,
} from '../options/agChartOptions';
import { BBox } from '../scene/bbox';
import { Group } from '../scene/group';
import type { Point } from '../scene/point';
import { Scene } from '../scene/scene';
import { groupBy } from '../util/array';
import { sleep } from '../util/async';
import { CallbackCache } from '../util/callbackCache';
import { Debug } from '../util/debug';
import { createId } from '../util/id';
import { deepClone } from '../util/json';
import type { PlacedLabel, PointLabelDatum } from '../util/labelPlacement';
import { isPointLabelDatum, placeLabels } from '../util/labelPlacement';
import { Logger } from '../util/logger';
import { Mutex } from '../util/mutex';
import type { TypedEvent } from '../util/observable';
import { Observable } from '../util/observable';
import { Padding } from '../util/padding';
import { BaseProperties } from '../util/properties';
import { ActionOnSet, type ActionOnSetOptions } from '../util/proxy';
import { debouncedAnimationFrame, debouncedCallback } from '../util/render';
import { SizeMonitor } from '../util/sizeMonitor';
import { isFiniteNumber } from '../util/type-guards';
import type { PickRequired } from '../util/types';
import { BOOLEAN, OBJECT, UNION, Validate } from '../util/validation';
import type { Caption } from './caption';
import type { ChartAnimationPhase } from './chartAnimationPhase';
import type { ChartAxis } from './chartAxis';
import { ChartHighlight } from './chartHighlight';
import type { ChartMode } from './chartMode';
import { ChartUpdateType } from './chartUpdateType';
import { DataController } from './data/dataController';
import { DataService } from './data/dataService';
import { AnimationManager } from './interaction/animationManager';
import { ChartEventManager } from './interaction/chartEventManager';
import { CursorManager } from './interaction/cursorManager';
import { GestureDetector } from './interaction/gestureDetector';
import type { HighlightChangeEvent } from './interaction/highlightManager';
import { HighlightManager } from './interaction/highlightManager';
import type { InteractionEvent } from './interaction/interactionManager';
import { InteractionManager } from './interaction/interactionManager';
import { TooltipManager } from './interaction/tooltipManager';
import { ZoomManager } from './interaction/zoomManager';
import { Layers } from './layers';
import { LayoutService } from './layout/layoutService';
import { Legend } from './legend';
import type { CategoryLegendDatum, ChartLegend, ChartLegendType, GradientLegendDatum } from './legendDatum';
import type { SeriesOptionsTypes } from './mapping/types';
import { ChartOverlays } from './overlay/chartOverlays';
import type { Overlay } from './overlay/overlay';
import type { Series } from './series/series';
import { SeriesNodePickMode } from './series/series';
import { SeriesLayerManager } from './series/seriesLayerManager';
import { SeriesStateManager } from './series/seriesStateManager';
import type { ISeries, SeriesNodeDatum } from './series/seriesTypes';
import { Tooltip } from './tooltip/tooltip';
import { BaseLayoutProcessor } from './update/baseLayoutProcessor';
import { DataWindowProcessor } from './update/dataWindowProcessor';
import type { UpdateProcessor } from './update/processor';
import { UpdateService } from './updateService';

type OptionalHTMLElement = HTMLElement | undefined | null;

export type TransferableResources = { container?: OptionalHTMLElement; scene: Scene; element: HTMLElement };

type PickedNode = {
    series: Series<any>;
    datum: SeriesNodeDatum;
    distance: number;
};

function initialiseSpecialOverrides(
    opts: ChartExtendedOptions
): PickRequired<ChartExtendedOptions, 'document' | 'window'> {
    let globalWindow;
    if (opts.window != null) {
        globalWindow = opts.window;
    } else if (typeof window !== 'undefined') {
        globalWindow = window;
    } else if (typeof global !== 'undefined') {
        globalWindow = global.window;
    } else {
        throw new Error('AG Charts - unable to resolve global window');
    }
    let globalDocument;
    if (opts.document != null) {
        globalDocument = opts.document;
    } else if (typeof document !== 'undefined') {
        globalDocument = document;
    } else if (typeof global !== 'undefined') {
        globalDocument = global.document;
    } else {
        throw new Error('AG Charts - unable to resolve global document');
    }
    return { ...opts, document: globalDocument, window: globalWindow };
}

export interface ChartSpecialOverrides {
    document?: Document;
    window?: Window;
    overrideDevicePixelRatio?: number;
    sceneMode?: 'simple';
}

export type ChartExtendedOptions = AgChartOptions & ChartSpecialOverrides;

class SeriesArea extends BaseProperties {
    @Validate(BOOLEAN, { optional: true })
    clip?: boolean;

    @Validate(OBJECT)
    padding = new Padding(0);
}

export abstract class Chart extends Observable implements AgChartInstance {
    static chartsInstances = new WeakMap<HTMLElement, Chart>();

    static getInstance(element: HTMLElement): Chart | undefined {
        return Chart.chartsInstances.get(element);
    }

    readonly id = createId(this);

    className?: string;

    processedOptions: AgChartOptions & { type?: SeriesOptionsTypes['type'] } = {};
    userOptions: AgChartOptions = {};
    queuedUserOptions: AgChartOptions[] = [];

    getOptions() {
        return deepClone(this.queuedUserOptions.at(-1) ?? this.userOptions);
    }

    readonly scene: Scene;
    readonly seriesRoot = new Group({ name: `${this.id}-Series-root` });

    readonly tooltip: Tooltip;
    readonly overlays: ChartOverlays;
    readonly highlight: ChartHighlight;

    private readonly debug = Debug.create();

    private extraDebugStats: Record<string, number> = {};

    @ActionOnSet<Chart>({
        newValue(value: HTMLElement) {
            if (this.destroyed) return;

            value.setAttribute('data-ag-charts', '');
            value.appendChild(this.element);
            Chart.chartsInstances.set(value, this);
        },
        oldValue(value: HTMLElement) {
            value.removeAttribute('data-ag-charts');
            value.removeChild(this.element);
            Chart.chartsInstances.delete(value);
        },
    })
    container: OptionalHTMLElement;

    public data: any = [];

    @ActionOnSet<Chart>({
        newValue(value) {
            this.resize(value, undefined, 'width option');
        },
    })
    width?: number;

    @ActionOnSet<Chart>({
        newValue(value) {
            this.resize(undefined, value, 'height option');
        },
    })
    height?: number;

    @ActionOnSet<Chart>({
        newValue(value) {
            this.onAutoSizeChange(value);
        },
    })
    @Validate(BOOLEAN)
    autoSize;

    private _lastAutoSize?: [number, number];
    private _firstAutoSize = true;

    private onAutoSizeChange(value: boolean) {
        const { style } = this.element;
        if (value) {
            style.display = 'block';
            style.width = '100%';
            style.height = '100%';

            if (!this._lastAutoSize) {
                return;
            }
            this.resize(undefined, undefined, 'autoSize option');
        } else {
            style.display = 'inline-block';
            style.width = 'auto';
            style.height = 'auto';
        }
    }

    download(fileName?: string, fileFormat?: string) {
        this.scene.download(fileName, fileFormat);
    }

    @Validate(OBJECT)
    readonly padding = new Padding(20);

    @Validate(OBJECT)
    readonly seriesArea = new SeriesArea();

    @ActionOnSet(Chart.NodeValueChangeOptions)
    public title?: Caption;

    @ActionOnSet(Chart.NodeValueChangeOptions)
    public subtitle?: Caption;

    @ActionOnSet(Chart.NodeValueChangeOptions)
    public footnote?: Caption;

    @Validate(UNION(['standalone', 'integrated'], 'a chart mode'))
    mode: ChartMode = 'standalone';

    static NodeValueChangeOptions: ActionOnSetOptions<Chart> = {
        newValue(value) {
            this.scene.root?.appendChild(value.node);
        },
        oldValue(oldValue) {
            this.scene.root?.removeChild(oldValue.node);
        },
    };

    private _destroyed: boolean = false;
    private readonly _destroyFns: (() => void)[] = [];
    get destroyed() {
        return this._destroyed;
    }

    chartAnimationPhase: ChartAnimationPhase = 'initial';

    protected readonly animationManager: AnimationManager;
    protected readonly chartEventManager: ChartEventManager;
    protected readonly cursorManager: CursorManager;
    protected readonly highlightManager: HighlightManager;
    protected readonly interactionManager: InteractionManager;
    protected readonly gestureDetector: GestureDetector;
    protected readonly tooltipManager: TooltipManager;
    protected readonly zoomManager = new ZoomManager();
    protected readonly dataService: DataService<any>;
    protected readonly layoutService: LayoutService;
    protected readonly updateService: UpdateService;
    protected readonly axisGridGroup: Group;
    protected readonly axisGroup: Group;
    protected readonly callbackCache: CallbackCache;
    protected readonly seriesStateManager: SeriesStateManager;
    protected readonly seriesLayerManager: SeriesLayerManager;
    public readonly modules: Map<string, ModuleInstance> = new Map(); // TODO shouldn't be public
    protected readonly legends: Map<ChartLegendType, ChartLegend> = new Map();
    legend: ChartLegend | undefined;

    private readonly specialOverrides: PickRequired<ChartExtendedOptions, 'document' | 'window'>;

    private readonly processors: UpdateProcessor[] = [];

    protected constructor(specialOverrides: ChartExtendedOptions, resources?: TransferableResources) {
        super();

        this.specialOverrides = initialiseSpecialOverrides(specialOverrides);
        const { window, document } = this.specialOverrides;

        const scene = resources?.scene;
        const element = resources?.element ?? document.createElement('div');
        const container = resources?.container;

        const root = new Group({ name: 'root' });
        // Prevent the scene from rendering chart components in an invalid state
        // (before first layout is performed).
        root.visible = false;
        root.append(this.seriesRoot);

        this.axisGridGroup = new Group({ name: 'Axes-Grids', layer: true, zIndex: Layers.AXIS_GRID_ZINDEX });
        root.appendChild(this.axisGridGroup);

        this.axisGroup = new Group({ name: 'Axes', layer: true, zIndex: Layers.AXIS_ZINDEX });
        root.appendChild(this.axisGroup);

        this.element = element;
        element.classList.add('ag-chart-wrapper');
        element.style.position = 'relative';

        this.scene = scene ?? new Scene(this.specialOverrides);
        this.scene.root = root;
        this.scene.container = element;
        this.autoSize = true;

        this.chartEventManager = new ChartEventManager();
        this.cursorManager = new CursorManager(element);
        this.highlightManager = new HighlightManager();
        this.interactionManager = new InteractionManager(element, document, window);
        this.gestureDetector = new GestureDetector(element);
        this.dataService = new DataService<any>((data) => {
            this.data = data;
        });
        this.layoutService = new LayoutService();
        this.updateService = new UpdateService(
            (type = ChartUpdateType.FULL, { forceNodeDataRefresh, skipAnimations }) =>
                this.update(type, { forceNodeDataRefresh, skipAnimations })
        );
        this.seriesStateManager = new SeriesStateManager();
        this.seriesLayerManager = new SeriesLayerManager(this.seriesRoot);
        this.callbackCache = new CallbackCache();

        this.animationManager = new AnimationManager(this.interactionManager, this.updateMutex);
        this.animationManager.skip();
        this.animationManager.play();

        this.processors = [
            new BaseLayoutProcessor(this, this.layoutService),
            new DataWindowProcessor(this, this.dataService, this.updateService, this.zoomManager),
        ];

        this.tooltip = new Tooltip(this.scene.canvas.element, document, window, document.body);
        this.tooltipManager = new TooltipManager(this.tooltip, this.interactionManager);
        this.overlays = new ChartOverlays(this.element, this.animationManager);
        this.highlight = new ChartHighlight();
        this.container = container;

        this.attachLegend('category', Legend);
        this.legend = this.legends.get('category');

        SizeMonitor.observe(this.element, (size) => this.rawResize(size));
        this._destroyFns.push(
            this.interactionManager.addListener('click', (event) => this.onClick(event)),
            this.interactionManager.addListener('dblclick', (event) => this.onDoubleClick(event)),
            this.interactionManager.addListener('hover', (event) => this.onMouseMove(event)),
            this.interactionManager.addListener('leave', (event) => this.onLeave(event)),
            this.interactionManager.addListener('page-left', () => this.destroy()),
            this.interactionManager.addListener('wheel', () => this.disablePointer()),

            // Block redundant and interfering attempts to update the hovered element during dragging.
            this.interactionManager.addListener('drag', () => this.disablePointer()),

            this.animationManager.addListener('animation-frame', () => {
                this.update(ChartUpdateType.SCENE_RENDER);
            }),
            this.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event)),
            this.zoomManager.addListener('zoom-change', () =>
                this.update(ChartUpdateType.PROCESS_DATA, { forceNodeDataRefresh: true, skipAnimations: true })
            )
        );
    }

    addModule<T extends RootModule | LegendModule>(module: T) {
        if (this.modules.has(module.optionsKey)) {
            throw new Error(`AG Charts - module already initialised: ${module.optionsKey}`);
        }

        const moduleInstance = new module.instanceConstructor(this.getModuleContext());

        if (module.type === 'legend') {
            const legend = moduleInstance as ChartLegend;
            this.legends.set(module.identifier, legend);
            legend.attachLegend(this.scene.root);
        }

        this.modules.set(module.optionsKey, moduleInstance);
    }

    removeModule(module: RootModule | LegendModule) {
        if (module.type === 'legend') {
            this.legends.delete(module.identifier);
        }

        this.modules.get(module.optionsKey)?.destroy();
        this.modules.delete(module.optionsKey);
    }

    private attachLegend(
        legendType: ChartLegendType,
        legendConstructor: new (moduleContext: ModuleContext) => ChartLegend
    ) {
        const legend = new legendConstructor(this.getModuleContext());
        this.legends.set(legendType, legend);
        legend.attachLegend(this.scene.root);
    }

    isModuleEnabled(module: Module) {
        return this.modules.has(module.optionsKey);
    }

    getModuleContext(): ModuleContext {
        const {
            scene,
            animationManager,
            chartEventManager,
            cursorManager,
            highlightManager,
            interactionManager,
            gestureDetector,
            tooltipManager,
            zoomManager,
            layoutService,
            updateService,
            seriesStateManager,
            seriesLayerManager,
            callbackCache,
            specialOverrides: { window, document },
        } = this;
        return {
            window,
            document,
            scene,
            animationManager,
            chartEventManager,
            cursorManager,
            highlightManager,
            interactionManager,
            gestureDetector,
            tooltipManager,
            zoomManager,
            chartService: this,
            layoutService,
            updateService,
            seriesStateManager,
            seriesLayerManager,
            callbackCache,
        };
    }

    resetAnimations() {
        this.chartAnimationPhase = 'initial';

        for (const series of this.series) {
            series.resetAnimation(this.chartAnimationPhase);
        }

        // Reset animation state.
        this.animationRect = undefined;
        this.animationManager?.reset();
    }

    destroy(opts?: { keepTransferableResources: boolean }): TransferableResources | undefined {
        if (this._destroyed) {
            return;
        }

        const keepTransferableResources = opts?.keepTransferableResources;
        let result: TransferableResources | undefined;

        this._performUpdateType = ChartUpdateType.NONE;

        this._destroyFns.forEach((fn) => fn());
        this.processors.forEach((p) => p.destroy());
        this.tooltipManager.destroy();
        this.tooltip.destroy();
        this.legends.forEach((legend) => legend.destroy());
        this.legends.clear();
        this.overlays.destroy();
        SizeMonitor.unobserve(this.element);

        for (const { instance: moduleInstance } of Object.values(this.modules)) {
            this.removeModule(moduleInstance as ModuleInstance & (RootModule | LegendModule));
        }

        this.interactionManager.destroy();
        this.animationManager.stop();
        this.animationManager.destroy();
        this.chartEventManager.destroy();
        this.highlightManager.destroy();
        this.zoomManager.destroy();

        if (keepTransferableResources) {
            this.scene.strip();
            result = { container: this.container, scene: this.scene, element: this.element };
        } else {
            this.scene.destroy();
            this.container = undefined;
        }

        this.destroySeries(this.series);
        this.seriesLayerManager.destroy();

        this.axes.forEach((a) => a.destroy());
        this.axes = [];

        this.callbackCache.invalidateCache();

        // Reset animation state.
        this.animationRect = undefined;
        this.animationManager.reset();

        this._destroyed = true;

        return result;
    }

    disablePointer(highlightOnly = false) {
        if (!highlightOnly) {
            this.tooltipManager.removeTooltip(this.id);
        }
        this.highlightManager.updateHighlight(this.id);
        this.lastInteractionEvent = undefined;
    }

    requestFactoryUpdate(cb: (chart: Chart) => Promise<void>) {
        this._pendingFactoryUpdatesCount++;
        this.updateMutex.acquire(async () => {
            await cb(this);
            this._pendingFactoryUpdatesCount--;
        });
    }

    private _pendingFactoryUpdatesCount = 0;
    private _performUpdateNoRenderCount = 0;
    private _performUpdateType: ChartUpdateType = ChartUpdateType.NONE;
    private _performUpdateSkipAnimations?: boolean = false;
    get performUpdateType() {
        return this._performUpdateType;
    }
    private _lastPerformUpdateError?: Error;
    get lastPerformUpdateError() {
        return this._lastPerformUpdateError;
    }

    private updateShortcutCount = 0;
    private seriesToUpdate: Set<ISeries<any>> = new Set();
    private updateMutex = new Mutex();
    private updateRequestors: Record<string, ChartUpdateType> = {};
    private performUpdateTrigger = debouncedCallback(async ({ count }) => {
        if (this._destroyed) return;

        this.updateMutex.acquire(async () => {
            try {
                await this.performUpdate(count);
            } catch (error) {
                this._lastPerformUpdateError = error as Error;
                Logger.error('update error', error);
            }
        });
    });
    public update(
        type = ChartUpdateType.FULL,
        opts?: {
            forceNodeDataRefresh?: boolean;
            skipAnimations?: boolean;
            newAnimationBatch?: boolean;
            seriesToUpdate?: Iterable<ISeries<any>>;
            backOffMs?: number;
        }
    ) {
        const {
            forceNodeDataRefresh = false,
            skipAnimations,
            seriesToUpdate = this.series,
            newAnimationBatch,
        } = opts ?? {};

        if (forceNodeDataRefresh) {
            this.series.forEach((series) => series.markNodeDataDirty());
        }

        for (const series of seriesToUpdate) {
            this.seriesToUpdate.add(series);
        }

        if (skipAnimations) {
            this.animationManager.skipCurrentBatch();
            this._performUpdateSkipAnimations = true;
        }

        if (newAnimationBatch) {
            if (this.animationManager.isActive()) {
                this._performUpdateSkipAnimations = true;
            } else {
                this._performUpdateSkipAnimations ??= false;
            }
        }

        if (Debug.check(true)) {
            let stack = new Error().stack ?? '<unknown>';
            stack = stack.replace(/\([^)]*/g, '');
            this.updateRequestors[stack] = type;
        }

        if (type < this._performUpdateType) {
            this._performUpdateType = type;
            this.performUpdateTrigger.schedule(opts?.backOffMs);
        }
    }
    private async performUpdate(count: number) {
        const { _performUpdateType: performUpdateType, extraDebugStats } = this;
        const seriesToUpdate = [...this.seriesToUpdate];

        // Clear state immediately so that side effects can be detected prior to SCENE_RENDER.
        this._performUpdateType = ChartUpdateType.NONE;
        this.seriesToUpdate.clear();

        if (this.updateShortcutCount === 0 && performUpdateType < ChartUpdateType.SCENE_RENDER) {
            this.animationManager.startBatch(this._performUpdateSkipAnimations);
            this.animationManager.onBatchStop(() => (this.chartAnimationPhase = 'ready'));
        }

        this.debug('Chart.performUpdate() - start', ChartUpdateType[performUpdateType]);
        const splits: Record<string, number> = { start: performance.now() };

        switch (performUpdateType) {
            case ChartUpdateType.FULL:
            case ChartUpdateType.UPDATE_DATA:
                await this.updateData();
                splits['⬇️'] = performance.now();
            // fallthrough

            case ChartUpdateType.PROCESS_DATA:
                await this.processData();
                this.disablePointer(true);
                splits['🏭'] = performance.now();
            // fallthrough

            case ChartUpdateType.PERFORM_LAYOUT:
                if (this.checkUpdateShortcut(ChartUpdateType.PERFORM_LAYOUT)) break;
                if (!this.checkFirstAutoSize(seriesToUpdate)) break;

                await this.processLayout();
                splits['⌖'] = performance.now();
            // fallthrough

            case ChartUpdateType.SERIES_UPDATE:
                if (this.checkUpdateShortcut(ChartUpdateType.SERIES_UPDATE)) break;

                const { seriesRect } = this;
                await Promise.all(seriesToUpdate.map((series) => series.update({ seriesRect })));

                splits['🤔'] = performance.now();
            // fallthrough

            case ChartUpdateType.TOOLTIP_RECALCULATION:
                if (this.checkUpdateShortcut(ChartUpdateType.TOOLTIP_RECALCULATION)) break;

                const tooltipMeta = this.tooltipManager.getTooltipMeta(this.id);
                const isHovered = tooltipMeta?.event?.type === 'hover';
                if (performUpdateType <= ChartUpdateType.SERIES_UPDATE && isHovered) {
                    this.handlePointer(tooltipMeta.event as InteractionEvent<'hover'>);
                }
                splits['↖'] = performance.now();
            // fallthrough

            case ChartUpdateType.SCENE_RENDER:
                if (this.checkUpdateShortcut(ChartUpdateType.SCENE_RENDER)) break;

                extraDebugStats['updateShortcutCount'] = this.updateShortcutCount;
                await this.scene.render({ debugSplitTimes: splits, extraDebugStats });
                this.extraDebugStats = {};
            // fallthrough

            case ChartUpdateType.NONE:
                // Do nothing.
                this.updateShortcutCount = 0;
                this.updateRequestors = {};
                this._performUpdateSkipAnimations = undefined;
                this.animationManager.endBatch();
        }

        this.updateService.dispatchUpdateComplete(this.getMinRect());

        const end = performance.now();
        this.debug('Chart.performUpdate() - end', {
            chart: this,
            durationMs: Math.round((end - splits['start']) * 100) / 100,
            count,
            performUpdateType: ChartUpdateType[performUpdateType],
        });
    }

    private checkUpdateShortcut(checkUpdateType: ChartUpdateType) {
        const maxShortcuts = 3;

        if (this.updateShortcutCount > maxShortcuts) {
            Logger.warn(
                `exceeded the maximum number of simultaneous updates (${
                    maxShortcuts + 1
                }), discarding changes and rendering`,
                this.updateRequestors
            );
            return false;
        }

        if (this.performUpdateType <= checkUpdateType) {
            // A previous step modified series state, and we need to re-run this or an earlier step before rendering.
            this.updateShortcutCount++;
            return true;
        }

        return false;
    }

    private checkFirstAutoSize(seriesToUpdate: ISeries<any>[]) {
        if (this.autoSize && !this._lastAutoSize) {
            const count = this._performUpdateNoRenderCount++;
            const backOffMs = count ** 2 * 10;

            if (count < 8) {
                // Reschedule if canvas size hasn't been set yet to avoid a race.
                this.update(ChartUpdateType.PERFORM_LAYOUT, { seriesToUpdate, backOffMs });

                this.debug('Chart.checkFirstAutoSize() - backing off until first size update', backOffMs);
                return false;
            }

            // After several failed passes, continue and accept there maybe a redundant
            // render. Sometimes this case happens when we already have the correct
            // width/height, and we end up never rendering the chart in that scenario.
            this.debug('Chart.checkFirstAutoSize() - timeout for first size update.');
        }
        this._performUpdateNoRenderCount = 0;

        return true;
    }

    readonly element: HTMLElement;

    @ActionOnSet<Chart>({
        changeValue(newValue, oldValue = []) {
            for (const axis of oldValue) {
                if (newValue.includes(axis)) continue;
                axis.detachAxis(this.axisGroup, this.axisGridGroup);
                axis.destroy();
            }

            for (const axis of newValue) {
                if (oldValue?.includes(axis)) continue;
                axis.attachAxis(this.axisGroup, this.axisGridGroup);
            }

            this.zoomManager.updateAxes(newValue);
        },
    })
    axes: ChartAxis[] = [];

    @ActionOnSet<Chart>({
        changeValue(newValue, oldValue) {
            this.onSeriesChange(newValue, oldValue);
        },
    })
    series: Series<any>[] = [];

    private onSeriesChange(newValue: Series<any>[], oldValue?: Series<any>[]) {
        const seriesToDestroy = oldValue?.filter((series) => !newValue.includes(series)) ?? [];
        this.destroySeries(seriesToDestroy);
        this.seriesLayerManager?.setSeriesCount(newValue.length);

        for (const series of newValue) {
            if (oldValue?.includes(series)) continue;

            if (series.rootGroup.parent == null) {
                this.seriesLayerManager.requestGroup(series);
            }

            const chart = this;
            series.chart = {
                get mode() {
                    return chart.mode;
                },
                get seriesRect() {
                    return chart.seriesRect;
                },
                placeLabels() {
                    return chart.placeLabels();
                },
            };

            series.resetAnimation(this.chartAnimationPhase);
            this.addSeriesListeners(series);
            series.addChartEventListeners();
        }
    }

    protected destroySeries(series: Series<any>[]): void {
        series?.forEach((series) => {
            series.removeEventListener('nodeClick', this.onSeriesNodeClick);
            series.removeEventListener('nodeDoubleClick', this.onSeriesNodeDoubleClick);
            series.destroy();

            series.chart = undefined;
        });
    }

    private addSeriesListeners(series: Series<any>) {
        if (this.hasEventListener('seriesNodeClick')) {
            series.addEventListener('nodeClick', this.onSeriesNodeClick);
        }

        if (this.hasEventListener('seriesNodeDoubleClick')) {
            series.addEventListener('nodeDoubleClick', this.onSeriesNodeDoubleClick);
        }
    }

    updateAllSeriesListeners(): void {
        this.series.forEach((series) => {
            series.removeEventListener('nodeClick', this.onSeriesNodeClick);
            series.removeEventListener('nodeDoubleClick', this.onSeriesNodeDoubleClick);

            this.addSeriesListeners(series);
        });
    }

    protected assignSeriesToAxes() {
        this.axes.forEach((axis) => {
            axis.boundSeries = this.series.filter((s) => {
                const seriesAxis = s.axes[axis.direction];
                return seriesAxis === axis;
            });
        });
    }

    protected assignAxesToSeries() {
        // This method has to run before `assignSeriesToAxes`.
        const directionToAxesMap = groupBy(this.axes, (axis) => axis.direction);

        this.series.forEach((series) => {
            series.directions.forEach((direction) => {
                const directionAxes = directionToAxesMap[direction];
                if (!directionAxes) {
                    Logger.warnOnce(
                        `no available axis for direction [${direction}]; check series and axes configuration.`
                    );
                    return;
                }

                const seriesKeys = series.getKeys(direction);
                const newAxis = this.findMatchingAxis(directionAxes, seriesKeys);
                if (!newAxis) {
                    Logger.warnOnce(
                        `no matching axis for direction [${direction}] and keys [${seriesKeys}]; check series and axes configuration.`
                    );
                    return;
                }

                series.axes[direction] = newAxis;
            });
        });
    }

    private findMatchingAxis(directionAxes: ChartAxis[], directionKeys?: string[]): ChartAxis | undefined {
        for (const axis of directionAxes) {
            if (!axis.keys.length) {
                return axis;
            }

            if (!directionKeys) {
                continue;
            }

            for (const directionKey of directionKeys) {
                if (axis.keys.includes(directionKey)) {
                    return axis;
                }
            }
        }
    }

    private rawResize(size: { width: number; height: number }) {
        let { width, height } = size;
        width = Math.floor(width);
        height = Math.floor(height);

        if (!this.autoSize) {
            return;
        }

        if (width === 0 && height === 0) {
            return;
        }

        const [autoWidth = 0, authHeight = 0] = this._lastAutoSize ?? [];
        if (autoWidth === width && authHeight === height) {
            return;
        }

        this._lastAutoSize = [width, height];
        this.resize(undefined, undefined, 'SizeMonitor');
    }

    private resize(width?: number, height?: number, source?: string) {
        width ??= this.width ?? (this.autoSize ? this._lastAutoSize?.[0] : this.scene.canvas.width);
        height ??= this.height ?? (this.autoSize ? this._lastAutoSize?.[1] : this.scene.canvas.height);
        this.debug(`Chart.resize() from ${source}`, { width, height, stack: new Error().stack });
        if (!width || !height || !isFiniteNumber(width) || !isFiniteNumber(height)) return;

        if (this.scene.resize(width, height)) {
            this.disablePointer();
            this.animationManager.reset();

            let skipAnimations = true;
            if (this.autoSize && this._firstAutoSize) {
                skipAnimations = false;
                this._firstAutoSize = false;
            }

            this.update(ChartUpdateType.PERFORM_LAYOUT, { forceNodeDataRefresh: true, skipAnimations });
        }
    }

    async updateData() {
        const data = this.dataService.init(this.data);
        this.series.map((s) => {
            s.setChartData(data);
        });
    }

    async processData() {
        if (this.series.some((s) => s.canHaveAxes)) {
            this.assignAxesToSeries();
            this.assignSeriesToAxes();
        }

        const dataController = new DataController(this.mode);
        const seriesPromises = this.series.map((s) => s.processData(dataController));
        dataController.execute();
        await Promise.all(seriesPromises);
        await this.updateLegend();
    }

    placeLabels(): Map<Series<any>, PlacedLabel[]> {
        const visibleSeries: Series<any>[] = [];
        const data: (readonly PointLabelDatum[])[] = [];
        for (const series of this.series) {
            if (!series.visible) continue;

            const labelData: PointLabelDatum[] = series.getLabelData();

            if (isPointLabelDatum(labelData?.[0])) {
                data.push(labelData);
                visibleSeries.push(series);
            }
        }

        const { seriesRect } = this;
        const { top, right, bottom, left } = this.seriesArea.padding;
        const labels: PlacedLabel[][] =
            seriesRect && data.length > 0
                ? placeLabels(data, {
                      x: -left,
                      y: -top,
                      width: seriesRect.width + left + right,
                      height: seriesRect.height + top + bottom,
                  })
                : [];
        return new Map(labels.map((l, i) => [visibleSeries[i], l]));
    }

    private async updateLegend() {
        this.legends.forEach((legend, legendType) => {
            const isCategoryLegendData = (
                data: Array<CategoryLegendDatum | GradientLegendDatum>
            ): data is CategoryLegendDatum[] => data.every((d) => d.legendType === 'category');
            const legendData = this.series
                .filter((s) => s.properties.showInLegend)
                .flatMap((s) => s.getLegendData(legendType));

            if (isCategoryLegendData(legendData)) {
                this.validateCategoryLegendData(legendData);
            }

            legend.data = legendData;
        });
    }

    protected validateCategoryLegendData(legendData: CategoryLegendDatum[]) {
        // Validate each series that shares a legend item label uses the same fill colour
        const labelMarkerFills: { [key: string]: { [key: string]: Set<string> } } = {};

        legendData.forEach((d) => {
            const seriesType = this.series.find((s) => s.id === d.seriesId)?.type;
            if (!seriesType) return;

            labelMarkerFills[seriesType] ??= {};
            labelMarkerFills[seriesType][d.label.text] ??= new Set();
            if (d.marker.fill != null) {
                labelMarkerFills[seriesType][d.label.text].add(d.marker.fill);
            }
        });

        for (const seriesMarkers of Object.values(labelMarkerFills)) {
            for (const [name, fills] of Object.entries(seriesMarkers)) {
                if (fills.size > 1) {
                    Logger.warnOnce(
                        `legend item '${name}' has multiple fill colors, this may cause unexpected behaviour.`
                    );
                }
            }
        }
    }

    private async processLayout() {
        const oldRect = this.animationRect;
        await this.performLayout();

        if (oldRect && !this.animationRect?.equals(oldRect)) {
            // Skip animations if the layout changed.
            this.animationManager.skipCurrentBatch();
        }

        this.handleOverlays();
        this.debug('Chart.performUpdate() - seriesRect', this.seriesRect);
    }

    protected async performLayout() {
        if (this.scene.root) {
            this.scene.root.visible = true;
        }

        const { width, height } = this.scene;
        let ctx = { shrinkRect: new BBox(0, 0, width, height) };
        ctx = this.layoutService.dispatchPerformLayout('start-layout', ctx);
        ctx = this.layoutService.dispatchPerformLayout('before-series', ctx);
        return ctx.shrinkRect;
    }

    protected hoverRect?: BBox;

    // Should be available after the first layout.
    protected seriesRect?: BBox;
    // BBox of the chart area containing animatable elements; if this changes, we skip animations.
    protected animationRect?: BBox;

    // x/y are local canvas coordinates in CSS pixels, not actual pixels
    private pickSeriesNode(point: Point, exactMatchOnly: boolean, maxDistance?: number): PickedNode | undefined {
        const start = performance.now();

        // Disable 'nearest match' options if looking for exact matches only
        const pickModes = exactMatchOnly ? [SeriesNodePickMode.EXACT_SHAPE_MATCH] : undefined;

        // Iterate through series in reverse, as later declared series appears on top of earlier
        // declared series.
        const reverseSeries = [...this.series].reverse();

        let result: { series: Series<any>; datum: SeriesNodeDatum; distance: number } | undefined;
        for (const series of reverseSeries) {
            if (!series.visible || !series.rootGroup.visible) {
                continue;
            }
            const { match, distance } = series.pickNode(point, pickModes) ?? {};
            if (!match || distance == null) {
                continue;
            }
            if ((!result || result.distance > distance) && distance <= (maxDistance ?? Infinity)) {
                result = { series, distance, datum: match };
            }
            if (distance === 0) {
                break;
            }
        }

        this.extraDebugStats['pickSeriesNode'] = Math.round(
            (this.extraDebugStats['pickSeriesNode'] ?? 0) + (performance.now() - start)
        );

        return result;
    }

    lastPick?: {
        datum: SeriesNodeDatum;
        event?: Event;
    };

    protected onMouseMove(event: InteractionEvent<'hover'>): void {
        this.lastInteractionEvent = event;
        this.pointerScheduler.schedule();

        this.extraDebugStats['mouseX'] = event.offsetX;
        this.extraDebugStats['mouseY'] = event.offsetY;
        this.update(ChartUpdateType.SCENE_RENDER);
    }

    protected onLeave(event: InteractionEvent<'leave'>): void {
        if (!this.tooltip.pointerLeftOntoTooltip(event)) {
            this.disablePointer();
            this.update(ChartUpdateType.SCENE_RENDER);
        }
    }

    private lastInteractionEvent?: InteractionEvent<'hover'> = undefined;
    private pointerScheduler = debouncedAnimationFrame(() => {
        if (this.lastInteractionEvent) {
            this.handlePointer(this.lastInteractionEvent);
            this.lastInteractionEvent = undefined;
        }
    });
    protected handlePointer(event: InteractionEvent<'hover'>) {
        const { lastPick, hoverRect } = this;
        const { offsetX, offsetY } = event;

        const disablePointer = (highlightOnly = false) => {
            if (lastPick) {
                // Cursor moved from a non-marker node to empty space.
                this.disablePointer(highlightOnly);
            }
        };

        if (!hoverRect?.containsPoint(offsetX, offsetY)) {
            disablePointer();
            return;
        }

        // Handle node highlighting and tooltip toggling when pointer within `tooltip.range`
        this.handlePointerTooltip(event, disablePointer);

        // Handle node highlighting and mouse cursor when pointer withing `series[].nodeClickRange`
        this.handlePointerNode(event);
    }

    protected handlePointerTooltip(
        event: InteractionEvent<'hover'>,
        disablePointer: (highlightOnly?: boolean) => void
    ) {
        const { lastPick, tooltip } = this;
        const { range } = tooltip;
        const { offsetX, offsetY } = event;

        let pixelRange;
        if (isFiniteNumber(range)) {
            pixelRange = range;
        }
        const pick = this.pickSeriesNode({ x: offsetX, y: offsetY }, range === 'exact', pixelRange);

        if (!pick) {
            this.tooltipManager.removeTooltip(this.id);
            if (this.highlight.range === 'tooltip') disablePointer(true);
            return;
        }

        const isNewDatum = this.highlight.range === 'node' || !lastPick || lastPick.datum !== pick.datum;
        let html;

        if (isNewDatum) {
            html = pick.series.getTooltipHtml(pick.datum);

            if (this.highlight.range === 'tooltip') {
                this.highlightManager.updateHighlight(this.id, pick.datum);
            }
        } else if (lastPick) {
            lastPick.event = event.sourceEvent;
        }

        const isPixelRange = pixelRange != null;
        const tooltipEnabled = this.tooltip.enabled && pick.series.properties.tooltip.enabled;
        const exactlyMatched = range === 'exact' && pick.distance === 0;
        const rangeMatched = range === 'nearest' || isPixelRange || exactlyMatched;
        const shouldUpdateTooltip = tooltipEnabled && rangeMatched && (!isNewDatum || html !== undefined);

        const meta = TooltipManager.makeTooltipMeta(event, this.scene.canvas, pick.datum, this.specialOverrides.window);

        if (shouldUpdateTooltip) {
            this.tooltipManager.updateTooltip(this.id, meta, html);
        }
    }

    protected handlePointerNode(event: InteractionEvent<'hover'>) {
        const found = this.checkSeriesNodeRange(event, (series, datum) => {
            if (series.hasEventListener('nodeClick') || series.hasEventListener('nodeDoubleClick')) {
                this.cursorManager.updateCursor('chart', 'pointer');
            }

            if (this.highlight.range === 'node') {
                this.highlightManager.updateHighlight(this.id, datum);
            }
        });

        if (!found) {
            this.cursorManager.updateCursor('chart');

            if (this.highlight.range === 'node') {
                this.highlightManager.updateHighlight(this.id);
            }
        }
    }

    protected onClick(event: InteractionEvent<'click'>) {
        if (this.checkSeriesNodeClick(event)) {
            this.update(ChartUpdateType.SERIES_UPDATE);
            return;
        }
        this.fireEvent<AgChartClickEvent>({
            type: 'click',
            event: event.sourceEvent,
        });
    }

    protected onDoubleClick(event: InteractionEvent<'dblclick'>) {
        if (this.checkSeriesNodeDoubleClick(event)) {
            this.update(ChartUpdateType.SERIES_UPDATE);
            return;
        }
        this.fireEvent<AgChartDoubleClickEvent>({
            type: 'doubleClick',
            event: event.sourceEvent,
        });
    }

    private checkSeriesNodeClick(event: InteractionEvent<'click'>): boolean {
        return this.checkSeriesNodeRange(event, (series, datum) => series.fireNodeClickEvent(event.sourceEvent, datum));
    }

    private checkSeriesNodeDoubleClick(event: InteractionEvent<'dblclick'>): boolean {
        return this.checkSeriesNodeRange(event, (series, datum) =>
            series.fireNodeDoubleClickEvent(event.sourceEvent, datum)
        );
    }

    private checkSeriesNodeRange(
        event: InteractionEvent<'click' | 'dblclick' | 'hover'>,
        callback: (series: ISeries<any>, datum: SeriesNodeDatum) => void
    ): boolean {
        const nearestNode = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY }, false);

        const datum = nearestNode?.datum;
        const nodeClickRange = datum?.series.properties.nodeClickRange;

        let pixelRange;
        if (isFiniteNumber(nodeClickRange)) {
            pixelRange = nodeClickRange;
        }

        // Find the node if exactly matched and update the highlight picked node
        let pickedNode = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY }, true);
        if (pickedNode) {
            this.highlightManager.updatePicked(this.id, pickedNode.datum);
        } else {
            this.highlightManager.updatePicked(this.id);
        }

        // First check if we should trigger the callback based on nearest node
        if (datum && nodeClickRange === 'nearest') {
            callback(datum.series, datum);
            return true;
        }

        if (nodeClickRange !== 'exact') {
            pickedNode = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY }, false, pixelRange);
        }

        if (!pickedNode) return false;

        // Then if we've picked a node within the pixel range, or exactly, trigger the callback
        const isPixelRange = pixelRange != null;
        const exactlyMatched = nodeClickRange === 'exact' && pickedNode.distance === 0;

        if (isPixelRange || exactlyMatched) {
            callback(pickedNode.series, pickedNode.datum);
            return true;
        }

        return false;
    }

    private onSeriesNodeClick = (event: TypedEvent) => {
        const seriesNodeClickEvent = {
            ...event,
            type: 'seriesNodeClick',
        };
        Object.defineProperty(seriesNodeClickEvent, 'series', {
            enumerable: false,
            // Should display the deprecation warning
            get: () => (event as any).series,
        });
        this.fireEvent(seriesNodeClickEvent);
    };

    private onSeriesNodeDoubleClick = (event: TypedEvent) => {
        const seriesNodeDoubleClick = {
            ...event,
            type: 'seriesNodeDoubleClick',
        };
        this.fireEvent(seriesNodeDoubleClick);
    };

    changeHighlightDatum(event: HighlightChangeEvent) {
        const seriesToUpdate: Set<ISeries<any>> = new Set();
        const { series: newSeries = undefined, datum: newDatum } = event.currentHighlight ?? {};
        const { series: lastSeries = undefined, datum: lastDatum } = event.previousHighlight ?? {};

        if (lastSeries) {
            seriesToUpdate.add(lastSeries);
        }

        if (newSeries) {
            seriesToUpdate.add(newSeries);
        }

        // Adjust cursor if a specific datum is highlighted, rather than just a series.
        if (lastSeries?.properties.cursor && lastDatum) {
            this.cursorManager.updateCursor(lastSeries.id);
        }
        if (newSeries?.properties.cursor && newDatum) {
            this.cursorManager.updateCursor(newSeries.id, newSeries.properties.cursor);
        }

        this.lastPick = event.currentHighlight ? { datum: event.currentHighlight } : undefined;

        const updateAll = newSeries == null || lastSeries == null;
        if (updateAll) {
            this.update(ChartUpdateType.SERIES_UPDATE);
        } else {
            this.update(ChartUpdateType.SERIES_UPDATE, { seriesToUpdate });
        }
    }

    async waitForUpdate(timeoutMs = 5000): Promise<void> {
        const start = performance.now();

        if (this._pendingFactoryUpdatesCount > 0) {
            // wait until any pending updates are flushed through.
            await this.updateMutex.waitForClearAcquireQueue();
        }

        while (this._performUpdateType !== ChartUpdateType.NONE) {
            if (performance.now() - start > timeoutMs) {
                throw new Error('waitForUpdate() timeout reached.');
            }
            await sleep(5);
        }

        // wait until any remaining updates are flushed through.
        await this.updateMutex.waitForClearAcquireQueue();
    }

    private handleOverlays() {
        const hasNoData = !this.series.some((s) => s.hasData());
        this.toggleOverlay(this.overlays.noData, hasNoData);

        if (!hasNoData) {
            // Don't draw both text overlays at the same time.
            const hasNoVisibleSeries = !this.series.some((series): boolean => series.visible);
            this.toggleOverlay(this.overlays.noVisibleSeries, hasNoVisibleSeries);
        }
    }

    private toggleOverlay(overlay: Overlay, visible: boolean) {
        if (visible && this.seriesRect) {
            overlay.show(this.seriesRect);
        } else {
            overlay.hide();
        }
    }

    protected getMinRect() {
        const minRects = this.series.map((series) => series.getMinRect()).filter((rect) => rect !== undefined);
        if (!minRects.length) return undefined;
        return new BBox(
            0,
            0,
            minRects.reduce((max, rect) => Math.max(max, rect!.width), 0),
            minRects.reduce((max, rect) => Math.max(max, rect!.height), 0)
        );
    }
}
