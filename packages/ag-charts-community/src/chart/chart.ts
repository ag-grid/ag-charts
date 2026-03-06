import {
    ActionOnSet,
    AgDocument,
    AsyncAwaitQueue,
    type AxisID,
    type ChartAnimationPhase,
    ChartAxisDirection,
    ChartUpdateType,
    CleanupRegistry,
    Color,
    Debug,
    Logger,
    type ModuleInstance,
    ModuleRegistry,
    ModuleType,
    Padding,
    Property,
    ProxyProperty,
    ZIndexMap,
    callWithContext,
    createId,
    enterpriseRegistry,
    entries,
    getWindow,
    isFiniteNumber,
    isInputPending,
    jsonApply,
    jsonDiff,
    mergeDefaults,
    pause,
    roundTo,
    toPlainText,
    without,
} from 'ag-charts-core';
import type {
    AgBaseAxisOptions,
    AgChartInstance,
    AgChartOptions,
    AgColorType,
    AgDataTransaction,
    AgInitialFocus,
    AgInitialStateLegendOptions,
    AgLocaleOptions,
    AgMiniChartSeriesOptions,
    FormatterConfiguration,
    SeriesOptionsTypes,
    SeriesType,
    TextOrSegments,
} from 'ag-charts-types';

import type { ModuleContext } from '../module/moduleContext';
import type { ChartOptions } from '../module/optionsModule';
import { BBox } from '../scene/bbox';
import { Group, TranslatableGroup } from '../scene/group';
import type { Scene } from '../scene/scene';
import { DebugSelectors } from '../scene/sceneDebug';
import { Mutex } from '../util/mutex';
import type { TypedEvent, TypedEventListener } from '../util/observable';
import { Observable } from '../util/observable';
import { debouncedCallback } from '../util/render';
import type { GroupedCategoryAxis } from './axis/groupedCategoryAxis';
import type { TimeAxis } from './axis/timeAxis';
import { Background } from './background/background';
import { Caption } from './caption';
import { ChartAxes } from './chartAxes';
import type { ChartAxis } from './chartAxis';
import { ChartCaptions } from './chartCaptions';
import { ChartContext } from './chartContext';
import { ChartHighlight } from './chartHighlight';
import type { ChartMode } from './chartMode';
import type { ChartService } from './chartService';
import { type CachedData } from './data/caching';
import { DataController } from './data/dataController';
import { DataSet } from './data/dataSet';
import type { ChartType } from './factory/expectedModules';
import { SyncManager, type SyncStatus } from './interaction/syncManager';
import { Keyboard } from './keyboard';
import { type LayoutContext, LayoutElement } from './layout/layoutManager';
import type { ChartLegend } from './legend/legendDatum';
import { guessInvalidPositions } from './mapping/prepareAxis';
import { matchSeriesOptions } from './mapping/prepareSeries';
import { isAgCartesianChartOptions } from './mapping/types';
import { ModulesManager } from './modulesManager';
import { ChartOverlays } from './overlay/chartOverlays';
import { getLoadingSpinner } from './overlay/loadingSpinner';
import { SeriesArea } from './series-area/seriesArea';
import { Series, SeriesGroupingChangedEvent, SeriesNodeEvent, type UnknownSeries } from './series/series';
import { type SeriesAreaChartDependencies, SeriesAreaManager } from './series/seriesAreaManager';
import { SeriesLayerManager } from './series/seriesLayerManager';
import type { SeriesGrouping } from './series/seriesStateManager';
import type { DatumIndexType, ISeries } from './series/seriesTypes';
import { Tooltip, type TooltipContent } from './tooltip/tooltip';
import { Touch } from './touch';
import { DataWindowProcessor } from './update/dataWindowProcessor';
import { OverlaysProcessor } from './update/overlaysProcessor';
import type { UpdateProcessor } from './update/processor';
import type { UpdateOpts } from './updateService';

const debug = Debug.create(true, 'opts');

export type TransferableResources = {
    container?: HTMLElement;
    styleContainer?: HTMLElement;
    scene: Scene;
};

type SeriesChangeType =
    | 'no-op'
    | 'no-change'
    | 'replaced'
    | 'data-change'
    | 'series-grouping-change'
    | 'series-count-changed'
    | 'updated';

export abstract class Chart extends Observable implements ModuleInstance, ChartService {
    static readonly className: string = 'Chart';
    private static readonly chartsInstances = new WeakMap<HTMLElement, Chart>();

    static getInstance(element: HTMLElement): Chart | undefined {
        return Chart.chartsInstances.get(element);
    }

    readonly id = createId(this);

    className?: string;

    readonly seriesRoot = new TranslatableGroup({
        name: `${this.id}-series-root`,
        zIndex: ZIndexMap.SERIES_LAYER,
    });
    readonly annotationRoot = new TranslatableGroup({
        name: `${this.id}-annotation-root`,
        zIndex: ZIndexMap.SERIES_ANNOTATION,
    });
    // Titles change infrequently, so cache them as an offscreen bitmap to avoid
    // ctx.font assignments on the main canvas (each assignment triggers a browser
    // "recalculate style" for CSS font resolution).
    private readonly titleGroup = new Group({
        name: 'titles',
        zIndex: ZIndexMap.SERIES_LABEL,
        renderToOffscreenCanvas: true,
        optimizeForInfrequentRedraws: true,
    });

    readonly tooltip: Tooltip;
    readonly overlays: ChartOverlays;
    readonly highlight: ChartHighlight;
    readonly background: Background<any>;
    readonly seriesArea: SeriesArea;
    foreground?: Background<any>;

    protected readonly debug = Debug.create(true, 'chart');

    private extraDebugStats: Record<string, number> = {};

    @ActionOnSet<Chart>({
        newValue(value: HTMLElement) {
            if (this.destroyed) return;

            this.ctx.domManager.setContainer(value);
            Chart.chartsInstances.set(value, this);
        },
        oldValue(value: HTMLElement) {
            Chart.chartsInstances.delete(value);
        },
    })
    container?: HTMLElement;

    public data: DataSet = DataSet.empty();

    @ActionOnSet<Chart>({
        newValue(value) {
            this.resize('width option', { inWidth: value });
        },
    })
    width?: number;

    @ActionOnSet<Chart>({
        newValue(value) {
            this.resize('height option', { inHeight: value });
        },
    })
    height?: number;

    @ActionOnSet<Chart>({
        newValue(value) {
            this.resize('minWidth option', { inMinWidth: value });
        },
    })
    minWidth?: number;

    @ActionOnSet<Chart>({
        newValue(value) {
            this.resize('minHeight option', { inMinHeight: value });
        },
    })
    minHeight?: number;

    @ActionOnSet<Chart>({
        newValue(value) {
            this.resize('overrideDevicePixelRatio option', { inOverrideDevicePixelRatio: value });
        },
    })
    overrideDevicePixelRatio?: number;

    /** NOTE: This is exposed for use by Integrated charts only. */
    get canvasElement() {
        return this.ctx.scene.canvas.element;
    }

    private _lastAutoSize?: [number, number, number];
    private _firstAutoSize = true;
    private readonly _autoSizeNotify = new AsyncAwaitQueue();

    private _requiredRange = 0;
    private _requiredRangeDirection = ChartAxisDirection.X;

    download(fileName?: string, fileFormat?: string) {
        this.ctx.scene.download(fileName, fileFormat);
    }
    getCanvasDataURL(fileFormat?: string) {
        return this.ctx.scene.getDataURL(fileFormat);
    }

    toSVG() {
        return this.ctx.scene.toSVG();
    }
    private readonly chartCaptions = new ChartCaptions();

    @Property
    readonly padding = new Padding(20);

    get seriesAreaBoundingBox() {
        return this.seriesAreaManager.bbox;
    }

    @Property
    readonly keyboard = new Keyboard();

    @Property
    readonly touch = new Touch();

    @Property
    mode: ChartMode = 'standalone';

    // undocumented property for studio
    @Property
    withinStudio: boolean | undefined = undefined;

    @Property
    styleNonce: string | undefined = undefined;

    @ProxyProperty('chartCaptions.title')
    readonly title!: Caption;

    @ProxyProperty('chartCaptions.subtitle')
    readonly subtitle!: Caption;

    @ProxyProperty('chartCaptions.footnote')
    readonly footnote!: Caption;

    @Property
    formatter: FormatterConfiguration<any> | undefined = undefined;

    @Property
    suppressFieldDotNotation: boolean = false;

    @Property
    loadGoogleFonts: boolean = false;

    @Property
    dataIdKey: string | undefined = undefined;

    context?: unknown;

    public destroyed = false;

    private readonly cleanup = new CleanupRegistry();

    chartAnimationPhase: ChartAnimationPhase = 'initial';

    public readonly modulesManager = new ModulesManager();
    public readonly ctx: ChartContext;
    protected readonly seriesLayerManager: SeriesLayerManager;
    protected readonly seriesAreaManager: SeriesAreaManager;

    private readonly processors: UpdateProcessor[] = [];

