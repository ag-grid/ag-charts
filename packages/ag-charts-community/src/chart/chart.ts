import type { ModuleInstance } from '../module/baseModule';
import type { LegendModule, RootModule } from '../module/coreModules';
import { moduleRegistry } from '../module/module';
import type { ModuleContext } from '../module/moduleContext';
import type { AxisOptionModule, ChartOptions } from '../module/optionsModule';
import type { SeriesOptionModule } from '../module/optionsModuleTypes';
import type { AgBaseAxisOptions } from '../options/chart/axisOptions';
import type { AgChartInstance, AgChartOptions } from '../options/chart/chartBuilderOptions';
import type { AgChartClickEvent, AgChartDoubleClickEvent } from '../options/chart/eventOptions';
import { BBox } from '../scene/bbox';
import { Group } from '../scene/group';
import type { Point } from '../scene/point';
import { Scene } from '../scene/scene';
import type { PlacedLabel, PointLabelDatum } from '../scene/util/labelPlacement';
import { isPointLabelDatum, placeLabels } from '../scene/util/labelPlacement';
import styles from '../styles/styles';
import { setAriaLabel } from '../util/ariaUtil';
import { groupBy } from '../util/array';
import { sleep } from '../util/async';
import { Debug } from '../util/debug';
import { createElement, injectStyle } from '../util/dom';
import { createId } from '../util/id';
import { jsonApply, jsonDiff } from '../util/json';
import { Logger } from '../util/logger';
import { Mutex } from '../util/mutex';
import { clamp } from '../util/number';
import { mergeDefaults, without } from '../util/object';
import type { TypedEvent, TypedEventListener } from '../util/observable';
import { Observable } from '../util/observable';
import { Padding } from '../util/padding';
import { BaseProperties } from '../util/properties';
import { ActionOnSet } from '../util/proxy';
import { debouncedAnimationFrame, debouncedCallback } from '../util/render';
import { SizeMonitor } from '../util/sizeMonitor';
import { isDefined, isFiniteNumber, isFunction, isNumber } from '../util/type-guards';
import { BOOLEAN, OBJECT, UNION, Validate } from '../util/validation';
import { Caption } from './caption';
import type { ChartAnimationPhase } from './chartAnimationPhase';
import type { ChartAxis } from './chartAxis';
import { ChartAxisDirection } from './chartAxisDirection';
import { ChartContext } from './chartContext';
import { ChartHighlight } from './chartHighlight';
import type { ChartMode } from './chartMode';
import { JSON_APPLY_PLUGINS } from './chartOptions';
import { ChartUpdateType } from './chartUpdateType';
import { DataController } from './data/dataController';
import { axisRegistry } from './factory/axisRegistry';
import { EXPECTED_ENTERPRISE_MODULES } from './factory/expectedEnterpriseModules';
import { legendRegistry } from './factory/legendRegistry';
import { seriesRegistry } from './factory/seriesRegistry';
import type { HighlightChangeEvent } from './interaction/highlightManager';
import type { PointerInteractionEvent, PointerOffsets } from './interaction/interactionManager';
import { InteractionState } from './interaction/interactionManager';
import type { KeyNavEvent } from './interaction/keyNavManager';
import { SyncManager } from './interaction/syncManager';
import { TooltipManager } from './interaction/tooltipManager';
import { ZoomManager } from './interaction/zoomManager';
import { Keyboard } from './keyboard';
import { makeKeyboardPointerEvent } from './keyboardUtil';
import { Layers } from './layers';
import type { CategoryLegendDatum, ChartLegend, ChartLegendType, GradientLegendDatum } from './legendDatum';
import { AxisPositionGuesser } from './mapping/prepareAxis';
import { matchSeriesOptions } from './mapping/prepareSeries';
import { type SeriesOptionsTypes, isAgCartesianChartOptions } from './mapping/types';
import { ModulesManager } from './modulesManager';
import { ChartOverlays } from './overlay/chartOverlays';
import { getLoadingSpinner } from './overlay/loadingSpinner';
import { type Series, SeriesGroupingChangedEvent, SeriesNodePickMode } from './series/series';
import { SeriesLayerManager } from './series/seriesLayerManager';
import type { SeriesGrouping } from './series/seriesStateManager';
import type { ISeries, SeriesNodeDatum } from './series/seriesTypes';
import { Tooltip, TooltipPointerEvent } from './tooltip/tooltip';
import { BaseLayoutProcessor } from './update/baseLayoutProcessor';
import { DataWindowProcessor } from './update/dataWindowProcessor';
import { OverlaysProcessor } from './update/overlaysProcessor';
import type { UpdateProcessor } from './update/processor';
import type { UpdateOpts } from './updateService';

const debug = Debug.create(true, 'opts');

export type TransferableResources = { container?: HTMLElement; scene: Scene; element: HTMLElement };

type SyncModule = ModuleInstance & { enabled?: boolean; syncAxes: (skipSync: boolean) => void };

type PickedNode = {
    series: Series<any, any>;
    datum: SeriesNodeDatum;
    distance: number;
};

type SeriesChangeType =
    | 'no-op'
    | 'no-change'
    | 'replaced'
    | 'data-change'
    | 'series-grouping-change'
    | 'series-count-changed'
    | 'updated';

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

type PointerEvent = PointerOffsets & Pick<Partial<PointerInteractionEvent>, 'pointerHistory'>;

class SeriesArea extends BaseProperties {
    @Validate(BOOLEAN, { optional: true })
    clip?: boolean;

    @Validate(OBJECT)
    padding = new Padding(0);
}

export abstract class Chart extends Observable implements AgChartInstance {
    private static readonly chartsInstances = new WeakMap<HTMLElement, Chart>();

    static getInstance(element: HTMLElement): Chart | undefined {
        return Chart.chartsInstances.get(element);
    }

    readonly id = createId(this);

    className?: string;

    readonly seriesRoot = new Group({ name: `${this.id}-series-root` });
    readonly highlightRoot = new Group({
        name: `${this.id}-highlight-root`,
        layer: true,
        zIndex: Layers.SERIES_HIGHLIGHT_ZINDEX,
        nonEmptyChildDerivedZIndex: true,
    });
    readonly annotationRoot = new Group({
        name: `${this.id}-annotation-root`,
        layer: true,
        zIndex: Layers.SERIES_ANNOTATION_ZINDEX,
    });

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
    container?: HTMLElement;

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

