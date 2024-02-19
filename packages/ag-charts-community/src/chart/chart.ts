import type { ModuleInstance } from '../module/baseModule';
import type { LegendModule, RootModule } from '../module/coreModules';
import { type Module, REGISTERED_MODULES } from '../module/module';
import type { ModuleContext } from '../module/moduleContext';
import type { AxisOptionModule, ChartOptions } from '../module/optionsModule';
import type { AgBaseAxisOptions } from '../options/chart/axisOptions';
import type { AgChartInstance, AgChartOptions } from '../options/chart/chartBuilderOptions';
import type { AgChartClickEvent, AgChartDoubleClickEvent } from '../options/chart/eventOptions';
import type { AgBaseSeriesOptions } from '../options/series/seriesOptions';
import { BBox } from '../scene/bbox';
import { Group } from '../scene/group';
import type { Point } from '../scene/point';
import { Scene } from '../scene/scene';
import type { PlacedLabel, PointLabelDatum } from '../scene/util/labelPlacement';
import { isPointLabelDatum, placeLabels } from '../scene/util/labelPlacement';
import { groupBy } from '../util/array';
import { sleep } from '../util/async';
import { CallbackCache } from '../util/callbackCache';
import { Debug } from '../util/debug';
import { createId } from '../util/id';
import { jsonApply, jsonDiff } from '../util/json';
import { Logger } from '../util/logger';
import { Mutex } from '../util/mutex';
import { mergeDefaults } from '../util/object';
import type { TypedEvent, TypedEventListener } from '../util/observable';
import { Observable } from '../util/observable';
import { Padding } from '../util/padding';
import { BaseProperties } from '../util/properties';
import { ActionOnSet, type ActionOnSetOptions } from '../util/proxy';
import { debouncedAnimationFrame, debouncedCallback } from '../util/render';
import { SizeMonitor } from '../util/sizeMonitor';
import { isFiniteNumber, isFunction } from '../util/type-guards';
import { BOOLEAN, OBJECT, UNION, Validate } from '../util/validation';
import { Caption } from './caption';
import type { ChartAnimationPhase } from './chartAnimationPhase';
import type { ChartAxis } from './chartAxis';
import { ChartAxisDirection } from './chartAxisDirection';
import { ChartHighlight } from './chartHighlight';
import type { ChartMode } from './chartMode';
import { JSON_APPLY_OPTIONS, JSON_APPLY_PLUGINS } from './chartOptions';
import { ChartUpdateType } from './chartUpdateType';
import { DataController } from './data/dataController';
import { DataService } from './data/dataService';
import { getAxis } from './factory/axisTypes';
import { isEnterpriseSeriesType, isEnterpriseSeriesTypeLoaded } from './factory/expectedEnterpriseModules';
import { getLegendKeys } from './factory/legendTypes';
import { createSeries } from './factory/seriesTypes';
import { AnimationManager } from './interaction/animationManager';
import { ChartEventManager } from './interaction/chartEventManager';
import { ContextMenuRegistry } from './interaction/contextMenuRegistry';
import { CursorManager } from './interaction/cursorManager';
import { GestureDetector } from './interaction/gestureDetector';
import type { HighlightChangeEvent } from './interaction/highlightManager';
import { HighlightManager } from './interaction/highlightManager';
import type { InteractionEvent, PointerOffsets } from './interaction/interactionManager';
import { InteractionManager, InteractionState } from './interaction/interactionManager';
import { RegionManager } from './interaction/regionManager';
import { SyncManager } from './interaction/syncManager';
import { TooltipManager } from './interaction/tooltipManager';
import { ZoomManager } from './interaction/zoomManager';
import { Layers } from './layers';
import { LayoutService } from './layout/layoutService';
import { Legend } from './legend';
import type { CategoryLegendDatum, ChartLegend, ChartLegendType, GradientLegendDatum } from './legendDatum';
import { AxisPositionGuesser } from './mapping/prepareAxis';
import { matchSeriesOptions } from './mapping/prepareSeries';
import { type SeriesOptionsTypes, isAgCartesianChartOptions, isAgPolarChartOptions } from './mapping/types';
import { ChartOverlays } from './overlay/chartOverlays';
import { type Series, SeriesGroupingChangedEvent, SeriesNodePickMode } from './series/series';
import { SeriesLayerManager } from './series/seriesLayerManager';
import { type SeriesGrouping, SeriesStateManager } from './series/seriesStateManager';
import type { ISeries, SeriesNodeDatum } from './series/seriesTypes';
import { Tooltip } from './tooltip/tooltip';
import { BaseLayoutProcessor } from './update/baseLayoutProcessor';
import { DataWindowProcessor } from './update/dataWindowProcessor';
import { OverlaysProcessor } from './update/overlaysProcessor';
import type { UpdateProcessor } from './update/processor';
import { UpdateOpts, UpdateService } from './updateService';