    queuedUserOptions: AgChartOptions[] = [];
    queuedChartOptions: ChartOptions[] = [];
    chartOptions: ChartOptions;
    private firstApply = true;

    /**
     * Public API for this Chart instance. NOTE: This is initialized after construction by the
     * wrapping class that implements AgChartInstance.
     */
    publicApi?: AgChartInstance;

    syncStatus: SyncStatus = 'init';

    getOptions() {
        return this.queuedUserOptions.at(-1) ?? this.chartOptions.userOptions;
    }

    getChartOptions() {
        return this.queuedChartOptions.at(-1) ?? this.chartOptions;
    }

    isDataTransactionSupported() {
        return true;
    }

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super();

        this.chartOptions = options;

        const scene: Scene | undefined = resources?.scene;
        const container = resources?.container ?? options.processedOptions.container ?? undefined;
        const styleContainer = resources?.styleContainer ?? options.specialOverrides.styleContainer;
        const skipCss = options.specialOverrides.skipCss;
        if (scene) {
            this._firstAutoSize = false;
            this._lastAutoSize = [scene.width, scene.height, scene.pixelRatio];
        }

        const root = new Group({ name: 'root' });
        // Prevent the scene from rendering chart components in an invalid state
        // (before first layout is performed).
        root.visible = false;
        root.append(this.seriesRoot);
        root.append(this.annotationRoot);
        root.append(this.titleGroup);

        this.titleGroup.append(this.title.node);
        this.titleGroup.append(this.subtitle.node);
        this.titleGroup.append(this.footnote.node);

        const agDocument = new AgDocument(options.specialOverrides.document, options.specialOverrides.window);

        this.tooltip = new Tooltip(agDocument);
        this.seriesLayerManager = new SeriesLayerManager(this.seriesRoot);
        this.mode = (options.userOptions as { mode?: ChartMode }).mode ?? this.mode;
        this.styleNonce = options.processedOptions.styleNonce;
        const ctx = (this.ctx = new ChartContext(this, {
            chartType: this.getChartType(),
            scene,
            root,
            container,
            styleContainer,
            skipCss,
            agDocument,
            domMode: options.optionMetadata.domMode,
            withDragInterpretation: options.optionMetadata.withDragInterpretation ?? true,
            syncManager: new SyncManager(this),
            fireEvent: (event) => this.fireEvent(event),
            updateMutex: this.updateMutex,
        }));

        // Disable delayed unhighlight + tooltip removal for sparklines to avoid laggy tooltips when quickly
        // moving between charts (CRT-1012)
        if (options.optionMetadata.presetType === 'sparkline') {
            ctx.highlightManager.unhighlightDelay = 0;
            ctx.tooltipManager.removeDelay = 0;
        }

        this.cleanup.register(
            ctx.eventsHub.on('dom:resize', () => this.parentResize(ctx.domManager.containerSize)),
            ctx.eventsHub.on('font:load', () => {
                this.title.node.markDirty();
                this.subtitle.node.markDirty();
                this.footnote.node.markDirty();
                this.update(ChartUpdateType.PERFORM_LAYOUT);
            }),
            ctx.eventsHub.on('rtl:change', () => {
                ctx.scene.canvas.setDirection(ctx.domManager.isRtl);
                this.update(ChartUpdateType.PERFORM_LAYOUT);
            }),
            ctx.eventsHub.on('chart:request-update', (e) => this.update(e.type, e.opts)),
            ctx.scene.on('scene-changed', () => this.update(ChartUpdateType.SCENE_RENDER))
        );
        ctx.scene.canvas.setDirection(ctx.domManager.isRtl);

        this.overlays = new ChartOverlays();
        this.overlays.loading.renderer ??= () =>
            getLoadingSpinner(
                ctx.agDocument,
                this.overlays.loading.getText(ctx.localeManager),
                ctx.animationManager.defaultDuration
            );

        this.processors = [
            new DataWindowProcessor(
                this,
                ctx.eventsHub,
                ctx.dataService,
                ctx.updateService,
                ctx.zoomManager,
                ctx.animationManager
            ),
            new OverlaysProcessor(
                this,
                this.overlays,
                ctx.eventsHub,
                ctx.dataService,
                ctx.localeManager,
                ctx.animationManager,
                ctx.domManager
            ),
        ];

        this.highlight = new ChartHighlight();
        this.container = container;

        const moduleContext = this.getModuleContext();
        this.background = enterpriseRegistry.createBackground?.(moduleContext) ?? new Background(moduleContext);
        this.foreground = enterpriseRegistry.createForeground?.(moduleContext);
        this.seriesArea = new SeriesArea(moduleContext);

        // The 'data-animating' is used by e2e tests to wait for the animation to end before starting kbm interactions
        ctx.domManager.setDataBoolean('animating', false);
        // The 'data-animation-time-ms' tracks cumulative animation time for e2e tests
        ctx.domManager.setDataNumber('animationTimeMs', 0);

        this.seriesAreaManager = new SeriesAreaManager(this.initSeriesAreaDependencies(options));
        this.cleanup.register(
            ctx.layoutManager.registerElement(LayoutElement.Caption, (e) => {
                e.layoutBox.shrink(this.padding.toJson());
                this.chartCaptions.positionCaptions(e);
            }),
            ctx.eventsHub.on('layout:complete', (e) => this.chartCaptions.positionAbsoluteCaptions(e)),

            ctx.eventsHub.on('data:load', (event) => {
                this.data = new DataSet(event.data, this.dataIdKey);
            }),

            this.title.registerInteraction(moduleContext, 'beforebegin'),
            this.subtitle.registerInteraction(moduleContext, 'beforebegin'),
            this.footnote.registerInteraction(moduleContext, 'afterend'),
            () => this.title.destroy(),
            () => this.subtitle.destroy(),
            () => this.footnote.destroy(),

            this.ctx.agDocument.attachListener('pagehide', (event: PageTransitionEvent) => {
                // Don't fire if persisted since the page may be revisited.
                if (!event.persisted) {
                    this.destroy();
                }
            }),

            ctx.animationManager.addListener('animation-frame', () => {
                this.update(ChartUpdateType.SCENE_RENDER);
                ctx.domManager.setDataNumber('animationTimeMs', ctx.animationManager.getCumulativeAnimationTime());
            }),
            ctx.animationManager.addListener('animation-start', () => ctx.domManager.setDataBoolean('animating', true)),
            ctx.animationManager.addListener('animation-stop', () => {
                ctx.domManager.setDataBoolean('animating', false);
                ctx.domManager.setDataNumber('animationTimeMs', ctx.animationManager.getCumulativeAnimationTime());
            }),
            ctx.eventsHub.on('zoom:change-complete', () => {
                const initialPhase = this.chartAnimationPhase === 'initial';
                for (const s of this.series) {
                    (s as any).animationState?.transition('updateData');
                }
                if (initialPhase) {
                    for (const axis of this.axes) {
                        axis.resetAnimation(this.chartAnimationPhase);
                    }
                }
                this.update(ChartUpdateType.PERFORM_LAYOUT, {
                    forceNodeDataRefresh: true,
                    skipAnimations: !initialPhase,
                });
            })
        );