    /** NOTE: This is exposed for use by Integrated charts only. */
    get canvasElement() {
        return this.ctx.scene.canvas.element;
    }

    /** NOTE: This is exposed for use by Integrated charts only. */
    getCanvasDataURL(fileFormat?: string) {
        return this.ctx.scene.getDataURL(fileFormat);
    }

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
        this.ctx.scene.download(fileName, fileFormat);
    }

    @Validate(OBJECT)
    readonly padding = new Padding(20);

    @Validate(OBJECT)
    readonly seriesArea = new SeriesArea();

    @Validate(OBJECT)
    readonly title = new Caption();

    @Validate(OBJECT)
    readonly subtitle = new Caption();

    @Validate(OBJECT)
    readonly footnote = new Caption();

    @Validate(OBJECT)
    readonly keyboard = new Keyboard();

    @Validate(UNION(['standalone', 'integrated'], 'a chart mode'))
    mode: ChartMode = 'standalone';

    public destroyed = false;

    private _skipSync = false;
    private readonly _destroyFns: (() => void)[] = [];

    chartAnimationPhase: ChartAnimationPhase = 'initial';

    public readonly modulesManager = new ModulesManager();
    // FIXME: zoomManager should be owned by ctx, but it can't because it is used by CartesianChart.onAxisChange before ctx is initialised
    public readonly zoomManager = new ZoomManager();
    public readonly ctx: ChartContext;
    protected readonly axisGridGroup: Group;
    protected readonly axisGroup: Group;
    protected readonly seriesLayerManager: SeriesLayerManager;

    private readonly sizeMonitor: SizeMonitor;

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

        let scene: Scene | undefined = resources?.scene;
        const element =
            resources?.element ??
            createElement('div', 'ag-chart-wrapper', { position: 'relative', userSelect: 'none' });
        const container = resources?.container;

        this.element = element;

        injectStyle(styles, 'chart');

        const root = new Group({ name: 'root' });
        // Prevent the scene from rendering chart components in an invalid state
        // (before first layout is performed).
        root.visible = false;
        root.append(this.seriesRoot);
        root.append(this.highlightRoot);
        root.append(this.annotationRoot);

        this.axisGridGroup = new Group({ name: 'Axes-Grids', layer: true, zIndex: Layers.AXIS_GRID_ZINDEX });
        root.appendChild(this.axisGridGroup);

        this.axisGroup = new Group({ name: 'Axes', layer: true, zIndex: Layers.AXIS_ZINDEX });
        root.appendChild(this.axisGroup);

        this.sizeMonitor = new SizeMonitor();
        this.sizeMonitor.observe(this.element, (size) => this.rawResize(size));

        const { overrideDevicePixelRatio } = options.specialOverrides;
        scene ??= new Scene({ pixelRatio: overrideDevicePixelRatio });
        scene.setRoot(root).setContainer(element);
        this.autoSize = true;

        const interactiveContainer = container ?? options.userOptions.container ?? undefined;
        this.tooltip = new Tooltip();
        this.seriesLayerManager = new SeriesLayerManager(this.seriesRoot, this.highlightRoot, this.annotationRoot);
        const ctx = (this.ctx = new ChartContext(this, {
            scene,
            syncManager: new SyncManager(this),
            element,
            interactiveContainer,
            updateCallback: (type = ChartUpdateType.FULL, opts) => this.update(type, opts),
            updateMutex: this.updateMutex,
        }));

        this.overlays = new ChartOverlays();
        this.overlays.loading.renderer ??= () =>
            getLoadingSpinner(this.overlays.loading.getText(), ctx.animationManager.defaultDuration);

        this.processors = [
            new BaseLayoutProcessor(this, ctx.layoutService),
            new DataWindowProcessor(this, ctx.dataService, ctx.updateService, ctx.zoomManager),
            new OverlaysProcessor(this, this.overlays, ctx.dataService, ctx.layoutService, ctx.animationManager),
        ];

        this.highlight = new ChartHighlight();
        this.container = container;

        const { All } = InteractionState;
        const moduleContext = this.getModuleContext();
        const seriesRegion = ctx.regionManager.addRegion('series', this.seriesRoot, this.axisGroup);

        ctx.regionManager.addRegion('root', root);

        this._destroyFns.push(
            ctx.dataService.addListener('data-load', (event) => {
                this.data = event.data;
            }),

            ctx.scene.attachNode(this.title.node),
            ctx.scene.attachNode(this.subtitle.node),
            ctx.scene.attachNode(this.footnote.node),

            this.title.registerInteraction(moduleContext, 'title'),
            this.subtitle.registerInteraction(moduleContext, 'subtitle'),
            this.footnote.registerInteraction(moduleContext, 'footnote'),

            ctx.interactionManager.addListener('click', (event) => this.onClick(event)),
            ctx.interactionManager.addListener('dblclick', (event) => this.onDoubleClick(event)),
            seriesRegion.addListener('hover', (event) => this.onMouseMove(event)),
            seriesRegion.addListener('leave', (event) => this.onLeave(event)),
            seriesRegion.addListener('blur', (event) => this.onBlur(event)),
            seriesRegion.addListener('tab', (event) => this.onTab(event)),
            seriesRegion.addListener('nav-vert', (event) => this.onNavVert(event)),
            seriesRegion.addListener('nav-hori', (event) => this.onNavHori(event)),
            ctx.interactionManager.addListener('page-left', () => this.destroy()),
            ctx.interactionManager.addListener('contextmenu', (event) => this.onContextMenu(event), All),

            ctx.animationManager.addListener('animation-frame', () => {
                this.update(ChartUpdateType.SCENE_RENDER);
            }),
            ctx.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event)),
            ctx.zoomManager.addListener('zoom-pan-start', () => this.resetPointer()),
            ctx.zoomManager.addListener('zoom-change', () => {
                this.resetPointer();
                this.series.map((s) => (s as any).animationState?.transition('updateData'));
                const skipAnimations = this.chartAnimationPhase !== 'initial';
                this.update(ChartUpdateType.PERFORM_LAYOUT, { forceNodeDataRefresh: true, skipAnimations });
            })
        );
    }

    getModuleContext(): ModuleContext {
        return this.ctx;
    }

    getAriaLabel(): string {
        return [this.title.text, this.subtitle.text, this.footnote.text].filter((v) => v).join('. ');
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
        this.ctx.animationManager.reset();
    }

    skipAnimations() {
        this.ctx.animationManager.skipCurrentBatch();
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
        this.tooltip.destroy();
        this.overlays.destroy();
        this.sizeMonitor.unobserve(this.element);
        this.modulesManager.destroy();

        if (keepTransferableResources) {
            this.ctx.scene.strip();
            result = { container: this.container, scene: this.ctx.scene, element: this.element };
        } else {
            this.ctx.scene.destroy();
            this.container = undefined;
        }

        this.destroySeries(this.series);
        this.seriesLayerManager.destroy();

        this.axes.forEach((a) => a.destroy());
        this.axes = [];

        // Reset animation state.
        this.animationRect = undefined;

        this.ctx.destroy();
        this.zoomManager.destroy();
        this.destroyed = true;

        Object.freeze(this);

        return result;
    }

    resetPointer(highlightOnly = false) {
        if (!highlightOnly) {
            this.ctx.tooltipManager.removeTooltip(this.id);
        }
        this.ctx.highlightManager.updateHighlight(this.id);
        this.lastInteractionEvent = undefined;
    }

    requestFactoryUpdate(cb: (chart: Chart) => Promise<void> | void) {
        if (this.destroyed) return;
        this._pendingFactoryUpdatesCount++;
        this.updateMutex
            .acquire(async () => {
                if (this.destroyed) return;
                await cb(this);
                if (this.destroyed) return;
                this._pendingFactoryUpdatesCount--;
            })
            .catch((e) => Logger.errorOnce(e));
    }

    private _pendingFactoryUpdatesCount = 0;
    private _performUpdateNoRenderCount = 0;
    private _performUpdateSkipAnimations: boolean = false;
    private performUpdateType: ChartUpdateType = ChartUpdateType.NONE;

    private updateShortcutCount = 0;
    private seriesToUpdate: Set<ISeries<any, any>> = new Set();
    private updateMutex = new Mutex();
    private updateRequestors: Record<string, ChartUpdateType> = {};
    private performUpdateTrigger = debouncedCallback(async ({ count }) => {
        if (this.destroyed) return;
        this.updateMutex
            .acquire(async () => {
                try {
                    await this.performUpdate(count);
                } catch (error) {
                    Logger.error('update error', error);
                }
            })
            .catch((e) => Logger.errorOnce(e));
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
            this.ctx.animationManager.skipCurrentBatch();
            this._performUpdateSkipAnimations = true;
        }

        if (newAnimationBatch && this.ctx.animationManager.isActive()) {
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

    private _performUpdateSplits: Record<string, number> = {};
    private async performUpdate(count: number) {
        const { performUpdateType, extraDebugStats, _performUpdateSplits: splits, ctx } = this;
        const seriesToUpdate = [...this.seriesToUpdate];

        // Clear state immediately so that side effects can be detected prior to SCENE_RENDER.
        this.performUpdateType = ChartUpdateType.NONE;
        this.seriesToUpdate.clear();

        if (this.updateShortcutCount === 0 && performUpdateType < ChartUpdateType.SCENE_RENDER) {
            ctx.animationManager.startBatch(this._performUpdateSkipAnimations);
            ctx.animationManager.onBatchStop(() => (this.chartAnimationPhase = 'ready'));
        }

        this.debug('Chart.performUpdate() - start', ChartUpdateType[performUpdateType]);
        let previousSplit = performance.now();
        splits.start ??= previousSplit;
        const updateSplits = (splitName: string) => {
            splits[splitName] ??= 0;
            splits[splitName] += performance.now() - previousSplit;
            previousSplit = performance.now();
        };

        let updateDeferred = false;
        switch (performUpdateType) {
            case ChartUpdateType.FULL:
                this.updateThemeClassName();
            // fallthrough

            case ChartUpdateType.UPDATE_DATA:
                await this.updateData();
                updateSplits('⬇️');
            // fallthrough

            case ChartUpdateType.PROCESS_DATA:
                await this.processData();
                this.resetPointer(true);
                updateSplits('🏭');
            // fallthrough

            case ChartUpdateType.PERFORM_LAYOUT:
                if (this.checkUpdateShortcut(ChartUpdateType.PERFORM_LAYOUT)) break;
                if (!this.checkFirstAutoSize(seriesToUpdate)) {
                    updateDeferred = true;
                    break;
                }

                await this.processLayout();
                updateSplits('⌖');
            // fallthrough

            case ChartUpdateType.SERIES_UPDATE:
                if (this.checkUpdateShortcut(ChartUpdateType.SERIES_UPDATE)) break;

                const { seriesRect } = this;
                await Promise.all(seriesToUpdate.map((series) => series.update({ seriesRect })));
                setAriaLabel(this.ctx.scene.canvas.container, this.getAriaLabel());

                updateSplits('🤔');
            // fallthrough

            case ChartUpdateType.TOOLTIP_RECALCULATION:
                if (this.checkUpdateShortcut(ChartUpdateType.TOOLTIP_RECALCULATION)) break;

                const tooltipMeta = ctx.tooltipManager.getTooltipMeta(this.id);

                if (performUpdateType <= ChartUpdateType.SERIES_UPDATE && tooltipMeta?.lastPointerEvent != null) {
                    this.handlePointer(tooltipMeta.lastPointerEvent, true);
                }
                updateSplits('↖');
            // fallthrough

            case ChartUpdateType.SCENE_RENDER:
                if (this.checkUpdateShortcut(ChartUpdateType.SCENE_RENDER)) break;

                // Force any initial animation changes to be applied BEFORE any rendering happens.
                ctx.animationManager.endBatch();

                extraDebugStats['updateShortcutCount'] = this.updateShortcutCount;
                await ctx.scene.render({ debugSplitTimes: splits, extraDebugStats });
                this.extraDebugStats = {};
                for (const key in splits) {
                    delete splits[key];
                }
            // fallthrough

            case ChartUpdateType.NONE:
                // Do nothing.
                this.updateShortcutCount = 0;
                this.updateRequestors = {};
                this._performUpdateSkipAnimations = false;
                ctx.animationManager.endBatch();
        }

        if (!updateDeferred) {
            ctx.updateService.dispatchUpdateComplete(this.getMinRects());
        }

        const end = performance.now();
        this.debug('Chart.performUpdate() - end', {
            chart: this,
            durationMs: Math.round((end - splits['start']) * 100) / 100,
            count,
            performUpdateType: ChartUpdateType[performUpdateType],
        });
    }

    private updateThemeClassName() {
        const {
            element,
            processedOptions: { theme },
        } = this;

        const themeClassNamePrefix = 'ag-charts-theme-';
        const validThemeClassNames = [`${themeClassNamePrefix}default`, `${themeClassNamePrefix}default-dark`];

        let themeClassName = validThemeClassNames[0];
        let isDark = false;

        if (typeof theme === 'string') {
            themeClassName = theme.replace('ag-', themeClassNamePrefix);
            isDark = theme.includes('-dark');
        } else if (typeof theme?.baseTheme === 'string') {
            themeClassName = theme.baseTheme.replace('ag-', themeClassNamePrefix);
            isDark = theme.baseTheme.includes('-dark');
        }

        if (!validThemeClassNames.includes(themeClassName)) {
            themeClassName = isDark ? validThemeClassNames[1] : validThemeClassNames[0];
        }

        element.classList.forEach((className) => {
            if (className.startsWith(themeClassNamePrefix) && className !== themeClassName) {
                element.classList.remove(className);
            }
        });

        element.classList.add(themeClassName);
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

    private checkFirstAutoSize(seriesToUpdate: ISeries<any, any>[]) {
        if (this.autoSize && !this._lastAutoSize) {
            const count = this._performUpdateNoRenderCount++;
            const backOffMs = (count + 1) ** 2 * 40;

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
        changeValue(newValue, oldValue) {
            this.onAxisChange(newValue, oldValue);
        },
    })
    axes: ChartAxis[] = [];

    @ActionOnSet<Chart>({
        changeValue(newValue, oldValue) {
            this.onSeriesChange(newValue, oldValue);
        },
    })
    series: Series<any, any>[] = [];

    protected onAxisChange(newValue: ChartAxis[], oldValue: ChartAxis[] = []) {
        for (const axis of oldValue) {
            if (newValue.includes(axis)) continue;
            axis.detachAxis(this.axisGroup, this.axisGridGroup);
            axis.destroy();
        }

        for (const axis of newValue) {
            if (oldValue?.includes(axis)) continue;
            axis.attachAxis(this.axisGroup, this.axisGridGroup);
        }
    }

    protected onSeriesChange(newValue: Series<any, any>[], oldValue?: Series<any, any>[]) {
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

    protected destroySeries(allSeries: Series<any, any>[]): void {
        allSeries?.forEach((series) => {
            series.removeEventListener('nodeClick', this.onSeriesNodeClick);
            series.removeEventListener('nodeDoubleClick', this.onSeriesNodeDoubleClick);
            series.removeEventListener('groupingChanged', this.seriesGroupingChanged);
            series.destroy();
            this.seriesLayerManager.releaseGroup(series);

            series.chart = undefined;
        });
    }

    private addSeriesListeners(series: Series<any, any>) {
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
                const newAxis = directionAxes.find(
                    (axis) => !axis.keys.length || seriesKeys.some((key) => axis.keys.includes(key))
                );
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

    private rawResize({ width, height }: { width: number; height: number }) {
        if (!this.autoSize) return;

        width = Math.floor(width);
        height = Math.floor(height);

        if (width === 0 && height === 0) return;

        const [autoWidth = 0, authHeight = 0] = this._lastAutoSize ?? [];
        if (autoWidth === width && authHeight === height) return;

        this._lastAutoSize = [width, height];
        this.resize(undefined, undefined, 'SizeMonitor');
    }

    private resize(width?: number, height?: number, source?: string) {
        const { scene, animationManager } = this.ctx;
        width ??= this.width ?? (this.autoSize ? this._lastAutoSize?.[0] : scene.canvas.width);
        height ??= this.height ?? (this.autoSize ? this._lastAutoSize?.[1] : scene.canvas.height);
        this.debug(`Chart.resize() from ${source}`, { width, height, stack: new Error().stack });
        if (!width || !height || !isFiniteNumber(width) || !isFiniteNumber(height)) return;

        if (scene.resize(width, height)) {
            this.resetPointer();
            animationManager.reset();

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
        const modulePromises = this.modulesManager.mapModules((m) => m.updateData?.({ data: this.data }));
        await Promise.all(modulePromises);
    }

    async processData() {
        if (this.series.some((s) => s.canHaveAxes)) {
            this.assignAxesToSeries();

            const syncModule = this.modulesManager.getModule<SyncModule>('sync');
            if (syncModule?.enabled) {
                syncModule.syncAxes(this._skipSync);
            } else {
                this.assignSeriesToAxes();
            }
        }

        const dataController = new DataController(this.mode);
        const seriesPromises = this.series.map((s) => s.processData(dataController));
        const modulePromises = this.modulesManager.mapModules((m) => m.processData?.({ dataController }));
        dataController.execute();
        await Promise.all([...seriesPromises, ...modulePromises]);

        for (const { legendType, legend } of this.modulesManager.legends()) {
            legend.data = this.getLegendData(legendType, this.mode !== 'integrated');
        }

        this.dataProcessListeners.forEach((resolve) => resolve());
        this.dataProcessListeners.clear();
    }

    placeLabels(): Map<Series<any, any>, PlacedLabel[]> {
        const visibleSeries: Series<any, any>[] = [];
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

    private getLegendData(legendType: ChartLegendType, warnConflicts?: boolean) {
        const legendData = this.series
            .filter((s) => s.properties.showInLegend)
            .flatMap((s) => s.getLegendData(legendType));

        const isCategoryLegendData = (
            data: Array<CategoryLegendDatum | GradientLegendDatum>
        ): data is CategoryLegendDatum[] => data.every((d) => d.legendType === 'category');

        if (warnConflicts && isCategoryLegendData(legendData)) {
            // Validate each series that shares a legend item label uses the same fill colour
            const seriesMarkerFills: { [key: string]: { [key: string]: string | undefined } } = {};
            const seriesTypeMap = new Map(this.series.map((s) => [s.id, s.type]));

            for (const { seriesId, marker, label } of legendData) {
                if (marker.fill == null) continue;

                const seriesType = seriesTypeMap.get(seriesId)!;
                const markerFill = (seriesMarkerFills[seriesType] ??= {});

                markerFill[label.text] ??= marker.fill;
                if (markerFill[label.text] !== marker.fill) {
                    Logger.warnOnce(
                        `legend item '${label.text}' has multiple fill colors, this may cause unexpected behaviour.`
                    );
                }
            }
        }

        return legendData;
    }

    private async processLayout() {
        const oldRect = this.animationRect;
        await this.performLayout();

        if (oldRect && !this.animationRect?.equals(oldRect)) {
            // Skip animations if the layout changed.
            this.ctx.animationManager.skipCurrentBatch();
        }

        this.debug('Chart.performUpdate() - seriesRect', this.seriesRect);
    }

    protected async performLayout() {
        const { width, height } = this.ctx.scene;
        let ctx = { shrinkRect: new BBox(0, 0, width, height) };
        ctx = this.ctx.layoutService.dispatchPerformLayout('start-layout', ctx);
        ctx = this.ctx.layoutService.dispatchPerformLayout('before-series', ctx);

        const modulePromises = this.modulesManager.mapModules(async (m) => {
            if (m.performLayout != null) {
                ctx = await m.performLayout(ctx);
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

        let result: { series: Series<any, any>; datum: SeriesNodeDatum; distance: number } | undefined;
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

    protected onMouseMove(event: PointerInteractionEvent<'hover'>): void {
        this.lastInteractionEvent = event;
        this.pointerScheduler.schedule();

        this.extraDebugStats['mouseX'] = event.offsetX;
        this.extraDebugStats['mouseY'] = event.offsetY;
        this.update(ChartUpdateType.SCENE_RENDER);
    }

    protected onLeave(event: PointerInteractionEvent<'leave'>): void {
        if (!this.tooltip.pointerLeftOntoTooltip(event)) {
            this.resetPointer();
            this.update(ChartUpdateType.SCENE_RENDER);
            this.ctx.cursorManager.updateCursor('chart');
        }
    }

    private onBlur(_event: KeyNavEvent<'blur'>): void {
        this.ctx.regionManager.updateFocusIndicatorRect(undefined);
        this.resetPointer();
    }

    private onTab(_event: KeyNavEvent<'tab'>): void {
        this.handleFocus();
    }

    private onNavVert(event: KeyNavEvent<'nav-vert'>): void {
        this.focus.series += event.delta;
        this.handleFocus();
    }

    private onNavHori(event: KeyNavEvent<'nav-hori'>): void {
        this.focus.datum += event.delta;
        this.handleFocus();
    }

    private onContextMenu(event: PointerInteractionEvent<'contextmenu'>): void {
        this.ctx.tooltipManager.removeTooltip(this.id);

        // If there is already a context menu visible, then re-pick the highlighted node.
        // We check InteractionState.Default too just in case we were in ContextMenu and the
        // mouse hasn't moved since (see AG-10233).
        const { Default, ContextMenu } = InteractionState;
        if (this.ctx.interactionManager.getState() & (Default | ContextMenu)) {
            this.checkSeriesNodeRange(event, () => {
                this.ctx.highlightManager.updateHighlight(this.id);
            });
        }
    }

    private focus = { series: 0, datum: 0 };
    private handleFocus() {
        const overlayFocus = this.overlays.getFocusInfo();
        if (overlayFocus !== undefined) {
            this.ctx.regionManager.updateFocusIndicatorRect(overlayFocus.rect);
            this.ctx.ariaAnnouncementService.announceValue(overlayFocus.text);
        } else {
            this.handleSeriesFocus();
        }
    }

    private handleSeriesFocus() {
        const { series, focus } = this;
        const visibleSeries = series.filter((s) => s.visible);
        if (visibleSeries.length === 0) return;

        // Update focused series:
        focus.series = clamp(0, focus.series, visibleSeries.length - 1);
        const focusedSeries = visibleSeries[focus.series];

        // Update focused datum:
        const { node, datum, datumIndex } = focusedSeries.pickFocus(focus);
        focus.datum = datumIndex;

        // Update user interaction/interface:
        const keyboardEvent = makeKeyboardPointerEvent(this.ctx.regionManager, node);
        if (keyboardEvent !== undefined) {
            this.lastInteractionEvent = keyboardEvent;
            const html = focusedSeries.getTooltipHtml(datum);
            const meta = TooltipManager.makeTooltipMeta(this.lastInteractionEvent, datum);
            this.ctx.tooltipManager.updateTooltip(this.id, meta, html);
            this.ctx.ariaAnnouncementService.announceHtml(html);
        }
    }

    private lastInteractionEvent?: TooltipPointerEvent;
    private static isHoverEvent(event: TooltipPointerEvent | undefined): event is TooltipPointerEvent<'hover'> {
        return event !== undefined && event.type === 'hover';
    }
    private pointerScheduler = debouncedAnimationFrame(() => {
        if (!this.lastInteractionEvent) return;

        if (this.performUpdateType <= ChartUpdateType.SERIES_UPDATE) {
            // Reschedule until the current update processing is complete, if we try to
            // perform a highlight mid-update then we may not have fresh node data to work with.
            this.pointerScheduler.schedule();
            return;
        }

        this.handlePointer(this.lastInteractionEvent, false);
        this.lastInteractionEvent = undefined;
    });
    protected handlePointer(event: TooltipPointerEvent, redisplay: boolean) {
        // Ignored "pointer event" that comes from a keyboard. We don't need to worry about finding out
        // which datum to use in the highlight & tooltip because the keyboard just navigates through the
        // data directly.
        if (this.ctx.interactionManager.getState() !== InteractionState.Default || !Chart.isHoverEvent(event)) {
            return;
        }

        const { lastPick, hoverRect } = this;
        const { offsetX, offsetY } = event;

        const disablePointer = (highlightOnly = false) => {
            if (lastPick) {
                this.resetPointer(highlightOnly);
            }
        };

        if (redisplay ? this.ctx.animationManager.isActive() : !hoverRect?.containsPoint(offsetX, offsetY)) {
            disablePointer();
            return;
        }

        // Handle node highlighting and tooltip toggling when pointer within `tooltip.range`
        this.handlePointerTooltip(event, disablePointer);

        // Handle node highlighting and mouse cursor when pointer withing `series[].nodeClickRange`
        this.handlePointerNode(event);
    }

    protected handlePointerTooltip(
        event: TooltipPointerEvent<'hover'>,
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
            this.ctx.tooltipManager.removeTooltip(this.id);
            if (this.highlight.range === 'tooltip') {
                disablePointer(true);
            }
            return;
        }

        const isNewDatum = this.highlight.range === 'node' || !lastPick || lastPick !== pick.datum;
        let html;

        if (isNewDatum) {
            html = pick.series.getTooltipHtml(pick.datum);

            if (this.highlight.range === 'tooltip') {
                this.ctx.highlightManager.updateHighlight(this.id, pick.datum);
            }
        }

        const isPixelRange = pixelRange != null;
        const tooltipEnabled = this.tooltip.enabled && pick.series.tooltipEnabled;
        const exactlyMatched = range === 'exact' && pick.distance === 0;
        const rangeMatched = range === 'nearest' || isPixelRange || exactlyMatched;
        const shouldUpdateTooltip = tooltipEnabled && rangeMatched && (!isNewDatum || html !== undefined);

        const meta = TooltipManager.makeTooltipMeta(event, pick.datum);

        if (shouldUpdateTooltip) {
            this.ctx.tooltipManager.updateTooltip(this.id, meta, html);
        }
    }

    protected handlePointerNode(event: PointerEvent) {
        const found = this.checkSeriesNodeRange(event, (series, datum) => {
            if (series.hasEventListener('nodeClick') || series.hasEventListener('nodeDoubleClick')) {
                this.ctx.cursorManager.updateCursor('chart', 'pointer');
            }

            if (this.highlight.range === 'node') {
                this.ctx.highlightManager.updateHighlight(this.id, datum);
            }
        });

        if (!found) {
            this.ctx.cursorManager.updateCursor('chart');

            if (this.highlight.range === 'node') {
                this.ctx.highlightManager.updateHighlight(this.id);
            }
        }
    }

    protected onClick(event: PointerInteractionEvent<'click'>) {
        if (this.checkSeriesNodeClick(event)) {
            this.update(ChartUpdateType.SERIES_UPDATE);
            return;
        }
        this.fireEvent<AgChartClickEvent>({
            type: 'click',
            event: event.sourceEvent,
        });
    }

    protected onDoubleClick(event: PointerInteractionEvent<'dblclick'>) {
        if (this.checkSeriesNodeDoubleClick(event)) {
            this.update(ChartUpdateType.SERIES_UPDATE);
            return;
        }
        this.fireEvent<AgChartDoubleClickEvent>({
            type: 'doubleClick',
            event: event.sourceEvent,
        });
    }

    private checkSeriesNodeClick(event: PointerInteractionEvent<'click'>): boolean {
        return this.checkSeriesNodeRange(event, (series, datum) => series.fireNodeClickEvent(event.sourceEvent, datum));
    }

    private checkSeriesNodeDoubleClick(event: PointerInteractionEvent<'dblclick'>): boolean {
        return this.checkSeriesNodeRange(event, (series, datum) =>
            series.fireNodeDoubleClickEvent(event.sourceEvent, datum)
        );
    }

    private checkSeriesNodeRange(
        event: PointerEvent,
        callback: (series: ISeries<any, any>, datum: SeriesNodeDatum) => void
    ): boolean {
        const nearestNode = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY }, false);

        const datum = nearestNode?.datum;
        const nodeClickRange = datum?.series.properties.nodeClickRange;

        let pixelRange: number | undefined;
        if (isFiniteNumber(nodeClickRange)) {
            pixelRange = nodeClickRange;
        }

        // Find the node if exactly matched and update the highlight picked node
        let pickedNode = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY }, true);
        if (pickedNode) {
            this.ctx.highlightManager.updatePicked(this.id, pickedNode.datum);
        } else {
            this.ctx.highlightManager.updatePicked(this.id);
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
            const allMatch: boolean =
                event.pointerHistory === undefined ||
                event.pointerHistory?.every((pastEvent) => {
                    const historyPoint = { x: pastEvent.offsetX, y: pastEvent.offsetY };
                    const historyNode = this.pickSeriesNode(historyPoint, false, pixelRange);
                    return historyNode?.datum === pickedNode?.datum;
                });
            if (allMatch) {
                callback(pickedNode.series, pickedNode.datum);
                return true;
            }
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
        const seriesToUpdate: Set<ISeries<any, any>> = new Set();
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
            this.ctx.cursorManager.updateCursor(lastSeries.id);
        }
        if (newSeries?.properties.cursor && newDatum) {
            this.ctx.cursorManager.updateCursor(newSeries.id, newSeries.properties.cursor);
        }

        this.lastPick = event.currentHighlight;

        const updateAll = newSeries == null || lastSeries == null;
        if (updateAll) {
            this.update(ChartUpdateType.SERIES_UPDATE);
        } else {
            this.update(ChartUpdateType.SERIES_UPDATE, { seriesToUpdate });
        }
    }

    async waitForUpdate(timeoutMs = 10_000, failOnTimeout = false): Promise<void> {
        const start = performance.now();

        if (this._pendingFactoryUpdatesCount > 0) {
            // wait until any pending updates are flushed through.
            await this.updateMutex.waitForClearAcquireQueue();
        }

        while (this.performUpdateType !== ChartUpdateType.NONE) {
            if (performance.now() - start > timeoutMs) {
                const message = `Chart.waitForUpdate() timeout of ${timeoutMs} reached - first chart update taking too long.`;
                if (failOnTimeout) {
                    throw new Error(message);
                } else {
                    Logger.warnOnce(message);
                }
            }
            await sleep(50);
        }

        // wait until any remaining updates are flushed through.
        await this.updateMutex.waitForClearAcquireQueue();
    }

    private dataProcessListeners = new Set<(...args: any[]) => void>();
    waitForDataProcess(timeout?: number): Promise<void> {
        return new Promise((resolve) => {
            this.dataProcessListeners.add(resolve);
            if (isNumber(timeout)) {
                setTimeout(() => {
                    if (this.dataProcessListeners.has(resolve)) {
                        this.dataProcessListeners.delete(resolve);
                        resolve();
                    }
                }, timeout);
            }
        });
    }

    protected getMinRects() {
        const { width, height } = this.ctx.scene;
        const minRects = this.series.map((series) => series.getMinRects(width, height)).filter(isDefined);

        if (minRects.length === 0) return;

        let maxWidth = 0;
        let maxHeight = 0;
        let maxVisibleWidth = 0;
        let maxVisibleHeight = 0;

        for (const { minRect, minVisibleRect } of minRects) {
            maxWidth = Math.max(maxWidth, minRect.width);
            maxHeight = Math.max(maxHeight, minRect.height);
            maxVisibleWidth = Math.max(maxVisibleWidth, minVisibleRect.width);
            maxVisibleHeight = Math.max(maxVisibleHeight, minVisibleRect.height);
        }

        const minRect = new BBox(0, 0, maxWidth, maxHeight);
        let minVisibleRect = minRect.clone();
        if (maxVisibleWidth > 0 && maxVisibleHeight > 0) {
            minVisibleRect = new BBox(0, 0, maxVisibleWidth, maxVisibleHeight);
        }

        return { minRect, minVisibleRect };
    }

    private filterMiniChartSeries(series: AgChartOptions['series'] | undefined): AgChartOptions['series'] | undefined;
    private filterMiniChartSeries(series: AgChartOptions['series']): AgChartOptions['series'];
    private filterMiniChartSeries(series: any[] | undefined): any[] | undefined {
        return series?.filter((s) => s.showInMiniChart !== false);
    }

    applyOptions(chartOptions: ChartOptions) {
        const oldOpts = this.processedOptions;
        const deltaOptions = chartOptions.diffOptions(oldOpts);
        const userOptions = chartOptions.userOptions;

        if (deltaOptions == null) return;

        debug('AgChartV2.updateDelta() - applying delta', deltaOptions);

        const completeOptions = mergeDefaults(deltaOptions, oldOpts);
        const modulesChanged = this.applyModules(completeOptions);

        const skip = [
            'type',
            'data',
            'series',
            'listeners',
            'theme',
            'legend.listeners',
            'navigator.miniChart.series',
            'navigator.miniChart.label',
            'axes',
            'topology',
        ];

        // Needs to be done before applying the series to detect if a seriesNode[Double]Click listener has been added
        if (deltaOptions.listeners) {
            this.registerListeners(this, deltaOptions.listeners as Record<string, TypedEventListener>);
        }

        jsonApply<any, any>(this, deltaOptions, { skip });

        let forceNodeDataRefresh = false;
        let seriesStatus: SeriesChangeType = 'no-op';
        if (deltaOptions.series?.length) {
            seriesStatus = this.applySeries(this, deltaOptions.series, oldOpts?.series);
            forceNodeDataRefresh = true;
        }
        if (seriesStatus === 'replaced') {
            this.resetAnimations();
        }
        if (this.applyAxes(this, completeOptions, oldOpts, seriesStatus)) {
            forceNodeDataRefresh = true;
        }

        if (deltaOptions.data) {
            this.data = deltaOptions.data;
        }
        if (deltaOptions.legend?.listeners && this.modulesManager.isEnabled('legend')) {
            Object.assign((this as any).legend.listeners, deltaOptions.legend.listeners);
        }
        if (deltaOptions.listeners) {
            this.updateAllSeriesListeners();
        }

        this.chartOptions = chartOptions;
        this.processedOptions = completeOptions;
        this.userOptions = mergeDefaults(userOptions, this.userOptions);

        const navigatorModule = this.modulesManager.getModule<any>('navigator');
        const zoomModule = this.modulesManager.getModule<any>('zoom');

        if (!navigatorModule?.enabled && !zoomModule?.enabled) {
            // reset zoom to initial state
            this.ctx.zoomManager.updateZoom('chart');
        }

        const miniChart = navigatorModule?.miniChart;
        const miniChartSeries = completeOptions.navigator?.miniChart?.series ?? completeOptions.series;
        if (miniChart?.enabled === true && miniChartSeries != null) {
            this.applyMiniChartOptions(miniChart, miniChartSeries, completeOptions, oldOpts);
        } else if (miniChart?.enabled === false) {
            miniChart.series = [];
            miniChart.axes = [];
        }

        this.ctx.annotationManager.setAnnotationStyles(chartOptions.annotationThemes);

        forceNodeDataRefresh ||= this.shouldForceNodeDataRefresh(deltaOptions, seriesStatus);
        const majorChange = forceNodeDataRefresh || modulesChanged;
        const updateType = majorChange ? ChartUpdateType.FULL : ChartUpdateType.PERFORM_LAYOUT;
        this.maybeResetAnimations(seriesStatus);

        debug('AgChartV2.applyChartOptions() - update type', ChartUpdateType[updateType], {
            seriesStatus,
            forceNodeDataRefresh,
        });
        this.update(updateType, { forceNodeDataRefresh, newAnimationBatch: true });
    }

    private maybeResetAnimations(seriesStatus: SeriesChangeType) {
        if (this.mode !== 'standalone') return;

        switch (seriesStatus) {
            case 'series-grouping-change':
            case 'replaced':
                this.resetAnimations();
                break;

            default:
            // Don't reset to initial load in other cases.
        }
    }

    private shouldForceNodeDataRefresh(deltaOptions: AgChartOptions, seriesStatus: SeriesChangeType) {
        const seriesDataUpdate = !!deltaOptions.data || seriesStatus === 'data-change' || seriesStatus === 'replaced';
        const legendKeys = legendRegistry.getKeys();
        const optionsHaveLegend = Object.values(legendKeys).some(
            (legendKey) => (deltaOptions as any)[legendKey] != null
        );
        const otherRefreshUpdate = deltaOptions.title != null && deltaOptions.subtitle != null;
        return seriesDataUpdate || optionsHaveLegend || otherRefreshUpdate;
    }

    private applyMiniChartOptions(
        miniChart: any,
        miniChartSeries: NonNullable<AgChartOptions['series']>,
        completeOptions: AgChartOptions,
        oldOpts: AgChartOptions & { type?: SeriesOptionsTypes['type'] }
    ) {
        const oldSeries = oldOpts?.navigator?.miniChart?.series ?? oldOpts?.series;
        const miniChartSeriesStatus = this.applySeries(
            miniChart,
            this.filterMiniChartSeries(miniChartSeries),
            this.filterMiniChartSeries(oldSeries)
        );
        this.applyAxes(miniChart, completeOptions, oldOpts, miniChartSeriesStatus, [
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
            const miniChartOpts = completeOptions.navigator?.miniChart;
            const labelOptions = miniChartOpts?.label;
            const intervalOptions = miniChartOpts?.label?.interval;

            horizontalAxis.line.enabled = false;

            horizontalAxis.label.set(
                without(labelOptions, ['interval', 'rotation', 'minSpacing', 'autoRotate', 'autoRotateAngle'])
            );
            horizontalAxis.tick.set(
                without(intervalOptions, ['enabled', 'width', 'size', 'color', 'interval', 'step'])
            );

            const step = intervalOptions?.step;
            if (step != null) {
                horizontalAxis.tick.interval = step;
            }
        }
    }

    private applyModules(options: AgChartOptions) {
        const { type: chartType } = this.constructor as any;

        let modulesChanged = false;
        for (const module of moduleRegistry.byType<RootModule | LegendModule>('root', 'legend')) {
            const isConfigured = options[module.optionsKey as keyof AgChartOptions] != null;
            const shouldBeEnabled = isConfigured && module.chartTypes.includes(chartType);

            if (shouldBeEnabled === this.modulesManager.isEnabled(module)) continue;

            if (shouldBeEnabled) {
                this.modulesManager.addModule(module, (m) => new m.instanceConstructor(this.getModuleContext()));

                if (module.type === 'legend') {
                    this.modulesManager.getModule<ChartLegend>(module)?.attachLegend(this.ctx.scene);
                }

                (this as any)[module.optionsKey] = this.modulesManager.getModule(module); // TODO remove
            } else {
                this.modulesManager.removeModule(module);
                delete (this as any)[module.optionsKey]; // TODO remove
            }

            modulesChanged = true;
        }

        return modulesChanged;
    }

    private applySeries(
        chart: { series: Series<any, any>[] },
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
            chart.series = optSeries.map((opts) => this.createSeries(opts));
            return 'replaced';
        }

        debug(`AgChartV2.applySeries() - matchResult`, matchResult);

        const seriesInstances = [];
        let dataChanged = false;
        let groupingChanged = false;
        let isUpdated = false;

        for (const change of matchResult.changes) {
            groupingChanged ||= change.status === 'series-grouping';
            dataChanged ||= change.diff?.data != null;
            isUpdated ||= change.status !== 'no-op';

            switch (change.status) {
                case 'add':
                    const newSeries = this.createSeries(change.opts);
                    seriesInstances.push(newSeries);
                    debug(`AgChartV2.applySeries() - created new series`, newSeries);
                    break;

                case 'remove':
                    debug(`AgChartV2.applySeries() - removing series at previous idx ${change.idx}`, change.series);
                    break;

                case 'no-op':
                    seriesInstances.push(change.series);
                    debug(`AgChartV2.applySeries() - no change to series at previous idx ${change.idx}`, change.series);
                    break;

                case 'series-grouping':
                case 'update':
                default:
                    const { series, diff, idx } = change;
                    debug(`AgChartV2.applySeries() - applying series diff previous idx ${idx}`, diff, series);
                    this.applySeriesValues(series, diff);
                    series.markNodeDataDirty();
                    seriesInstances.push(series);
            }
        }
        // Ensure declaration order is set, this is used for correct z-index behavior for combo charts.
        for (let idx = 0; idx < seriesInstances.length; idx++) {
            seriesInstances[idx]._declarationOrder = idx;
        }

        debug(`AgChartV2.applySeries() - final series instances`, seriesInstances);
        chart.series = seriesInstances;

        if (groupingChanged) {
            return 'series-grouping-change';
        }
        if (dataChanged) {
            return 'data-change';
        }
        return isUpdated ? 'updated' : 'no-op';
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
                jsonApply(axis, axisDiff, { ...JSON_APPLY_PLUGINS, path, skip });
            });
            return true;
        }

        debug(`AgChartV2.applyAxes() - creating new axes instances; seriesStatus: ${seriesStatus}`);
        chart.axes = this.createAxis(axes, skip);
        return true;
    }

    private createSeries(seriesOptions: SeriesOptionsTypes): Series<any, any> {
        const seriesInstance = seriesRegistry.create(seriesOptions.type!, this.getModuleContext()) as Series<any, any>;
        this.applySeriesOptionModules(seriesInstance, seriesOptions);
        this.applySeriesValues(seriesInstance, seriesOptions);
        return seriesInstance;
    }

    private applySeriesOptionModules(series: Series<any, any>, options: SeriesOptionsTypes) {
        const moduleContext = series.createModuleContext();
        const moduleMap = series.getModuleMap();

        for (const module of moduleRegistry.byType<SeriesOptionModule>('series-option')) {
            if (module.optionsKey in options && module.seriesTypes.includes(series.type)) {
                moduleMap.addModule(module, (m) => new m.instanceConstructor(moduleContext));
            }
        }
    }

    private applySeriesValues(target: Series<any, any>, options: SeriesOptionsTypes) {
        const moduleMap = target.getModuleMap();
        const { type: _, data, listeners, seriesGrouping, showInMiniChart: __, ...seriesOptions } = options as any;

        for (const moduleDef of EXPECTED_ENTERPRISE_MODULES) {
            if (moduleDef.type !== 'series-option') continue;
            if (moduleDef.optionsKey in seriesOptions) {
                const module = moduleMap.getModule<any>(moduleDef.optionsKey);
                const moduleOptions = seriesOptions[moduleDef.optionsKey];
                delete seriesOptions[moduleDef.optionsKey];
                module.properties.set(moduleOptions);
            }
        }

        target.properties.set(seriesOptions);

        if ('data' in options) {
            target.setOptionsData(data);
        }

        if (listeners) {
            this.registerListeners(target, listeners as Record<string, TypedEventListener>);
        }

        if ('seriesGrouping' in options) {
            if (seriesGrouping == null) {
                target.seriesGrouping = undefined;
            } else {
                target.seriesGrouping = { ...target.seriesGrouping, ...(seriesGrouping as SeriesGrouping) };
            }
        }
    }

    private createAxis(options: AgBaseAxisOptions[], skip: string[]): ChartAxis[] {
        const guesser: AxisPositionGuesser = new AxisPositionGuesser();
        const moduleContext = this.getModuleContext();

        for (let index = 0; index < options.length; index++) {
            const axisOptions = options[index];
            const axis = axisRegistry.create(axisOptions.type, moduleContext);
            this.applyAxisModules(axis, axisOptions);
            jsonApply(axis, axisOptions, { ...JSON_APPLY_PLUGINS, path: `axes[${index}]`, skip });

            guesser.push(axis, axisOptions);
        }

        return guesser.guessInvalidPositions();
    }

    private applyAxisModules(axis: ChartAxis, options: AgBaseAxisOptions) {
        const moduleContext = axis.createModuleContext();
        const moduleMap = axis.getModuleMap();

        for (const module of moduleRegistry.byType<AxisOptionModule>('axis-option')) {
            const shouldBeEnabled = (options as any)[module.optionsKey] != null;

            if (shouldBeEnabled === moduleMap.isEnabled(module)) continue;

            if (shouldBeEnabled) {
                moduleMap.addModule(module, (m) => new m.instanceConstructor(moduleContext));
                (axis as any)[module.optionsKey] = moduleMap.getModule(module); // TODO remove
            } else {
                moduleMap.removeModule(module);
                delete (axis as any)[module.optionsKey]; // TODO remove
            }
        }
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