const debug = Debug.create(true, 'opts');

type OptionalHTMLElement = HTMLElement | undefined | null;

export type TransferableResources = { container?: OptionalHTMLElement; scene: Scene; element: HTMLElement };

type SyncModule = ModuleInstance & { enabled?: boolean; syncAxes: (skipSync: boolean) => void };

type PickedNode = {
    series: Series<any>;
    datum: SeriesNodeDatum;
    distance: number;
};

type SeriesChangeType = 'no-op' | 'no-change' | 'replaced' | 'data-change' | 'series-count-changed' | 'updated';

type ObservableLike = {
    addEventListener(key: string, cb: TypedEventListener): void;
    clearEventListeners(): void;
};

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

    public destroyed = false;

    private _skipSync = false;
    private readonly _destroyFns: (() => void)[] = [];

    chartAnimationPhase: ChartAnimationPhase = 'initial';

    public readonly highlightManager = new HighlightManager();
    public readonly syncManager = new SyncManager(this);
    public readonly zoomManager = new ZoomManager();

    public readonly modules: Map<string, ModuleInstance> = new Map();

    protected readonly animationManager: AnimationManager;
    protected readonly chartEventManager: ChartEventManager;
    protected readonly contextMenuRegistry: ContextMenuRegistry;
    protected readonly cursorManager: CursorManager;
    protected readonly interactionManager: InteractionManager;
    protected readonly regionManager: RegionManager;
    protected readonly gestureDetector: GestureDetector;
    protected readonly tooltipManager: TooltipManager;
    protected readonly dataService: DataService<any>;
    protected readonly layoutService: LayoutService;
    protected readonly updateService: UpdateService;
    protected readonly axisGridGroup: Group;
    protected readonly axisGroup: Group;
    protected readonly callbackCache: CallbackCache;
    protected readonly seriesStateManager: SeriesStateManager;
    protected readonly seriesLayerManager: SeriesLayerManager;
    protected readonly legends: Map<ChartLegendType, ChartLegend> = new Map();
    legend: ChartLegend | undefined;

    private readonly processors: UpdateProcessor[] = [];

    processedOptions: AgChartOptions & { type?: SeriesOptionsTypes['type'] } = {};
    userOptions: AgChartOptions = {};
    queuedUserOptions: AgChartOptions[] = [];
    chartOptions: ChartOptions;

    getOptions() {
        return this.queuedUserOptions.at(-1) ?? this.userOptions;
    }

    protected constructor(options: ChartOptions, resources?: TransferableResources) {
        super();

        this.chartOptions = options;
        const { window, document } = options.specialOverrides;

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

        this.scene = scene ?? new Scene(this.chartOptions.specialOverrides);
        this.scene.root = root;
        this.scene.container = element;
        this.autoSize = true;

        this.chartEventManager = new ChartEventManager();
        this.contextMenuRegistry = new ContextMenuRegistry();
        this.cursorManager = new CursorManager(element);
        this.highlightManager = new HighlightManager();
        this.interactionManager = new InteractionManager(element, document, window);
        this.regionManager = new RegionManager(this.interactionManager);
        this.gestureDetector = new GestureDetector(element);
        this.layoutService = new LayoutService();
        this.updateService = new UpdateService((type = ChartUpdateType.FULL, options) => this.update(type, options));
        this.seriesStateManager = new SeriesStateManager();
        this.seriesLayerManager = new SeriesLayerManager(this.seriesRoot);
        this.callbackCache = new CallbackCache();

        this.animationManager = new AnimationManager(this.interactionManager, this.updateMutex);
        this.animationManager.skip();
        this.animationManager.play();

        this.dataService = new DataService<any>(this.animationManager);

        this.overlays = new ChartOverlays(this.element, this.animationManager);

        this.processors = [
            new BaseLayoutProcessor(this, this.layoutService),
            new DataWindowProcessor(this, this.dataService, this.updateService, this.zoomManager),
            new OverlaysProcessor(this, this.overlays, this.dataService, this.layoutService),
        ];

        this.tooltip = new Tooltip(this.scene.canvas.element, document, window, document.body);
        this.tooltipManager = new TooltipManager(this.tooltip, this.interactionManager);
        this.highlight = new ChartHighlight();
        this.container = container;

        this.attachLegend('category', Legend);
        this.legend = this.legends.get('category');

        const { All } = InteractionState;
        SizeMonitor.observe(this.element, (size) => this.rawResize(size));
        this._destroyFns.push(
            this.dataService.addListener('data-load', (event) => {
                this.data = event.data;
            }),

            this.interactionManager.addListener('click', (event) => this.onClick(event)),
            this.interactionManager.addListener('dblclick', (event) => this.onDoubleClick(event)),
            this.interactionManager.addListener('hover', (event) => this.onMouseMove(event)),
            this.interactionManager.addListener('leave', (event) => this.onLeave(event)),
            this.interactionManager.addListener('page-left', () => this.destroy()),

            this.interactionManager.addListener('wheel', () => this.resetPointer()),
            this.interactionManager.addListener('drag', () => this.resetPointer()),
            this.interactionManager.addListener('contextmenu', (event) => this.onContextMenu(event), All),

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
        return {
            window: this.chartOptions.specialOverrides.window,
            document: this.chartOptions.specialOverrides.document,
            scene: this.scene,
            animationManager: this.animationManager,
            chartEventManager: this.chartEventManager,
            contextMenuRegistry: this.contextMenuRegistry,
            cursorManager: this.cursorManager,
            highlightManager: this.highlightManager,
            interactionManager: this.interactionManager,
            regionManager: this.regionManager,
            gestureDetector: this.gestureDetector,
            tooltipManager: this.tooltipManager,
            syncManager: this.syncManager,
            zoomManager: this.zoomManager,
            chartService: this,
            dataService: this.dataService,
            layoutService: this.layoutService,
            updateService: this.updateService,
            seriesStateManager: this.seriesStateManager,
            callbackCache: this.callbackCache,
        };
    }

    resetAnimations() {
        this.chartAnimationPhase = 'initial';

        for (const series of this.series) {
            series.resetAnimation(this.chartAnimationPhase);
        }
        for (const axis of this.axes) {
            axis.resetAnimation(this.chartAnimationPhase);
        }

        // Reset animation state.
        this.animationRect = undefined;
        this.animationManager?.reset();
    }

    skipAnimations() {
        this.animationManager.skipCurrentBatch();
        this._performUpdateSkipAnimations = true;
    }

    destroy(opts?: { keepTransferableResources: boolean }): TransferableResources | undefined {
        if (this.destroyed) {
            return;
        }

        const keepTransferableResources = opts?.keepTransferableResources;
        let result: TransferableResources | undefined;

        this.performUpdateType = ChartUpdateType.NONE;

        this._destroyFns.forEach((fn) => fn());
        this.processors.forEach((p) => p.destroy());
        this.tooltipManager.destroy();
        this.tooltip.destroy();
        this.legends.forEach((legend) => legend.destroy());
        this.legends.clear();
        this.overlays.destroy();
        SizeMonitor.unobserve(this.element);

        for (const moduleInstance of this.modules.values()) {
            moduleInstance?.destroy();
        }
        this.modules.clear();

        this.regionManager.destroy();
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

        this.syncManager.destroy();

        this.destroyed = true;

        Object.freeze(this);

        return result;
    }

    resetPointer(highlightOnly = false) {
        if (!highlightOnly) {
            this.tooltipManager.removeTooltip(this.id);
        }
        this.highlightManager.updateHighlight(this.id);
        this.lastInteractionEvent = undefined;
    }

    requestFactoryUpdate(cb: (chart: Chart) => Promise<void> | void) {
        if (this.destroyed) return;
        this._pendingFactoryUpdatesCount++;
        this.updateMutex.acquire(async () => {
            if (this.destroyed) return;
            await cb(this);
            if (this.destroyed) return;
            this._pendingFactoryUpdatesCount--;
        });
    }

    private _pendingFactoryUpdatesCount = 0;
    private _performUpdateNoRenderCount = 0;
    private _performUpdateSkipAnimations: boolean = false;
    private performUpdateType: ChartUpdateType = ChartUpdateType.NONE;

    private updateShortcutCount = 0;
    private seriesToUpdate: Set<ISeries<any>> = new Set();
    private updateMutex = new Mutex();
    private updateRequestors: Record<string, ChartUpdateType> = {};
    private performUpdateTrigger = debouncedCallback(async ({ count }) => {
        if (this.destroyed) return;
        this.updateMutex.acquire(async () => {
            try {
                await this.performUpdate(count);
            } catch (error) {
                Logger.error('update error', error);
            }
        });
    });
    public update(type = ChartUpdateType.FULL, opts?: UpdateOpts) {
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

        if (newAnimationBatch && this.animationManager.isActive()) {
            this._performUpdateSkipAnimations = true;
        }

        this._skipSync = opts?.skipSync ?? false;

        if (this.debug.check()) {
            let stack = new Error().stack ?? '<unknown>';
            stack = stack.replace(/\([^)]*/g, '');
            this.updateRequestors[stack] = type;
        }

        if (type < this.performUpdateType) {
            this.performUpdateType = type;
            this.performUpdateTrigger.schedule(opts?.backOffMs);
        }
    }
    private async performUpdate(count: number) {
        const { performUpdateType, extraDebugStats } = this;
        const seriesToUpdate = [...this.seriesToUpdate];

        // Clear state immediately so that side effects can be detected prior to SCENE_RENDER.
        this.performUpdateType = ChartUpdateType.NONE;
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
                this.resetPointer(true);
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

                if (performUpdateType <= ChartUpdateType.SERIES_UPDATE && tooltipMeta !== undefined) {
                    this.handlePointer(tooltipMeta.lastPointerEvent);
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
                this._performUpdateSkipAnimations = false;
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
                get isMiniChart() {
                    return false;
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
            series.removeEventListener('groupingChanged', this.seriesGroupingChanged);
            series.destroy();
            this.seriesLayerManager.releaseGroup(series);

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

        series.addEventListener('groupingChanged', this.seriesGroupingChanged);
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
            this.resetPointer();
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
        this.series.forEach((s) => s.setChartData(this.data));

        const modulePromises = Array.from(this.modules.values(), (m) => m.updateData?.({ data: this.data }));
        await Promise.all(modulePromises);
    }

    async processData() {
        if (this.series.some((s) => s.canHaveAxes)) {
            this.assignAxesToSeries();
            this.assignSeriesToAxes();

            const syncModule = this.modules.get('sync') as SyncModule | undefined;
            if (syncModule?.enabled) {
                syncModule.syncAxes(this._skipSync);
            }
        }

        const dataController = new DataController(this.mode);
        const seriesPromises = this.series.map((s) => s.processData(dataController));
        const modulePromises = Array.from(this.modules.values(), (m) => m.processData?.({ dataController }));
        dataController.execute();
        await Promise.all([...seriesPromises, ...modulePromises]);

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

            if (isCategoryLegendData(legendData) && this.mode !== 'integrated') {
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

        const modulePromises = Array.from(this.modules.values(), async (m) => {
            if (m.performLayout != null) {
                ctx = await m.performLayout?.(ctx);
            }
        });
        await Promise.all(modulePromises);

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

    private lastPick?: SeriesNodeDatum;

    protected onMouseMove(event: InteractionEvent<'hover'>): void {
        this.lastInteractionEvent = event;
        this.pointerScheduler.schedule();

        this.extraDebugStats['mouseX'] = event.offsetX;
        this.extraDebugStats['mouseY'] = event.offsetY;
        this.update(ChartUpdateType.SCENE_RENDER);
    }

    protected onLeave(event: InteractionEvent<'leave'>): void {
        if (!this.tooltip.pointerLeftOntoTooltip(event)) {
            this.resetPointer();
            this.update(ChartUpdateType.SCENE_RENDER);
        }
    }

    private onContextMenu(event: InteractionEvent<'contextmenu'>): void {
        this.tooltipManager.removeTooltip(this.id);

        // If there is already a context menu visible, then re-pick the highlighted node.
        // We check InteractionState.Default too just in case we were in ContextMenu and the
        // mouse hasn't moved since (see AG-10233).
        const { Default, ContextMenu } = InteractionState;
        if (this.interactionManager.getState() & (Default | ContextMenu)) {
            this.checkSeriesNodeRange(event, (_series, datum) => {
                this.highlightManager.updateHighlight(this.id, datum);
            });
        }
    }

    private lastInteractionEvent?: InteractionEvent<'hover'> = undefined;
    private pointerScheduler = debouncedAnimationFrame(() => {
        if (this.lastInteractionEvent) {
            this.handlePointer(this.lastInteractionEvent);
            this.lastInteractionEvent = undefined;
        }
    });
    protected handlePointer(event: PointerOffsets) {
        if (this.interactionManager.getState() !== InteractionState.Default) {
            return;
        }

        const { lastPick, hoverRect } = this;
        const { offsetX, offsetY } = event;

        const disablePointer = (highlightOnly = false) => {
            if (lastPick) {
                this.resetPointer(highlightOnly);
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

    protected handlePointerTooltip(event: PointerOffsets, disablePointer: (highlightOnly?: boolean) => void) {
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

        const isNewDatum = this.highlight.range === 'node' || !lastPick || lastPick !== pick.datum;
        let html;

        if (isNewDatum) {
            html = pick.series.getTooltipHtml(pick.datum);

            if (this.highlight.range === 'tooltip') {
                this.highlightManager.updateHighlight(this.id, pick.datum);
            }
        }

        const isPixelRange = pixelRange != null;
        const tooltipEnabled = this.tooltip.enabled && pick.series.properties.tooltip.enabled;
        const exactlyMatched = range === 'exact' && pick.distance === 0;
        const rangeMatched = range === 'nearest' || isPixelRange || exactlyMatched;
        const shouldUpdateTooltip = tooltipEnabled && rangeMatched && (!isNewDatum || html !== undefined);

        const meta = TooltipManager.makeTooltipMeta(event, pick.datum);

        if (shouldUpdateTooltip) {
            this.tooltipManager.updateTooltip(this.id, meta, html);
        }
    }

    protected handlePointerNode(event: PointerOffsets) {
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
        event: PointerOffsets,
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

    private seriesGroupingChanged = (event: TypedEvent) => {
        if (!(event instanceof SeriesGroupingChangedEvent)) return;
        const { series, seriesGrouping, oldGrouping } = event;

        // Short-circuit if series isn't already attached to the scene-graph yet.
        if (series.rootGroup.parent == null) return;

        this.seriesLayerManager.changeGroup({
            internalId: series.internalId,
            type: series.type,
            rootGroup: series.rootGroup,
            highlightGroup: series.highlightGroup,
            annotationGroup: series.annotationGroup,
            getGroupZIndexSubOrder: (type) => series.getGroupZIndexSubOrder(type),
            seriesGrouping,
            oldGrouping,
        });
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

        this.lastPick = event.currentHighlight;

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

        while (this.performUpdateType !== ChartUpdateType.NONE) {
            if (performance.now() - start > timeoutMs) {
                throw new Error('waitForUpdate() timeout reached.');
            }
            await sleep(5);
        }

        // wait until any remaining updates are flushed through.
        await this.updateMutex.waitForClearAcquireQueue();
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

    private filterMiniChartSeries(series: AgChartOptions['series'] | undefined): AgChartOptions['series'] | undefined;
    private filterMiniChartSeries(series: AgChartOptions['series']): AgChartOptions['series'];
    private filterMiniChartSeries(series: any[] | undefined): any[] | undefined {
        if (series != null) {
            return series.filter((s) => s.showInMiniChart !== false);
        } else {
            return series;
        }
    }

    applyOptions(chartOptions: ChartOptions) {
        const oldOpts = this.processedOptions;
        const deltaOptions = chartOptions.diffOptions(oldOpts);
        const userOptions = chartOptions.userOptions;

        if (deltaOptions == null) return;

        debug('AgChartV2.updateDelta() - applying delta', deltaOptions);

        const completeOptions = mergeDefaults(deltaOptions, oldOpts);
        const modulesChanged = this.applyModules(completeOptions);

        const skip = ['type', 'data', 'series', 'listeners', 'theme', 'legend.listeners', 'navigator.miniChart.label'];
        if (isAgCartesianChartOptions(deltaOptions) || isAgPolarChartOptions(deltaOptions)) {
            // Append axes to defaults.
            skip.push('axes');
        }

        // Needs to be done before applying the series to detect if a seriesNode[Double]Click listener has been added
        if (deltaOptions.listeners) {
            this.registerListeners(this, deltaOptions.listeners as Record<string, TypedEventListener>);
        }

        this.applyOptionValues(this, deltaOptions, { skip });

        let forceNodeDataRefresh = false;
        let seriesStatus: SeriesChangeType = 'no-op';
        if (deltaOptions.series && deltaOptions.series.length > 0) {
            seriesStatus = this.applySeries(this, deltaOptions.series, oldOpts?.series);
            forceNodeDataRefresh = true;
        }
        if (seriesStatus === 'replaced') {
            this.resetAnimations();
        }
        if (this.applyAxes(this, completeOptions, oldOpts, seriesStatus)) {
            forceNodeDataRefresh = true;
        }

        const seriesDataUpdate = !!deltaOptions.data || seriesStatus === 'data-change' || seriesStatus === 'replaced';
        const legendKeys = getLegendKeys();
        const optionsHaveLegend = Object.values(legendKeys).some(
            (legendKey) => (deltaOptions as any)[legendKey] != null
        );
        const otherRefreshUpdate = deltaOptions.title != null && deltaOptions.subtitle != null;
        forceNodeDataRefresh = forceNodeDataRefresh || seriesDataUpdate || optionsHaveLegend || otherRefreshUpdate;
        if (deltaOptions.data) {
            this.data = deltaOptions.data;
        }
        if (deltaOptions.legend?.listeners) {
            Object.assign(this.legend!.listeners, deltaOptions.legend.listeners);
        }
        if (deltaOptions.listeners) {
            this.updateAllSeriesListeners();
        }

        this.chartOptions = chartOptions;
        this.processedOptions = completeOptions;
        this.userOptions = mergeDefaults(userOptions, this.userOptions);

        const navigatorModule = this.modules.get('navigator') as any;
        const zoomModule = this.modules.get('zoom') as any;

        if (!navigatorModule?.enabled && !zoomModule?.enabled) {
            // reset zoom to initial state
            this.zoomManager.updateZoom();
        }

        const miniChart = navigatorModule?.miniChart;
        if (miniChart?.enabled === true && deltaOptions?.series != null) {
            const seriesStatus = this.applySeries(
                miniChart,
                this.filterMiniChartSeries(deltaOptions.series),
                this.filterMiniChartSeries(oldOpts?.series)
            );
            this.applyAxes(miniChart, deltaOptions, oldOpts, seriesStatus, [
                'axes[].tick',
                'axes[].thickness',
                'axes[].title',
                'axes[].crosshair',
                'axes[].gridLine',
                'axes[].label',
            ]);

            const axes = miniChart.axes as ChartAxis[];
            const horizontalAxis = axes.find((axis) => axis.direction === ChartAxisDirection.X);

            for (const axis of axes) {
                axis.gridLine.enabled = false;
                axis.label.enabled = axis === horizontalAxis;
                axis.tick.enabled = false;
                axis.interactionEnabled = false;
            }

            if (horizontalAxis != null) {
                const labelOptions = deltaOptions.navigator?.miniChart?.label;
                const intervalOptions = deltaOptions.navigator?.miniChart?.label?.interval;

                jsonApply(horizontalAxis.label, labelOptions, {
                    path: 'navigator.miniChart.label',
                    skip: [
                        'navigator.miniChart.label.interval',
                        'navigator.miniChart.label.rotation',
                        'navigator.miniChart.label.minSpacing',
                        'navigator.miniChart.label.autoRotate',
                        'navigator.miniChart.label.autoRotateAngle',
                    ],
                });
                jsonApply(horizontalAxis.tick, intervalOptions, {
                    path: 'navigator.miniChart.interval',
                    skip: [
                        'navigator.miniChart.interval.enabled',
                        'navigator.miniChart.interval.width',
                        'navigator.miniChart.interval.size',
                        'navigator.miniChart.interval.color',
                        'navigator.miniChart.interval.interval',
                        'navigator.miniChart.interval.step',
                    ],
                });

                const step = intervalOptions?.step;
                if (step != null) {
                    horizontalAxis.tick.interval = step;
                }
            }
        } else if (miniChart?.enabled === false) {
            miniChart.series = [];
            miniChart.axes = [];
        }

        const majorChange = forceNodeDataRefresh || modulesChanged;
        const updateType = majorChange ? ChartUpdateType.UPDATE_DATA : ChartUpdateType.PERFORM_LAYOUT;
        debug('AgChartV2.applyChartOptions() - update type', ChartUpdateType[updateType]);
        this.update(updateType, { forceNodeDataRefresh, newAnimationBatch: true });
    }

    private applyModules(options: AgChartOptions) {
        let modulesChanged = false;
        for (const module of REGISTERED_MODULES) {
            if (module.type !== 'root' && module.type !== 'legend') {
                continue;
            }

            const optionsValue = (options as any)[module.optionsKey];

            const shouldBeEnabled = module.chartTypes.includes((this.constructor as any).type) && optionsValue != null;
            const isEnabled = this.isModuleEnabled(module);

            if (shouldBeEnabled === isEnabled) {
                continue;
            }

            if (shouldBeEnabled) {
                this.addModule(module);
                (this as any)[module.optionsKey] = this.modules.get(module.optionsKey); // TODO remove
            } else {
                this.removeModule(module);
                delete (this as any)[module.optionsKey]; // TODO remove
            }

            modulesChanged = true;
        }

        return modulesChanged;
    }

    private applySeries(
        chart: { series: Series<any>[] },
        optSeries: AgChartOptions['series'],
        oldOptSeries?: AgChartOptions['series']
    ): SeriesChangeType {
        if (!optSeries) {
            return 'no-change';
        }

        const matchResult = matchSeriesOptions(chart.series, optSeries, oldOptSeries);
        if (matchResult.status === 'no-overlap') {
            debug(
                `AgChartV2.applySeries() - creating new series instances, status: ${matchResult.status}`,
                matchResult
            );
            chart.series = this.createSeries(optSeries);
            return 'replaced';
        }

        debug(`AgChartV2.applySeries() - matchResult`, matchResult);

        const seriesInstances = [];
        for (const change of matchResult.changes) {
            if (change.status === 'add') {
                const newSeries = this.createSeries([change.opts])[0];
                seriesInstances.push(newSeries);
                debug(`AgChartV2.applySeries() - created new series`, newSeries);
                continue;
            } else if (change.status === 'remove') {
                debug(`AgChartV2.applySeries() - removing series at previous idx ${change.idx}`, change.series);
                continue;
            } else if (change.status === 'no-op') {
                seriesInstances.push(change.series);
                debug(`AgChartV2.applySeries() - no change to series at previous idx ${change.idx}`, change.series);
                continue;
            }

            const { series, diff, idx } = change;
            debug(`AgChartV2.applySeries() - applying series diff previous idx ${idx}`, diff, series);
            this.applySeriesValues(series, diff);
            series.markNodeDataDirty();
            seriesInstances.push(series);
        }
        // Ensure declaration order is set, this is used for correct z-index behavior for combo charts.
        for (let idx = 0; idx < seriesInstances.length; idx++) {
            seriesInstances[idx]._declarationOrder = idx;
        }

        debug(`AgChartV2.applySeries() - final series instances`, seriesInstances);
        chart.series = seriesInstances;

        const dataChanged = matchResult.changes.some(({ diff }) => {
            return diff && (diff.seriesGrouping != null || diff.data != null);
        });
        const noop = matchResult.changes.every((c) => c.status === 'no-op');
        return dataChanged ? 'data-change' : noop ? 'no-op' : 'updated';
    }

    private applyAxes(
        chart: { axes: ChartAxis[] },
        options: AgChartOptions,
        oldOpts: AgChartOptions,
        seriesStatus: SeriesChangeType,
        skip: string[] = []
    ) {
        if (!('axes' in options) || !options.axes) {
            return false;
        }

        skip = ['axes[].type', ...skip];

        const { axes } = options;
        const forceRecreate = seriesStatus === 'replaced';
        const matchingTypes =
            !forceRecreate && chart.axes.length === axes.length && chart.axes.every((a, i) => a.type === axes[i].type);

        // Try to optimise series updates if series count and types didn't change.
        if (matchingTypes && isAgCartesianChartOptions(oldOpts)) {
            chart.axes.forEach((axis, index) => {
                const previousOpts = oldOpts.axes?.[index] ?? {};
                const axisDiff = jsonDiff(previousOpts, axes[index]) as any;

                debug(`AgChartV2.applyAxes() - applying axis diff idx ${index}`, axisDiff);

                const path = `axes[${index}]`;
                this.applyOptionValues(axis, axisDiff, { path, skip });
            });
            return true;
        }

        debug(`AgChartV2.applyAxes() - creating new axes instances; seriesStatus: ${seriesStatus}`);
        chart.axes = this.createAxis(axes, skip);
        return true;
    }

    private createSeries(options: SeriesOptionsTypes[]): Series<any>[] {
        const series: Series<any>[] = [];
        const moduleContext = this.getModuleContext();

        for (const seriesOptions of options ?? []) {
            const type = seriesOptions.type ?? 'unknown';
            if (isEnterpriseSeriesType(type) && !isEnterpriseSeriesTypeLoaded(type)) {
                continue;
            }
            const seriesInstance = createSeries(type, moduleContext) as Series<any>;
            this.applySeriesOptionModules(seriesInstance, seriesOptions);
            this.applySeriesValues(seriesInstance, seriesOptions);
            series.push(seriesInstance);
        }

        return series;
    }

    private applySeriesOptionModules(series: Series<any>, options: AgBaseSeriesOptions<any>) {
        const moduleContext = series.createModuleContext();
        const moduleMap = series.getModuleMap();

        for (const module of REGISTERED_MODULES) {
            if (module.type !== 'series-option') continue;
            if (module.optionsKey in options && module.seriesTypes.includes(series.type)) {
                moduleMap.addModule(module, (module) => new module.instanceConstructor(moduleContext));
            }
        }
    }

    private applySeriesValues(target: Series<any>, options: AgBaseSeriesOptions<any>) {
        const moduleMap = target.getModuleMap();
        const {
            type,
            data,
            errorBar,
            listeners,
            seriesGrouping,
            showInMiniChart: _showInMiniChart,
            ...seriesOptions
        } = options as any;

        target.properties.set(seriesOptions);

        if ('data' in options) {
            target.data = options.data;
        }

        if ('errorBar' in options && moduleMap.isModuleEnabled('errorBar')) {
            (moduleMap.getModule('errorBar') as any).properties.set(options.errorBar);
        }

        if (options?.listeners) {
            this.registerListeners(target, options.listeners as Record<string, TypedEventListener>);
        }

        if (seriesGrouping) {
            target.seriesGrouping = { ...target.seriesGrouping, ...(seriesGrouping as SeriesGrouping) };
        }
    }

    private createAxis(options: AgBaseAxisOptions[], skip: string[]): ChartAxis[] {
        const guesser: AxisPositionGuesser = new AxisPositionGuesser();
        const moduleContext = this.getModuleContext();

        let index = 0;
        for (const axisOptions of options ?? []) {
            const axis = getAxis(axisOptions.type, moduleContext);
            const path = `axes[${index++}]`;
            this.applyAxisModules(axis, axisOptions);
            this.applyOptionValues(axis, axisOptions, { path, skip });

            guesser.push(axis, axisOptions);
        }

        return guesser.guessInvalidPositions();
    }

    private applyAxisModules(axis: ChartAxis, options: AgBaseAxisOptions) {
        let modulesChanged = false;
        const rootModules = REGISTERED_MODULES.filter((m): m is AxisOptionModule => m.type === 'axis-option');
        const moduleContext = axis.createModuleContext();

        for (const module of rootModules) {
            const shouldBeEnabled = (options as any)[module.optionsKey] != null;
            const moduleMap = axis.getModuleMap();
            const isEnabled = moduleMap.isModuleEnabled(module);

            if (shouldBeEnabled === isEnabled) continue;
            modulesChanged = true;

            if (shouldBeEnabled) {
                moduleMap.addModule(module, (module) => new module.instanceConstructor(moduleContext));
                (axis as any)[module.optionsKey] = moduleMap.getModule(module); // TODO remove
            } else {
                moduleMap.removeModule(module);
                delete (axis as any)[module.optionsKey]; // TODO remove
            }
        }

        return modulesChanged;
    }

    private applyOptionValues<T extends object, S>(
        target: T,
        options?: S,
        { skip, path }: { skip?: string[]; path?: string } = {}
    ): T {
        const moduleContext = this.getModuleContext();

        // Allow context to be injected and meet the type requirements
        class CaptionWithContext extends Caption {
            constructor() {
                super();
                this.registerInteraction(moduleContext);
            }
        }
        return jsonApply<T, any>(target, options, {
            constructors: {
                ...JSON_APPLY_OPTIONS.constructors,
                title: CaptionWithContext,
                subtitle: CaptionWithContext,
                footnote: CaptionWithContext,
            },
            constructedArrays: JSON_APPLY_PLUGINS.constructedArrays,
            allowedTypes: {
                ...JSON_APPLY_OPTIONS.allowedTypes,
            },
            skip,
            path,
        });
    }

    private registerListeners(source: ObservableLike, listeners: Record<string, TypedEventListener>) {
        source.clearEventListeners();
        for (const [property, listener] of Object.entries(listeners)) {
            if (isFunction(listener)) {
                source.addEventListener(property, listener);
            }
        }
    }
}