        this.parentResize(ctx.domManager.containerSize);
    }

    overrideFocusVisible(visible: boolean | undefined): void {
        this.seriesAreaManager.focusIndicator?.overrideFocusVisible(visible);
    }

    // Use a wrapper to comply with the @typescript-eslint/unbound-method rule.
    private readonly fireEventWrapper = (event: TypedEvent): void => super.fireEvent(event);
    protected override fireEvent<TEvent extends TypedEvent>(event: TEvent): void {
        callWithContext(this, this.fireEventWrapper, event);
    }

    private initSeriesAreaDependencies(options: ChartOptions): SeriesAreaChartDependencies {
        const { ctx, tooltip, highlight, keyboard, overlays, seriesRoot, mode } = this;
        const chartType = this.getChartType();
        const fireEvent = this.fireEvent.bind(this);
        const getUpdateType = () => this.performUpdateType;
        const getTooltipContent = <DatumIndex extends DatumIndexType>(
            series: ISeries<DatumIndex, unknown, unknown>,
            datumIndex: DatumIndex,
            removeThisDatum: unknown,
            purpose: 'aria-label' | 'tooltip'
        ) => this.getTooltipContent(series, datumIndex, removeThisDatum, purpose);

        // Chart & SeriesAreaManager initialization happens options processing:
        const initialFocus: AgInitialFocus | undefined =
            options.userOptions.keyboard?.initialFocus ??
            (typeof options.userOptions.theme !== 'object'
                ? undefined
                : options.userOptions.theme.overrides?.common?.keyboard?.initialFocus);
        if (initialFocus !== undefined) {
            keyboard.initialFocus = initialFocus;
        }

        return {
            fireEvent,
            getUpdateType,
            getTooltipContent,
            chartType,
            ctx,
            tooltip,
            highlight,
            keyboard,
            overlays,
            seriesRoot,
            mode,
        };
    }

    getModuleContext(): ModuleContext {
        return this.ctx;
    }

    abstract getChartType(): ChartType;

    public getTooltipContent(
        series: ISeries<DatumIndexType, any, any>,
        datumIndex: DatumIndexType,
        removeMeDatum: unknown,
        purpose: 'aria-label' | 'tooltip'
    ): TooltipContent[] {
        const useTooltip = purpose === 'aria-label' || series.properties.tooltip.enabled !== false;
        const baseTooltipContent = useTooltip ? series.getTooltipContent(datumIndex, removeMeDatum) : undefined;
        const tooltipContent = baseTooltipContent == null ? [] : [baseTooltipContent];
        if (this.tooltip.mode !== 'shared' || this.series.length === 1) {
            return tooltipContent;
        }

        const categoryValue = series.getCategoryValue(datumIndex);
        if (categoryValue == null) return tooltipContent;

        return this.series.flatMap<TooltipContent>((s) => {
            if (s === series) return tooltipContent;
            if (!s.isEnabled() || s.properties.tooltip.enabled === false) return [];
            const seriesDatumIndex = s.datumIndexForCategoryValue(categoryValue);
            const seriesTooltipContent =
                seriesDatumIndex == null ? undefined : s.getTooltipContent(seriesDatumIndex, undefined);
            if (seriesTooltipContent == null) return [];
            return [seriesTooltipContent];
        });
    }

    protected getCaptionText(): string {
        return [this.title, this.subtitle, this.footnote]
            .filter((caption) => caption.enabled && caption.text)
            .map((caption) => caption.text)
            .join('. ');
    }

    protected getAriaLabel(): string {
        return this.ctx.localeManager.t('ariaAnnounceChart', { seriesCount: this.series.length });
    }

    private refreshSeriesUserVisibility(
        outdatedOptions: ChartOptions,
        seriesWithUserVisibility: NonNullable<ChartOptions['seriesWithUserVisibility']>
    ): void {
        // AG-16360 The preferred mechanism to update the series visibility is to use the `chart.setState` API. However,
        // the `series[].visible` property pre-dates the `initialState`, `getState`, `setState' APIs. As a consequence,
        // the `series[].visible` property is an unusual state where it is treated like both the "initial" state and the
        // "new / updated" state; sometimes `updateDelta()` updates the series visibility, and sometimes it doesn't. To
        // address this discrepancy, we'll update processedOptions to match the current visibility state of the series.
        for (let i = 0; i < this.series.length; i++) {
            type TSrc = { visible: boolean; id: string };
            type TDst = { visible: boolean } | object | undefined;
            const src: TSrc = this.series[i];
            const dst: TDst = outdatedOptions.processedOptions.series?.[i];
            if (seriesWithUserVisibility.identifiers.has(src.id) || seriesWithUserVisibility.indices.has(i)) {
                if (dst !== undefined && 'visible' in dst) {
                    dst.visible = src.visible;
                }
            }
        }
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

    detachAndClear() {
        this.container = undefined;
        this.ctx.scene.clearCanvas();
    }

    destroy(opts?: { keepTransferableResources: boolean }): TransferableResources | undefined {
        if (this.destroyed) return;

        const keepTransferableResources = opts?.keepTransferableResources;
        let result: TransferableResources | undefined;

        this.performUpdateType = ChartUpdateType.NONE;

        this.cleanup.flush();
        for (const p of this.processors) {
            p.destroy();
        }
        this.overlays.destroy();
        this.modulesManager.destroy();
        this.background.destroy();
        this.foreground?.destroy();
        this.seriesArea.destroy();

        if (keepTransferableResources) {
            this.ctx.scene.strip();
            // The wrapper object is going to get destroyed. So to be safe, copy its properties.
            result = {
                container: this.container,
                scene: this.ctx.scene,
            };
        } else {
            this.ctx.scene.destroy();
            this.container = undefined;
        }

        this.destroySeries(this.series);
        this.seriesLayerManager.destroy();

        this.axes.destroy();

        // Reset animation state.
        this.animationRect = undefined;

        this.ctx.destroy();
        this.destroyed = true;

        Object.freeze(this);

        return result;
    }

    requestFactoryUpdate(cb: (chart: Chart) => Promise<void> | void) {
        if (this.destroyed) return;
        this._pendingFactoryUpdatesCount++;
        this.updateMutex
            .acquire(async () => {
                if (this.destroyed) return;
                try {
                    await cb(this);
                } finally {
                    if (!this.destroyed) {
                        this._pendingFactoryUpdatesCount--;
                    }
                }
            })
            .catch((e) => Logger.errorOnce(e));
    }

    private clearCallbackCache() {
        this.ctx.callbackCache.invalidateCache();
        for (const series of this.series) {
            series.resetDatumCallbackCache();
        }
    }

    private apiUpdate = false;
    private pendingLocaleText?: AgLocaleOptions['localeText'];
    private _pendingFactoryUpdatesCount = 0;
    private _performUpdateSkipAnimations: boolean = false;
    private readonly _performUpdateNotify = new AsyncAwaitQueue();
    private performUpdateType: ChartUpdateType = ChartUpdateType.NONE;
    private runningUpdateType: ChartUpdateType = ChartUpdateType.NONE;
    private currentProcessingUpdateType: ChartUpdateType = ChartUpdateType.NONE;
    private updateShortcutCount = 0;
    private readonly seriesToUpdate: Set<ISeries<any, any, any>> = new Set();
    private readonly updateMutex = new Mutex();
    private clearCallbackCacheOnUpdate: boolean = false;
    private updateRequestors: Record<string, ChartUpdateType> = {};

    private readonly performUpdateTrigger = debouncedCallback(({ count }) => {
        if (this.destroyed) return;
        this.updateMutex.acquire(this.tryPerformUpdate.bind(this, count)).catch((e) => Logger.errorOnce(e));
    });
    public update(type = ChartUpdateType.FULL, opts?: UpdateOpts) {
        if (this.destroyed) return;

        const {
            forceNodeDataRefresh = false,
            skipAnimations,
            seriesToUpdate = this.series,
            newAnimationBatch,
            apiUpdate = false,
            clearCallbackCache = false,
        } = opts ?? {};

        this.apiUpdate = apiUpdate;
        this.ctx.widgets.seriesWidget.setDragTouchEnabled(this.touch.dragAction !== 'none');

        if (forceNodeDataRefresh) {
            for (const series of this.series) {
                series.markNodeDataDirty();
            }
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

        if (type === ChartUpdateType.FULL || clearCallbackCache) {
            this.clearCallbackCacheOnUpdate = true;
        }

        if (this.debug.check()) {
            let stack = new Error('Stack trace for update tracking').stack ?? '<unknown>';
            stack = stack.replaceAll(/\([^)]*/g, '');
            this.updateRequestors[stack] = type;

            if (this.currentProcessingUpdateType !== ChartUpdateType.NONE && this.currentProcessingUpdateType >= type) {
                this.debug.group(
                    `Chart.update() - ⚠️ received update for earlier update stage ${ChartUpdateType[type]} ⚠️`,
                    () => {
                        this.debug(
                            `Current processing update type: ${ChartUpdateType[this.currentProcessingUpdateType]}`
                        );
                        this.debug('Update from: ', stack);
                    }
                );
            }
        }

        if (type < this.performUpdateType) {
            this.performUpdateType = type;
            this.ctx.domManager.setDataBoolean('updatePending', true);
            this.performUpdateTrigger.schedule(opts?.backOffMs);
        }
    }

    private readonly _performUpdateSplits: Record<string, number> = {};
    private _previousSplit: number = 0;

    private updateSplits(splitName: string) {
        const splits = this._performUpdateSplits;
        splits[splitName] ??= 0;
        splits[splitName] += performance.now() - this._previousSplit;
        this._previousSplit = performance.now();
    }

    private async tryPerformUpdate(count: number) {
        try {
            const status = `${ChartUpdateType[this.performUpdateType]} ${this.updateShortcutCount > 0 ? '⚠️ redo #' + this.updateShortcutCount + ' ⚠️ ' : ''}`;
            await this.debug.group(`Chart.performUpdate() ${status}`, async () => {
                await this.performUpdate(count);
            });
        } catch (error: any) {
            Logger.error('update error', error, error.stack);
        }
    }

    private async performUpdate(count: number) {
        const { performUpdateType, extraDebugStats, _performUpdateSplits: splits, ctx } = this;
        const seriesToUpdate = [...this.seriesToUpdate];

        if (this.clearCallbackCacheOnUpdate) {
            this.clearCallbackCacheOnUpdate = false;

            // AG-10112 Callbacks (i.e. formatters / stylers / renderers) must always be considered "outdated" at the start
            // of a draw call, because it is impossible for us to determine whether the return values have changed. The
            // cache will only be used if nothing is being redrawn (e.g. moving the cursor within a bar of bar-series, which
            // doesn't change the current highlight).
            this.clearCallbackCache();
        }

        // Clear state immediately so that side effects can be detected prior to SCENE_RENDER.
        this.performUpdateType = ChartUpdateType.NONE;
        this.seriesToUpdate.clear();
        this.runningUpdateType = performUpdateType;
        this.currentProcessingUpdateType = performUpdateType;

        if (this.updateShortcutCount === 0 && performUpdateType < ChartUpdateType.SCENE_RENDER) {
            ctx.animationManager.startBatch(this._performUpdateSkipAnimations);
            ctx.animationManager.onBatchStop(() => (this.chartAnimationPhase = 'ready'));
        }

        this.ctx.scene.updateDebugFlags();

        this.debug('Chart.performUpdate() - start', ChartUpdateType[performUpdateType]);
        this._previousSplit = performance.now();
        splits.start ??= this._previousSplit;

        ctx.domManager.setDeferring(true);

        switch (performUpdateType) {
            case ChartUpdateType.FULL:
                if (this.checkUpdateShortcut(ChartUpdateType.FULL)) break;

                this.ctx.updateService.dispatchPreDomUpdate();
                this.updateDOM();
            // fallthrough

            case ChartUpdateType.UPDATE_DATA:
                if (this.checkUpdateShortcut(ChartUpdateType.UPDATE_DATA)) break;

                this.updateData();
                this.updateSplits('⬇️');
            // fallthrough

            case ChartUpdateType.PROCESS_DATA:
                if (this.checkUpdateShortcut(ChartUpdateType.PROCESS_DATA)) break;

                await this.processData();
                this.seriesAreaManager.dataChanged();
                if (this.pendingLocaleText) {
                    type LocaleModule = ModuleInstance & { localeText?: Record<string, string> };
                    const localeModule: LocaleModule | undefined = this.modulesManager.getModule('locale');
                    if (localeModule && 'localeText' in localeModule) {
                        localeModule.localeText = this.pendingLocaleText;
                    }
                    this.pendingLocaleText = undefined;
                }

                this.updateSplits('📊');
            // fallthrough

            case ChartUpdateType.PROCESS_DOMAIN:
                if (this.checkUpdateShortcut(ChartUpdateType.PROCESS_DOMAIN)) break;

                await this.processDomains();
                this.updateSplits('⛰️');
            // fallthrough

            case ChartUpdateType.PROCESS_RANGE:
                if (this.checkUpdateShortcut(ChartUpdateType.PROCESS_RANGE)) break;

                this.processRanges();
                this.updateSplits('📐');
            // fallthrough

            case ChartUpdateType.PERFORM_LAYOUT:
                await this.checkFirstAutoSize();
                if (this.checkUpdateShortcut(ChartUpdateType.PERFORM_LAYOUT)) break;

                await this.processLayout();
                this.updateSplits('⌖');
            // fallthrough

            case ChartUpdateType.PRE_SERIES_UPDATE:
                if (this.checkUpdateShortcut(ChartUpdateType.PRE_SERIES_UPDATE)) break;

                this.preSeriesUpdate();
                this.updateSplits('❓');
            // fallthrough

            case ChartUpdateType.SERIES_UPDATE: {
                if (this.checkUpdateShortcut(ChartUpdateType.SERIES_UPDATE)) break;

                this.seriesRoot.renderToOffscreenCanvas = this.highlight.drawingMode === 'cutout';

                await this.updateSeries(seriesToUpdate);

                this.updateAriaLabels();
                this.seriesLayerManager.updateLayerCompositing();

                this.updateSplits('🤔');
            }
            // fallthrough

            case ChartUpdateType.PRE_SCENE_RENDER:
                if (this.checkUpdateShortcut(ChartUpdateType.PRE_SCENE_RENDER)) break;

                // Allow any additional pre-rendering processing to happen.
                ctx.updateService.dispatchPreSceneRender(this.apiUpdate);

                ctx.scene.updateBaseFont();

                this.updateSplits('↖');
            // fallthrough

            case ChartUpdateType.SCENE_RENDER:
                if (this.checkUpdateShortcut(ChartUpdateType.SCENE_RENDER)) break;

                // Force any initial animation changes to be applied BEFORE any rendering happens.
                ctx.animationManager.endBatch();

                extraDebugStats['updateShortcutCount'] = this.updateShortcutCount;
                ctx.scene.render({
                    debugSplitTimes: splits,
                    extraDebugStats,
                    seriesRect: this.seriesRect,
                    debugColors: Debug.check(DebugSelectors.SCENE_STATS, DebugSelectors.SCENE_STATS_VERBOSE)
                        ? this.getDebugColors()
                        : undefined,
                });
                this.extraDebugStats = {};
                for (const key of Object.keys(splits)) {
                    delete splits[key];
                }

                this.ctx.domManager.incrementDataCounter('sceneRenders');
            // fallthrough

            case ChartUpdateType.NONE:
                // Do nothing.
                this.updateShortcutCount = 0;
                this.updateRequestors = {};
                this.currentProcessingUpdateType = ChartUpdateType.NONE;
                this._performUpdateSkipAnimations = false;
                ctx.animationManager.endBatch();
        }

        if (!this.destroyed) {
            ctx.updateService.dispatchUpdateComplete(this.apiUpdate, this.updateShortcutCount > 0);
            this.apiUpdate = false;
            this.ctx.domManager.setDataBoolean('updatePending', false);
            this.runningUpdateType = ChartUpdateType.NONE;
            this.syncStatus = 'ready';
        }
        this._performUpdateNotify.notify();

        // Also triggers deferred update to avoid DOM changes mid-update.
        ctx.domManager.setDeferring(false);

        const end = performance.now();
        this.debug('Chart.performUpdate() - end', {
            chart: this,
            durationMs: roundTo(end - splits['start']),
            count,
            performUpdateType: ChartUpdateType[performUpdateType],
        });
    }

    private updateThemeClassName() {
        const themeClassNamePrefix = 'ag-charts-theme-';
        const validThemeClassNames = [`${themeClassNamePrefix}default`, `${themeClassNamePrefix}default-dark`];

        let themeClassName = validThemeClassNames[0];
        let isDark = false;

        let { theme } = this.chartOptions.processedOptions;
        while (typeof theme !== 'string' && theme != null) {
            theme = theme.baseTheme;
        }

        if (typeof theme === 'string') {
            themeClassName = theme.replace('ag-', themeClassNamePrefix);
            isDark = theme.includes('-dark');
        }

        if (!validThemeClassNames.includes(themeClassName)) {
            themeClassName = isDark ? validThemeClassNames[1] : validThemeClassNames[0];
        }

        this.ctx.domManager.setThemeClass(themeClassName);
    }

    private updateDOM() {
        this.updateThemeClassName();

        const { enabled, tabIndex } = this.keyboard;
        this.ctx.domManager.setTabGuardIndex(enabled ? tabIndex ?? 0 : -1);
        this.ctx.domManager.setThemeParameters(this.chartOptions.themeParameters);
    }

    private updateAriaLabels() {
        this.ctx.domManager.updateCanvasLabel(this.getAriaLabel());
    }

    private checkUpdateShortcut(checkUpdateType: ChartUpdateType) {
        const maxShortcuts = 3;

        if (this.destroyed) return true;

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
            this.debug(
                'Chart.checkUpdateShortcut() - BLOCKED AT: ',
                ChartUpdateType[checkUpdateType],
                ' BY REQUEST FOR: ',
                ChartUpdateType[this.performUpdateType]
            );

            // A previous step modified series state, and we need to re-run this or an earlier step before rendering.
            this.updateShortcutCount++;
            return true;
        }

        this.debug('Chart.checkUpdateShortcut() - PROCEEDING TO: ', ChartUpdateType[checkUpdateType]);
        this.currentProcessingUpdateType = checkUpdateType;

        return false;
    }

    private async checkFirstAutoSize() {
        if (this.width != null && this.height != null) {
            // Auto-size isn't in use in this case, don't wait for it.
        } else if (!this._lastAutoSize) {
            const success = await this._autoSizeNotify.waitForCompletion(500);

            if (!success) {
                // After several failed passes, continue and accept there maybe a redundant
                // render. Sometimes this case happens when we already have the correct
                // width/height, and we end up never rendering the chart in that scenario.
                this.debug('Chart.checkFirstAutoSize() - timeout for first size update.');
            }
        }
    }

    @ActionOnSet<Chart>({
        changeValue(newValue, oldValue) {
            this.onAxisChange(newValue, oldValue);
        },
    })
    axes: ChartAxes = this.createChartAxes();
    createChartAxes(): ChartAxes {
        return new ChartAxes();
    }

    @ActionOnSet<Chart>({
        changeValue(newValue, oldValue) {
            this.onSeriesChange(newValue, oldValue);
        },
    })
    series: Series<DatumIndexType, any, any, any>[] = [];

    protected onAxisChange(newValue: ChartAxis[], oldValue?: ChartAxis[]) {
        if (oldValue == null && newValue.length === 0) return;

        this.ctx.axisManager.updateAxes(oldValue ?? [], newValue);
    }

    protected onSeriesChange(newValue: UnknownSeries[], oldValue?: UnknownSeries[]) {
        const seriesToDestroy = oldValue?.filter((series) => !newValue.includes(series)) ?? [];
        this.destroySeries(seriesToDestroy);
        this.seriesLayerManager?.setSeriesCount(newValue.length);

        for (const series of newValue) {
            if (oldValue?.includes(series)) continue;

            const seriesContentNode = this.seriesLayerManager.requestGroup(series);
            series.attachSeries(seriesContentNode, this.seriesRoot, this.annotationRoot);

            series.chart = {} as any;
            Object.defineProperty(series.chart, 'mode', {
                get: () => this.mode,
            });
            Object.defineProperty(series.chart, 'isMiniChart', {
                get: () => false,
            });
            Object.defineProperty(series.chart, 'flashOnUpdateEnabled', {
                get: () => !!this.modulesManager.getModule('flashOnUpdate')?.enabled,
            });
            Object.defineProperty(series.chart, 'seriesRect', {
                get: () => this.seriesRect,
            });

            series.resetAnimation(this.chartAnimationPhase);
            this.addSeriesListeners(series);
        }

        this.seriesAreaManager?.seriesChanged(newValue);
    }

    protected destroySeries(allSeries: UnknownSeries[]): void {
        if (allSeries) {
            for (const series of allSeries) {
                series.removeEventListener('seriesNodeClick', this.onSeriesNodeClick);
                series.removeEventListener('seriesNodeDoubleClick', this.onSeriesNodeDoubleClick);
                series.removeEventListener('groupingChanged', this.seriesGroupingChanged);
                series.destroy();
                this.seriesLayerManager.releaseGroup(series);
                series.detachSeries(undefined, this.seriesRoot, this.annotationRoot);

                series.chart = undefined;
            }
        }
    }

    private addSeriesListeners(series: UnknownSeries) {
        if (this.hasEventListener('seriesNodeClick')) {
            series.addEventListener('seriesNodeClick', this.onSeriesNodeClick);
        }

        if (this.hasEventListener('seriesNodeDoubleClick')) {
            series.addEventListener('seriesNodeDoubleClick', this.onSeriesNodeDoubleClick);
        }

        if (this.hasEventListener('seriesVisibilityChange')) {
            series.addEventListener('seriesVisibilityChange', this.onSeriesVisibilityChange);
        }

        series.addEventListener('groupingChanged', this.seriesGroupingChanged);
    }

    protected assignSeriesToAxes() {
        for (const axis of this.axes) {
            function seriesPredicateFn(s: Series<DatumIndexType, any, any, any>) {
                return s.axes[axis.direction] === axis;
            }
            axis.boundSeries = this.series.filter(seriesPredicateFn);
        }
    }

    protected assignAxesToSeries() {
        // This method has to run before `assignSeriesToAxes`.

        for (const series of this.series) {
            for (const direction of series.directions) {
                const seriesAxisId = series.getKeyAxis(direction) ?? direction;
                const newAxis = this.axes.findById(seriesAxisId);
                if (!newAxis) {
                    Logger.warnOnce(
                        `no matching axis for direction [${direction}] and id [${seriesAxisId}]; check series and axes configuration.`
                    );
                    return;
                }
                series.axes[direction] = newAxis;
            }
        }
    }

    private parentResize(size: { width: number; height: number; pixelRatio: number } | undefined) {
        if (size == null || (this.width != null && this.height != null)) return;

        let { width, height } = size;
        const { pixelRatio } = size;

        width = Math.floor(width);
        height = Math.floor(height);

        if (width === 0 && height === 0) return;

        const [autoWidth = 0, autoHeight = 0, autoPixelRatio = 1] = this._lastAutoSize ?? [];
        if (autoWidth === width && autoHeight === height && autoPixelRatio === pixelRatio) return;

        this._lastAutoSize = [width, height, pixelRatio];
        this.resize('SizeMonitor', {});
    }

    private resize(
        source: string,
        opts: {
            inWidth?: number;
            inHeight?: number;
            inMinWidth?: number;
            inMinHeight?: number;
            inOverrideDevicePixelRatio?: number;
        }
    ) {
        const { scene, animationManager } = this.ctx;
        const { inWidth, inHeight, inMinWidth, inMinHeight, inOverrideDevicePixelRatio } = opts;

        this.ctx.domManager.setSizeOptions(
            inMinWidth ?? this.minWidth,
            inMinHeight ?? this.minHeight,
            inWidth ?? this.width,
            inHeight ?? this.height
        );

        const width = inWidth ?? this.width ?? this._lastAutoSize?.[0];
        const height = inHeight ?? this.height ?? this._lastAutoSize?.[1];
        const pixelRatio = inOverrideDevicePixelRatio ?? this.overrideDevicePixelRatio ?? this._lastAutoSize?.[2];
        this.debug(`Chart.resize() from ${source}`, {
            width,
            height,
            pixelRatio,
            stack: new Error('Stack trace for resize tracking').stack,
        });
        if (width == null || height == null || !isFiniteNumber(width) || !isFiniteNumber(height)) return;

        if (scene.resize(width, height, pixelRatio)) {
            animationManager.reset();

            let skipAnimations = true;
            if ((this.width == null || this.height == null) && this._firstAutoSize) {
                skipAnimations = false;
                this._firstAutoSize = false;
            }

            let updateType = ChartUpdateType.PERFORM_LAYOUT;
            for (const axis of this.axes) {
                const axisUpdateType = axis.getUpdateTypeOnResize();
                if (axisUpdateType < updateType) {
                    updateType = axisUpdateType;
                }
            }

            this.update(updateType, { forceNodeDataRefresh: true, skipAnimations });
            this._autoSizeNotify.notify();
        }
    }

    updateData() {
        this.ctx.eventsHub.emit('data:update', this.data);
    }

    private _cachedData: CachedData | undefined = undefined;
    async processData() {
        if (this.series.some((s) => s.canHaveAxes)) {
            this.assignAxesToSeries();
            this.assignSeriesToAxes();
        }

        const dataController = new DataController(this.mode, this.suppressFieldDotNotation, this.ctx.eventsHub);

        const promises: Promise<void>[] = [];
        for (const series of this.series) {
            promises.push(series.processData(dataController) ?? Promise.resolve());
        }
        for (const module of this.modulesManager.modules()) {
            if (module?.processData) {
                promises.push(module.processData(dataController) ?? Promise.resolve());
            }
        }

        this._cachedData = dataController.execute(this._cachedData);

        this.updateSplits('🏭');
        await Promise.all(promises);

        this.updateLegends();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async processDomains() {
        for (const axis of this.axes) {
            axis.processData();
        }

        for (const series of this.series) {
            series.updatedDomains();
        }
    }

    processRanges() {
        const seriesRanges: Record<string, number[]> = {};
        const chartRanges: Record<string, number> = {};
        const seriesTypes = new Map();

        this._requiredRangeDirection = ChartAxisDirection.X;

        // First apply the minimum range from each series by type.
        for (const series of this.series) {
            if (!series.visible) continue;
            seriesRanges[series.type] ??= [];
            series.getMinimumRangeSeries(seriesRanges[series.type]);
            if (series.resolveKeyDirection(ChartAxisDirection.X) === ChartAxisDirection.Y) {
                this._requiredRangeDirection = ChartAxisDirection.Y;
            }
            if (!seriesTypes.has(series.type)) {
                seriesTypes.set(series.type, series);
            }
        }

        // Then apply the minimum range required by a group of series by type. For example, bar series have padding
        // between each series which should only be applied once and is calculated from the width of the bars.
        for (const [type, firstSeries] of seriesTypes) {
            chartRanges[type] = firstSeries.getMinimumRangeChart(seriesRanges[type]);
        }

        if (Object.keys(chartRanges).length === 0) {
            this._requiredRange = 0;
        } else {
            this._requiredRange = Math.ceil(Math.max(...Object.values(chartRanges)));
        }

        for (const axis of this.axes) {
            axis.requiredRange = this._requiredRange;
        }
    }

    private updateLegends(initialStateLegend?: AgInitialStateLegendOptions[]) {
        for (const module of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
            switch (module.name) {
                case 'legend':
                    this.setCategoryLegendData(initialStateLegend);
                    break;

                case 'gradientLegend':
                    const moduleInstance = this.modulesManager.getModule('gradientLegend') as ChartLegend;
                    moduleInstance.data = this.series
                        .filter((s) => s.properties.showInLegend)
                        .flatMap((s) => s.getLegendData('gradient'));
                    break;
            }
        }
    }

    private setCategoryLegendData(initialState?: AgInitialStateLegendOptions[]) {
        const { legendManager, stateManager } = this.ctx;

        if (initialState) {
            for (const s of this.series) {
                const seriesState = initialState.find((init) => init.seriesId === s.id);
                s.onLegendInitialState('category', seriesState);
            }
        }

        const legendData = this.series.flatMap((s) => {
            const seriesLegendData = s.getLegendData('category');
            legendManager.updateData(s.id, seriesLegendData);
            return seriesLegendData;
        });

        if (initialState) {
            stateManager.setStateAndRestore(legendManager, initialState);
            return;
        }

        if (this.mode !== 'integrated') {
            // Validate each series that shares a legend item label uses the same fill colour
            const seriesMarkerFills: { [key: string]: Map<TextOrSegments, AgColorType | undefined> } = {};
            const seriesMap = new Map(this.series.map((s) => [s.id, s]));

            for (const {
                seriesId,
                symbol: { marker },
                label,
            } of legendData.filter((d) => !d.hideInLegend)) {
                if (marker.fill == null) continue;

                const series = seriesMap.get(seriesId);
                if (!series?.hasData) continue;

                const seriesType = series.type;
                const markerFill = (seriesMarkerFills[seriesType] ??= new Map());

                if (markerFill.has(label.text)) {
                    if (markerFill.get(label.text) !== marker.fill) {
                        Logger.warnOnce(
                            `legend item '${toPlainText(label.text)}' has multiple fill colours, this may cause unexpected behaviour.`
                        );
                    }
                } else {
                    markerFill.set(label.text, marker.fill);
                }
            }
        }

        legendManager.update();
    }

    private async processLayout() {
        const oldRect = this.animationRect;
        const { width, height } = this.ctx.scene;
        const ctx = this.ctx.layoutManager.createContext(width, height);

        await this.performLayout(ctx);

        if (oldRect && !this.animationRect?.equals(oldRect)) {
            // Skip animations if the layout changed.
            this.ctx.animationManager.skipCurrentBatch();
        }
        this.debug('Chart.performUpdate() - seriesRect', this.seriesRect);
    }

    protected abstract performLayout(ctx: LayoutContext): Promise<void> | void;

    // Should be available after the first layout.
    protected seriesRect?: BBox;
    // BBox of the chart area containing animatable elements; if this changes, we skip animations.
    protected animationRect?: BBox;

    protected getDebugColors(): { background?: string; foreground?: string } | undefined {
        const bg = this.background.fill;
        if (!bg) return undefined;
        try {
            const color = Color.fromString(bg);
            const [lightness] = Color.RGBtoOKLCH(color.r, color.g, color.b);
            return { background: bg, foreground: lightness > 0.5 ? 'black' : 'white' };
        } catch {
            return { background: bg };
        }
    }

    protected preSeriesUpdate() {
        const { _requiredRange, seriesRect } = this;
        if (seriesRect == null) return;

        const dimension = this._requiredRangeDirection === ChartAxisDirection.X ? seriesRect.width : seriesRect.height;
        const requiredRangeRatio = _requiredRange / dimension || 0; // In case it's NaN, return 0.

        // Once the dimensions of the chart have been calculated, allow modules to respond to these dimensions.
        this.ctx.updateService.dispatchPreSeriesUpdate(requiredRangeRatio, this._requiredRangeDirection);
    }

    protected async updateSeries(seriesToUpdate: ISeries<DatumIndexType, unknown, unknown>[]) {
        const { seriesRect } = this;

        function seriesUpdate(series: ISeries<DatumIndexType, unknown, unknown>) {
            return series.update({ seriesRect });
        }

        await Promise.all(seriesToUpdate.map(seriesUpdate).filter((p): p is Promise<void> => p != null));

        this.ctx.seriesLabelLayoutManager.updateLabels(
            this.series.filter((s) => s.visible && s.usesPlacedLabels),
            this.padding,
            this.seriesRect
        );
    }

    private readonly onSeriesNodeClick = (event: SeriesNodeEvent<any>) => {
        this.fireEvent(event);
    };

    private readonly onSeriesNodeDoubleClick = (event: SeriesNodeEvent<any>) => {
        this.fireEvent(event);
    };

    private readonly onSeriesVisibilityChange = (event: TypedEvent) => {
        this.fireEvent(event);
    };

    private readonly seriesGroupingChanged = (event: TypedEvent) => {
        if (!(event instanceof SeriesGroupingChangedEvent)) return;
        const { series, seriesGrouping } = event;

        // Short-circuit if series isn't already attached to the scene-graph yet.
        if (series.contentGroup.isRoot()) return;

        const seriesContentNode = this.seriesLayerManager.changeGroup({
            internalId: series.internalId,
            type: series.type,
            contentGroup: series.contentGroup,
            bringToFront: () => series.bringToFront(),
            renderToOffscreenCanvas: () => series.renderToOffscreenCanvas(),
            seriesGrouping,
        });

        if (seriesContentNode != null) {
            series.attachSeries(seriesContentNode, this.seriesRoot, this.annotationRoot);
        }
    };

    async waitForUpdate(timeoutMs?: number, failOnTimeout?: boolean): Promise<void> {
        const agChartsDebugTimeout = getWindow<number>('agChartsDebugTimeout');
        if (agChartsDebugTimeout == null) {
            timeoutMs ??= 10_000;
            failOnTimeout ??= false;
        } else {
            timeoutMs = agChartsDebugTimeout;
            failOnTimeout ??= true;
        }

        const start = performance.now();

        while (
            this._pendingFactoryUpdatesCount > 0 ||
            this.performUpdateType !== ChartUpdateType.NONE ||
            this.runningUpdateType !== ChartUpdateType.NONE ||
            this.ctx.scene.waitingForUpdate() ||
            this.data.hasPendingTransactions()
        ) {
            if (this.destroyed) break;

            if (this._pendingFactoryUpdatesCount > 0) {
                // wait until any pending updates are flushed through.
                await this.updateMutex.waitForClearAcquireQueue();
            }

            if (
                this.performUpdateType !== ChartUpdateType.NONE ||
                this.runningUpdateType !== ChartUpdateType.NONE ||
                this.data.hasPendingTransactions()
            ) {
                await this._performUpdateNotify.waitForCompletion();
            }

            if (performance.now() - start > timeoutMs) {
                const message = `Chart.waitForUpdate() timeout of ${timeoutMs} reached - first chart update taking too long.`;
                if (failOnTimeout) {
                    throw new Error(message);
                } else {
                    Logger.warnOnce(message);
                }
            }

            if (isInputPending()) {
                await pause();
            }

            if (this.ctx.scene.waitingForUpdate()) {
                await pause(50);
            }
        }
    }

    private filterMiniChartSeries(series: AgChartOptions['series'] | undefined): AgChartOptions['series'] | undefined;
    private filterMiniChartSeries(series: any[] | undefined): any[] | undefined {
        return series?.filter((s) => s.showInMiniChart !== false);
    }

    applyOptions(newChartOptions: ChartOptions) {
        if (newChartOptions.seriesWithUserVisibility) {
            this.refreshSeriesUserVisibility(this.chartOptions, newChartOptions.seriesWithUserVisibility);
        }

        const minimumUpdateType = ChartUpdateType.PERFORM_LAYOUT;
        const deltaOptions = this.firstApply
            ? newChartOptions.processedOptions
            : newChartOptions.diffOptions(this.chartOptions);
        if (deltaOptions == null || Object.keys(deltaOptions).length === 0) {
            debug('Chart.applyOptions() - no delta, forcing re-layout', deltaOptions);
            this.update(minimumUpdateType, { apiUpdate: true, newAnimationBatch: true });
            return;
        }

        const oldOpts = this.firstApply ? {} : this.chartOptions.processedOptions;
        const newOpts = newChartOptions.processedOptions;

        debug('Chart.applyOptions() - applying delta', deltaOptions);

        const modulesChanged = this.applyModules();

        const skip = [
            'type',
            'data',
            'series',
            'listeners',
            'preset',
            'theme',
            'legend.listeners',
            'navigator.miniChart.series',
            'navigator.miniChart.label',
            'locale.localeText',
            'axes',
            'topology',
            'nodes',
            'initialState',
            'styleContainer',
            'formatter',
            'displayNullData',
            'enableRtl',
        ];

        // Needs to be done before applying the series to detect if a seriesNode[Double]Click listener has been added
        if ('listeners' in deltaOptions) {
            this.registerListeners(this, deltaOptions.listeners as Record<string, TypedEventListener> | undefined);
        }

        if ('enableRtl' in deltaOptions) {
            this.ctx.domManager.setEnableRtl(deltaOptions.enableRtl);
        }

        jsonApply<any, any>(this, deltaOptions, { skip });

        let forceNodeDataRefresh = false;
        let seriesStatus: SeriesChangeType = 'no-op';
        if (deltaOptions.series != null) {
            seriesStatus = this.applySeries(this, deltaOptions.series, oldOpts?.series);
            forceNodeDataRefresh = true;
        }
        if (seriesStatus === 'replaced') {
            this.resetAnimations();
        }
        if (this.applyAxes(this, newOpts, oldOpts, seriesStatus, [])) {
            forceNodeDataRefresh = true;
        }

        // AG-16389: Only reset data if the user explicitly passed 'data' in their delta.
        const { userDeltaKeys } = newChartOptions;
        const userExplicitlyPassedData = userDeltaKeys === undefined || userDeltaKeys.has('data');
        if (deltaOptions.data && userExplicitlyPassedData) {
            // Always create a new DataSet for updateDelta to ensure cache invalidation.
            // Only clone when we still hold the caller's array reference (updateDelta fast path).
            const suppliedData = deltaOptions.data;
            const userOptionsData = newChartOptions.userOptions.data;
            const needsClone = Array.isArray(suppliedData) && suppliedData !== userOptionsData;
            const dataForDataSet = needsClone ? suppliedData.slice() : suppliedData;
            this.data = new DataSet(dataForDataSet, this.dataIdKey);
        }
        if (
            'dataIdKey' in deltaOptions &&
            !(deltaOptions.data && userExplicitlyPassedData) &&
            this.data.dataIdKey !== this.dataIdKey
        ) {
            this.data = new DataSet(this.data.data, this.dataIdKey);
        }
        if (
            'legend' in deltaOptions &&
            deltaOptions.legend &&
            'listeners' in deltaOptions.legend &&
            this.modulesManager.isEnabled('legend')
        ) {
            const legendListeners = deltaOptions.legend.listeners;
            if (legendListeners) {
                Object.assign((this as any).legend.listeners, legendListeners);
            } else {
                // Clear legend listeners when set to undefined
                (this as any).legend.listeners.clear();
            }
        }
        if (deltaOptions.locale?.localeText) {
            this.pendingLocaleText = deltaOptions.locale?.localeText;
        }

        this.chartOptions = newChartOptions;

        const navigatorModule: any = this.modulesManager.getModule('navigator');
        const zoomModule: any = this.modulesManager.getModule('zoom');
        const scrollbarModule: any = this.modulesManager.getModule('scrollbar');

        if (!navigatorModule?.enabled && !zoomModule?.enabled && !scrollbarModule?.enabled) {
            // reset zoom to initial state
            this.ctx.zoomManager.updateZoom(
                { source: 'chart-update', sourceDetail: 'internal-applyOptions' },
                { x: { min: 0, max: 1 } }
            );
        }

        const miniChart = navigatorModule?.miniChart;
        const miniChartSeries =
            (newOpts.navigator?.miniChart?.series as Required<AgMiniChartSeriesOptions>[]) ?? newOpts.series;
        if (miniChart?.enabled === true && miniChartSeries != null) {
            this.applyMiniChartOptions(miniChart, miniChartSeries, newOpts, oldOpts);
        } else if (miniChart?.enabled === false) {
            miniChart.series = [];
            miniChart.axes = []; // TODO axes should be an object, but that throws a "mutex callback error"
        }

        this.ctx.annotationManager.setAnnotationStyles(newChartOptions.annotationThemes);

        forceNodeDataRefresh ||= this.shouldForceNodeDataRefresh(deltaOptions, seriesStatus);
        const majorChange = forceNodeDataRefresh || modulesChanged;
        const updateType = majorChange ? ChartUpdateType.FULL : minimumUpdateType;
        this.maybeResetAnimations(seriesStatus);

        if (this.shouldClearLegendData(newOpts, oldOpts, seriesStatus)) {
            this.ctx.legendManager.clearData();
        }

        this.applyInitialState(newOpts);
        this.ctx.formatManager.setFormatter((newOpts as any).formatter);

        debug('Chart.applyOptions() - update type', ChartUpdateType[updateType], {
            seriesStatus,
            forceNodeDataRefresh,
        });

        // Add options processing time to timing splits and adjust start time
        if (newChartOptions.optionsProcessingTime !== undefined) {
            this._performUpdateSplits['⚙️'] = newChartOptions.optionsProcessingTime;
            // Set the start time to include options processing in total time calculation
            const optionsStartTime = performance.now() - newChartOptions.optionsProcessingTime;
            this._performUpdateSplits.start = optionsStartTime;
        }

        this.update(updateType, {
            apiUpdate: true,
            forceNodeDataRefresh,
            newAnimationBatch: true,
            clearCallbackCache: true,
        });

        this.firstApply = false;
    }

    private applyInitialState(options: AgChartOptions) {
        const { activeManager, annotationManager, chartTypeOriginator, historyManager, stateManager, zoomManager } =
            this.ctx;
        const { initialState } = options;

        if ('annotations' in options && options.annotations?.enabled && initialState?.annotations != null) {
            const annotations = initialState.annotations.map((annotation) => {
                const annotationTheme = annotationManager.getAnnotationTypeStyles(annotation.type);
                return mergeDefaults(annotation, annotationTheme);
            });

            stateManager.setState(annotationManager, annotations);
        }

        if (initialState?.chartType != null) {
            stateManager.setState(chartTypeOriginator, initialState.chartType);
        }

        if (
            (options.navigator?.enabled || options.zoom?.enabled || options.scrollbar?.enabled) &&
            initialState?.zoom != null
        ) {
            stateManager.setState(zoomManager, initialState.zoom);
        }
        if (initialState?.active != null) {
            stateManager.setState(activeManager, initialState.active);
        }

        if (initialState?.legend != null) {
            this.updateLegends(initialState.legend);
        }

        if (initialState != null) {
            historyManager.clear();
        }
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
        const optionsHaveLegend = ['legend', 'gradientLegend'].some(
            (legendKey) => (deltaOptions as any)[legendKey] != null
        );
        const otherRefreshUpdate =
            (deltaOptions.title != null && deltaOptions.subtitle != null) || (deltaOptions as any).formatter != null;
        return seriesDataUpdate || optionsHaveLegend || otherRefreshUpdate;
    }

    private shouldClearLegendData(options: AgChartOptions, oldOpts: AgChartOptions, seriesStatus: SeriesChangeType) {
        const seriesChanged =
            seriesStatus === 'replaced' ||
            seriesStatus === 'series-count-changed' ||
            seriesStatus === 'series-grouping-change' ||
            (seriesStatus === 'updated' &&
                (options.series?.length !== oldOpts.series?.length ||
                    !options.series?.every((s, i) => s.type === oldOpts.series?.[i].type)));
        const legendRemoved =
            oldOpts.legend != null &&
            oldOpts.legend.enabled !== false &&
            (options.legend == null || options.legend.enabled === false);

        return seriesChanged || legendRemoved;
    }

    private applyMiniChartOptions(
        miniChart: any,
        miniChartSeries: NonNullable<AgChartOptions['series']>,
        completeOptions: AgChartOptions,
        oldOpts: AgChartOptions & { type?: SeriesType }
    ) {
        const oldSeries =
            (oldOpts?.navigator?.miniChart?.series as Required<AgMiniChartSeriesOptions>[]) ?? oldOpts?.series;
        const miniChartSeriesStatus = this.applySeries(
            miniChart,
            this.filterMiniChartSeries(miniChartSeries),
            this.filterMiniChartSeries(oldSeries)
        );
        this.applyAxes(miniChart, completeOptions, oldOpts, miniChartSeriesStatus, [
            'tick',
            'thickness',
            'title',
            'crosshair',
            'gridLine',
            'label',
        ]);

        const series: UnknownSeries[] = miniChart.series;
        for (const s of series) {
            // AG-12681
            s.properties.id = undefined;
        }

        const axes = miniChart.axes as ChartAxis[];
        const horizontalAxis = axes.find((axis) => axis.direction === ChartAxisDirection.X);

        for (const axis of axes) {
            axis.nice = false;
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
                without(labelOptions, [
                    'interval',
                    'autoRotate',
                    'autoRotateAngle',
                    'itemStyler',
                    'minSpacing',
                    'rotation',
                ])
            );

            if (horizontalAxis.type === 'grouped-category') {
                horizontalAxis.label.enabled = false;
                horizontalAxis.label.rotation = 0;
                const { depthOptions } = horizontalAxis as GroupedCategoryAxis;
                if (depthOptions.length === 0) {
                    depthOptions.set([{ label: { enabled: true } }]);
                } else {
                    for (let i = 1; i < depthOptions.length; i++) {
                        depthOptions[i].label.enabled = false;
                    }
                }
            } else if (
                horizontalAxis.type === 'time' ||
                horizontalAxis.type === 'unit-time' ||
                horizontalAxis.type === 'ordinal-time'
            ) {
                (horizontalAxis as TimeAxis).parentLevel.enabled = false;
            }

            horizontalAxis.interval.step = intervalOptions?.step;
            horizontalAxis.interval.values = intervalOptions?.values;
            horizontalAxis.interval.minSpacing = intervalOptions?.minSpacing;
            horizontalAxis.interval.maxSpacing = intervalOptions?.maxSpacing;
        }
    }

    private applyModules() {
        const { type: chartType } = this.constructor as any;

        let modulesChanged = false;
        for (const module of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
            const shouldBeEnabled = !module.chartType || module.chartType === chartType;
            if (shouldBeEnabled === this.modulesManager.isEnabled(module.name)) continue;

            if (shouldBeEnabled) {
                const moduleInstance = module.create(this.getModuleContext());
                this.modulesManager.addModule(module.name, moduleInstance);
                (this as any)[module.name] = moduleInstance; // TODO remove
            } else {
                this.modulesManager.removeModule(module.name);
                delete (this as any)[module.name]; // TODO remove
            }

            modulesChanged = true;
        }

        return modulesChanged;
    }

    private initSeriesDeclarationOrder(series: UnknownSeries[]) {
        // Ensure declaration order is set, this is used for correct z-index behaviour for combo charts.
        for (let idx = 0; idx < series.length; idx++) {
            series[idx].setSeriesIndex(idx);
        }
    }

    private applySeries(
        chart: { series: UnknownSeries[] },
        optSeries: AgChartOptions['series'],
        oldOptSeries?: AgChartOptions['series']
    ): SeriesChangeType {
        if (!optSeries) {
            return 'no-change';
        }

        const matchResult = matchSeriesOptions(chart.series, optSeries, oldOptSeries);
        if (matchResult.status === 'no-overlap') {
            debug(`Chart.applySeries() - creating new series instances, status: ${matchResult.status}`, matchResult);
            const chartSeries = optSeries.map((opts) => this.createSeries(opts));
            this.initSeriesDeclarationOrder(chartSeries);
            chart.series = chartSeries;
            return 'replaced';
        }

        debug(`Chart.applySeries() - matchResult`, matchResult);

        const seriesInstances = [];
        let dataChanged = false;
        let groupingChanged = false;
        let isUpdated = false;
        let seriesCountChanged = false;

        const changes = matchResult.changes.toSorted((a, b) => a.targetIdx - b.targetIdx);
        for (const change of changes) {
            groupingChanged ||= change.status === 'series-grouping';
            dataChanged ||= change.diff?.data != null;
            isUpdated ||= change.status !== 'no-op';
            seriesCountChanged ||= change.status === 'add' || change.status === 'remove';

            switch (change.status) {
                case 'add': {
                    const newSeries = this.createSeries(change.opts);
                    seriesInstances.push(newSeries);
                    debug(`Chart.applySeries() - created new series`, newSeries);
                    break;
                }

                case 'remove':
                    debug(`Chart.applySeries() - removing series at previous idx ${change.idx}`, change.series);
                    break;

                case 'no-op':
                    seriesInstances.push(change.series);
                    debug(`Chart.applySeries() - no change to series at previous idx ${change.idx}`, change.series);
                    break;

                case 'series-grouping':
                case 'update':
                default: {
                    const { series, diff, idx } = change;
                    debug(`Chart.applySeries() - applying series diff previous idx ${idx}`, diff, series);
                    this.applySeriesValues(series, diff);
                    series.markNodeDataDirty();
                    seriesInstances.push(series);
                }
            }
        }
        this.initSeriesDeclarationOrder(seriesInstances);

        debug(`Chart.applySeries() - final series instances`, seriesInstances);
        chart.series = seriesInstances;

        if (groupingChanged) {
            return 'series-grouping-change';
        }
        if (seriesCountChanged) {
            return 'series-count-changed';
        }
        if (dataChanged) {
            return 'data-change';
        }
        return isUpdated ? 'updated' : 'no-op';
    }

    private applyAxes(
        chart: { axes: ChartAxes },
        options: AgChartOptions,
        oldOpts: AgChartOptions,
        seriesStatus: SeriesChangeType,
        skip: string[] = []
    ) {
        if (!('axes' in options) || !options.axes) {
            return false;
        }

        skip = ['type', ...skip];

        const axes = options.axes;
        const forceRecreate = seriesStatus === 'replaced';
        const matchingTypes = !forceRecreate && chart.axes.matches(axes);

        // Try to optimise series updates if series count and types didn't change.
        if (matchingTypes && isAgCartesianChartOptions(oldOpts)) {
            for (const axis of chart.axes) {
                const previousOpts = oldOpts.axes?.[axis.id] ?? {};
                const axisDiff = jsonDiff(previousOpts, axes[axis.id]) as any;

                debug(`Chart.applyAxes() - applying axis diff idx ${axis.id}`, axisDiff);

                jsonApply(axis, axisDiff, { skip });
            }
            return true;
        }

        debug(`Chart.applyAxes() - creating new axes instances; seriesStatus: ${seriesStatus}`);
        chart.axes = this.createAxes(axes, skip);
        return true;
    }

    private createSeries(seriesOptions: SeriesOptionsTypes): UnknownSeries {
        const seriesModule = ModuleRegistry.getSeriesModule(seriesOptions.type);
        const seriesInstance = seriesModule!.create(this.getModuleContext()) as UnknownSeries;
        this.applySeriesOptionModules(seriesInstance, seriesOptions);
        this.applySeriesValues(seriesInstance, seriesOptions);
        return seriesInstance;
    }

    private applySeriesOptionModules(series: UnknownSeries, options: SeriesOptionsTypes) {
        const moduleContext = series.createModuleContext();
        const moduleMap = series.getModuleMap();

        for (const module of ModuleRegistry.listModulesByType(ModuleType.SeriesPlugin)) {
            if (module.name in options && (module.seriesTypes?.includes(series.type) ?? true)) {
                moduleMap.addModule(module.name, module.create(moduleContext));
            }
        }
    }

    private applySeriesValues(target: UnknownSeries, options: SeriesOptionsTypes) {
        const moduleMap = target.getModuleMap();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type, data, listeners, seriesGrouping, showInMiniChart, ...seriesOptions } = options as any;

        for (const module of ModuleRegistry.listModulesByType(ModuleType.SeriesPlugin)) {
            if (module.name in seriesOptions) {
                const moduleInstance: any = moduleMap.getModule(module.name);
                if (moduleInstance) {
                    const moduleOptions = seriesOptions[module.name];
                    moduleInstance.properties.set(moduleOptions);
                    delete seriesOptions[module.name];
                }
            }
        }

        if (seriesOptions.visible != null) {
            target.visible = seriesOptions.visible;
        }

        target.properties.set(seriesOptions);

        if ('data' in options) {
            target.setOptionsData(data == null ? undefined : DataSet.wrap(data));
        }

        if ('listeners' in options) {
            this.registerListeners(target, listeners as Record<string, TypedEventListener> | undefined);
            if (this.series.includes(target)) {
                this.addSeriesListeners(target);
            }
        }

        if ('seriesGrouping' in options) {
            if (seriesGrouping == null) {
                target.seriesGrouping = undefined;
            } else {
                target.seriesGrouping = { ...target.seriesGrouping, ...(seriesGrouping as SeriesGrouping) };
            }
        }
    }

    private createAxes(options: Record<string, AgBaseAxisOptions>, skip: string[]): ChartAxes {
        const newAxes = this.createChartAxes();
        const moduleContext = this.getModuleContext();

        for (const [id, axisOptions] of entries(options)) {
            const axis = ModuleRegistry.getAxisModule(axisOptions.type!)!.create(moduleContext) as any;
            axis.id = id as AxisID;
            this.applyAxisModules(axis, axisOptions);
            jsonApply(axis, axisOptions, { skip });

            newAxes.push(axis);
        }

        guessInvalidPositions(newAxes);

        return newAxes;
    }

    private applyAxisModules(axis: ChartAxis, options: AgBaseAxisOptions) {
        const moduleContext = axis.createModuleContext();
        const moduleMap = axis.getModuleMap();

        for (const module of ModuleRegistry.listModulesByType(ModuleType.AxisPlugin)) {
            const shouldBeEnabled = (options as any)[module.name] != null;

            if (shouldBeEnabled === moduleMap.isEnabled(module.name)) continue;

            if (shouldBeEnabled) {
                moduleMap.addModule(module.name, module.create(moduleContext));
                (axis as any)[module.name] = moduleMap.getModule(module.name); // TODO remove
            } else {
                moduleMap.removeModule(module.name);
                delete (axis as any)[module.name]; // TODO remove
            }
        }
    }

    private registerListeners(source: Observable, listeners: Record<string, TypedEventListener> | undefined) {
        source.clearEventListeners();
        if (listeners && typeof listeners === 'object') {
            for (const [property, listener] of entries(listeners)) {
                // Skip undefined/null values (explicitly clearing listeners), but validate non-function values
                if (listener == null) {
                    continue;
                }
                // addEventListener will throw TypeError if listener is not a function, preserving validation behaviour
                source.addEventListener(property, listener);
            }
        }
    }

    async applyTransaction(transaction: AgDataTransaction) {
        // Note: Validation happens at the public API layer (AgChartInstanceProxy)

        await this.updateMutex.acquire(() => {
            this.data.addTransaction(transaction);
            this.update(ChartUpdateType.UPDATE_DATA, {
                apiUpdate: true,
                skipAnimations: true,
            });
        });
        await this.waitForUpdate();
    }

    public onSyncActiveClear(): void {
        this.seriesAreaManager.onActiveClear();
    }
}
