import type { DynamicContext, NormalisedTextOrSegments } from 'ag-charts-core';
import {
    ActionOnSet,
    AgDocument,
    AsyncAwaitQueue,
    type AxisID,
    type AxisPluginModuleInstance,
    type ChartAnimationPhase,
    ChartAxisDirection,
    ChartUpdateType,
    CleanupRegistry,
    Color,
    Debug,
    type ModuleInstance,
    ModuleRegistry,
    ModuleType,
    ZIndexMap,
    callWithContext,
    createId,
    enterpriseRegistry,
    entries,
    getWindow,
    isFiniteNumber,
    isInputPending,
    mergeDefaults,
    pause,
    roundTo,
    toPlainText,
} from 'ag-charts-core';
import type {
    AgBaseAxisOptions,
    AgChartInstance,
    AgChartOptions,
    AgColorType,
    AgDataTransaction,
    AgInitialStateLegendOptions,
    AgMiniChartSeriesOptions,
    AgSelectionItem,
    AgSelectionItemIds,
    SeriesOptionsTypes,
    SeriesType,
} from 'ag-charts-types';

import type { UpdateOpts } from '../core/eventsHub';
import type { ChartRegistry } from '../module/moduleContext';
import type { ChartOptions } from '../module/optionsModule';
import type { SeriesGrouping } from '../module/seriesGrouping';
import { BBox } from '../scene/bbox';
import { Group, TranslatableGroup } from '../scene/group';
import type { Scene } from '../scene/scene';
import { DebugSelectors } from '../scene/sceneDebug';
import { Mutex } from '../util/mutex';
import type { TypedEvent, TypedEventListener } from '../util/observable';
import { Observable } from '../util/observable';
import { debouncedCallback } from '../util/render';
import { Background } from './background/background';
import { ChartAxes } from './chartAxes';
import type { ChartAxis } from './chartAxis';
import type { ChartCaption } from './chartCaption';
import { ChartCaptions } from './chartCaptions';
import { createChartContext } from './chartContext';
import { ChartHighlight } from './chartHighlight';
import type { ChartService, ChartServiceEvent, ChartServiceEventType } from './chartService';
import type { ChartState } from './chartState';
import type { ChartType } from './chartType';
import { type CachedData } from './data/caching';
import { DataController } from './data/dataController';
import { DataSet } from './data/dataSet';
import { replaceDataSet } from './data/dataSetUtil';
import { SyncManager, type SyncStatus } from './interaction/syncManager';
import { type LayoutContext, LayoutElement } from './layout/layoutManager';
import type { ChartLegend } from './legend/legendDatum';
import { LegendPaginationOriginator, findCategoryLegend } from './legend/legendPaginationOriginator';
import { guessInvalidPositions } from './mapping/prepareAxis';
import { matchSeriesOptions } from './mapping/prepareSeries';
import { ModulesManager } from './modulesManager';
import { ChartOverlays } from './overlay/chartOverlays';
import { getLoadingSpinner } from './overlay/loadingSpinner';
import { getValidationOverlay } from './overlay/validationOverlay';
import { SeriesArea } from './series-area/seriesArea';
import { Series, SeriesGroupingChangedEvent, SeriesNodeEvent, type UnknownSeries } from './series/series';
import { type SeriesAreaChartDependencies, SeriesAreaManager } from './series/seriesAreaManager';
import { SeriesLayerManager } from './series/seriesLayerManager';
import type { SeriesProperties } from './series/seriesProperties';
import type { DatumIndex, ISeries, ISeriesProperties, SeriesNodeDatum } from './series/seriesTypes';
import { Tooltip, type TooltipContent } from './tooltip/tooltip';
import { DataWindowProcessor } from './update/dataWindowProcessor';
import { OverlaysProcessor } from './update/overlaysProcessor';
import type { UpdateProcessor } from './update/processor';
import { ValidationIssueCollector } from './validation/validationIssueCollector';

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

const MINI_CHART_LABEL_EXCLUDED: ReadonlySet<string> = new Set([
    'interval',
    'autoRotate',
    'autoRotateAngle',
    'itemStyler',
    'minSpacing',
    'rotation',
]);

const HORIZONTAL_AXIS_POSITIONS = new Set(['top', 'bottom']);

const TIME_LIKE_AXIS_TYPES = new Set(['time', 'unit-time', 'ordinal-time']);

/**
 * Mirrors `axis.context` on top of the latest options reference. The base
 * `Axis` declares `context` with `declare` so the property is absent unless
 * the user supplied one — this preserves the `'context' in axis` semantics
 * that `callWithContext` depends on for chart-level context fallback. See
 * `axis.ts` for the field-declaration rationale.
 */
function syncAxisContext(axis: ChartAxis, opts: AgBaseAxisOptions): void {
    const userContext = (opts as { context?: unknown }).context;
    if (userContext !== undefined) {
        (axis as { context?: unknown }).context = userContext;
    } else if ('context' in axis) {
        delete (axis as { context?: unknown }).context;
    }
}

const MINI_CHART_AXIS_STRIPPED_KEYS = new Set(['thickness', 'title', 'crosshair', 'depthOptions']);

// Mini-chart axes never inherit main-axis tick-density controls. Pre-refactor
// this was achieved by post-construction `=` assignments that cleared the
// fields; here we rebuild the interval object so these four keys come solely
// from the user-supplied `navigator.miniChart.label.interval` (or stay
// undefined). Other interval keys, e.g. category-axis `placement`, still
// fall through from the main axis.
const MINI_CHART_INTERVAL_DENSITY_KEYS = ['step', 'values', 'minSpacing', 'maxSpacing'] as const;

function deriveMiniChartInterval(
    intervalOverride: Record<string, unknown> | undefined,
    sourceInterval: object | undefined
): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...(sourceInterval as object), ...(intervalOverride ?? {}) };
    for (const key of MINI_CHART_INTERVAL_DENSITY_KEYS) {
        merged[key] = intervalOverride?.[key];
    }
    return merged;
}

function stripAxisOptionsForMiniChart(axisOptions: AgBaseAxisOptions): AgBaseAxisOptions {
    const source = axisOptions as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(source)) {
        if (MINI_CHART_AXIS_STRIPPED_KEYS.has(key)) continue;
        result[key] = source[key];
    }
    return result as AgBaseAxisOptions;
}

/**
 * Mini-chart grouped-category axes show only the leaf-level depth labels.
 * Returns a derived `depthOptions` array (or `[{ label: { enabled: true } }]`
 * if the source omitted the field) with non-leaf labels disabled.
 */
function deriveMiniChartGroupedCategoryDepth(sourceDepth: unknown[] | undefined) {
    if (!Array.isArray(sourceDepth) || sourceDepth.length === 0) {
        return [{ label: { enabled: true } }];
    }
    return sourceDepth.map((entry, i) => {
        if (i === 0) return entry;
        return mergeDefaults({ label: { enabled: false } }, entry as { label?: { enabled?: boolean } } | undefined);
    });
}

function deriveMiniChartOptions(completeOptions: AgChartOptions): AgChartOptions {
    const sourceAxes = (completeOptions as { axes?: Record<string, AgBaseAxisOptions> }).axes;
    if (sourceAxes == null) return completeOptions;

    const miniChartLabel = completeOptions.navigator?.miniChart?.label as Record<string, unknown> | undefined;
    const horizontalLabelOverride: Record<string, unknown> = {};
    for (const key of Object.keys(miniChartLabel ?? {})) {
        if (MINI_CHART_LABEL_EXCLUDED.has(key)) continue;
        horizontalLabelOverride[key] = miniChartLabel![key];
    }
    const horizontalIntervalOverride = miniChartLabel?.interval as object | undefined;

    const derivedAxes: Record<string, AgBaseAxisOptions> = {};
    for (const [id, axisOptions] of entries(sourceAxes)) {
        const isHorizontal = HORIZONTAL_AXIS_POSITIONS.has((axisOptions as { position?: string }).position ?? '');
        const isGroupedCategoryHorizontal = isHorizontal && axisOptions.type === 'grouped-category';
        const baseLabel = isHorizontal ? horizontalLabelOverride : {};
        const visibilityOverride = isHorizontal
            ? { enabled: !isGroupedCategoryHorizontal, ...(isGroupedCategoryHorizontal ? { rotation: 0 } : {}) }
            : { enabled: false };
        // Mini-chart strips axis chrome: gridLines and ticks always off; line off
        // on the horizontal axis only (vertical axes keep their line as a frame).
        const lineOverride = isHorizontal ? { enabled: false } : undefined;
        const parentLevelOverride =
            isHorizontal && TIME_LIKE_AXIS_TYPES.has(axisOptions.type ?? '') ? { enabled: false } : undefined;
        // Mini-chart never inherits axis thickness, title, crosshair, or
        // grouped-category depth styling from the main chart's options. Build
        // the derived axis options without those keys so the mini-chart axis
        // never sees them.
        const sourceDepth = (axisOptions as { depthOptions?: unknown[] }).depthOptions;
        const groupedCategoryDepth = isGroupedCategoryHorizontal
            ? deriveMiniChartGroupedCategoryDepth(sourceDepth)
            : undefined;
        const restAxisOptions = stripAxisOptionsForMiniChart(axisOptions);
        const derived: Record<string, unknown> = {
            ...restAxisOptions,
            label: mergeDefaults(visibilityOverride, baseLabel, axisOptions.label),
            gridLine: mergeDefaults({ enabled: false }, axisOptions.gridLine),
            tick: mergeDefaults({ enabled: false }, axisOptions.tick),
            line: mergeDefaults(lineOverride, axisOptions.line),
            interval: isHorizontal
                ? deriveMiniChartInterval(
                      horizontalIntervalOverride as Record<string, unknown> | undefined,
                      axisOptions.interval
                  )
                : axisOptions.interval,
            title: { enabled: false },
        };
        if (parentLevelOverride != null) {
            const sourceParentLevel = (axisOptions as { parentLevel?: object }).parentLevel;
            derived.parentLevel = mergeDefaults(parentLevelOverride, sourceParentLevel);
        }
        if (groupedCategoryDepth != null) {
            derived.depthOptions = groupedCategoryDepth;
        }
        derivedAxes[id] = derived as AgBaseAxisOptions;
    }

    return { ...completeOptions, axes: derivedAxes } as AgChartOptions;
}

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
    readonly selectionRoot = new TranslatableGroup({
        name: `${this.id}-selection-root`,
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
    readonly validationCollector = new ValidationIssueCollector();
    readonly highlight: ChartHighlight;
    readonly background: Background;
    readonly seriesArea: SeriesArea;
    foreground?: Background;

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

    // A dispatched lazy load is a non-empty array, but its rows can still fail to render against the
    // series keys (wrong-shaped or all-null rows). The DataService is series-agnostic and cannot
    // detect that; only a post-process check on `series.hasData` can. Each load snapshots the
    // outgoing data-set so the next `update:complete` can restore it if the load rendered nothing,
    // keeping the chart non-blank and re-requestable on an identical re-zoom.
    private pendingDataRetain: { snapshot: DataSet; requestId: number | undefined } | undefined = undefined;

    public loading: boolean | undefined = undefined;

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
    private readonly chartCaptions: ChartCaptions;

    get seriesAreaBoundingBox() {
        return this.seriesAreaManager.bbox;
    }

    get title(): ChartCaption {
        return this.chartCaptions.title;
    }

    get subtitle(): ChartCaption {
        return this.chartCaptions.subtitle;
    }

    get footnote(): ChartCaption {
        return this.chartCaptions.footnote;
    }

    context?: unknown;

    public destroyed = false;

    private readonly cleanup = new CleanupRegistry();

    chartAnimationPhase: ChartAnimationPhase = 'initial';

    public readonly modulesManager = new ModulesManager();
    public readonly ctx: DynamicContext<ChartRegistry>;
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

    protected createDataSet(data: unknown[]): DataSet {
        const dataIdKey: string | undefined = this.ctx.chartState.getValue('options', 'dataIdKey');
        return replaceDataSet(this.ctx.dataSelectionService, this.data, data, dataIdKey);
    }

    private resolveDataRetain() {
        const retain = this.pendingDataRetain;
        if (retain == null) return;
        this.pendingDataRetain = undefined;

        const rendered = this.series.some((series) => series.hasData);
        this.ctx.eventsHub.emit('data:render-verdict', { requestId: retain.requestId, rendered });
        if (rendered) return;

        // The load replaced the data-set but rendered nothing against the series keys; restore the
        // prior renderable data-set so the chart stays non-blank, and re-run the data path to redraw.
        this.data = retain.snapshot;
        this.ctx.eventsHub.emit('chart:request-update', {
            type: ChartUpdateType.UPDATE_DATA,
            opts: { forceNodeDataRefresh: true },
        });
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
        root.append(this.selectionRoot);
        root.append(this.titleGroup);

        const agDocument = new AgDocument(options.specialOverrides.document, options.specialOverrides.window);

        this.tooltip = new Tooltip(agDocument);
        this.seriesLayerManager = new SeriesLayerManager(this.seriesRoot);
        const ctx = (this.ctx = createChartContext(this, {
            chartType: this.getChartType(),
            scene,
            root,
            container,
            styleContainer,
            styleNonce: options.processedOptions.styleNonce,
            skipCss,
            agDocument,
            domMode: options.optionMetadata.domMode,
            withDragInterpretation: options.optionMetadata.withDragInterpretation ?? true,
            syncManager: new SyncManager(this),
            fireEvent: (event) => this.fireEvent(event),
            updateMutex: this.updateMutex,
            cssVariables: options.processedCSSVariables,
        }));
        // Publish processed options to chartState immediately so option-derived reads
        // (mode, padding, etc.) work for the rest of construction. `applyOptions` will
        // refresh this on each subsequent update.
        ctx.chartState.setValue('options', options.processedOptions as unknown as ChartState['options']);

        this.chartCaptions = new ChartCaptions(ctx);
        this.titleGroup.append(this.title.node);
        this.titleGroup.append(this.subtitle.node);
        this.titleGroup.append(this.footnote.node);

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
                ctx.scene.setDirection(ctx.domManager.isRtl);
                this.update(ChartUpdateType.PERFORM_LAYOUT);
            }),
            ctx.eventsHub.on('chart:request-update', (e) => this.update(e.type, e.opts)),
            ctx.scene.on('scene-changed', () => this.update(ChartUpdateType.SCENE_RENDER))
        );
        ctx.scene.setDirection(ctx.domManager.isRtl);

        this.overlays = new ChartOverlays();
        this.overlays.loading.renderer ??= () =>
            getLoadingSpinner(
                ctx.agDocument,
                this.overlays.loading.getText(ctx.localeManager),
                ctx.animationManager.defaultDuration
            );
        this.overlays.validation.renderer ??= () =>
            getValidationOverlay({
                agDocument: ctx.agDocument,
                localeManager: ctx.localeManager,
                grouped: this.validationCollector.getVisibleIssues(),
                onDismiss: () => this.validationCollector.dismiss(),
            });

        this.processors = [
            new DataWindowProcessor(this, ctx),
            new OverlaysProcessor(
                this,
                this.overlays,
                ctx.eventsHub,
                ctx.dataService,
                ctx.localeManager,
                ctx.animationManager,
                ctx.domManager,
                this.validationCollector
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

        this.seriesAreaManager = new SeriesAreaManager(this.initSeriesAreaDependencies());
        this.cleanup.register(
            // Observers that re-apply BaseProperties subtrees when their option subtree
            // changes. Replaces the explicit `.set()` cascade previously in Chart.applyOptions
            // (Phase 12.7 migration off the BaseProperties cascade).
            ctx.chartState.observe((get) => {
                const opts = get('options', 'tooltip');
                if (opts != null) this.tooltip.set(opts);
            }),
            ctx.chartState.observe((get) => {
                const opts = get('options', 'highlight');
                if (opts != null) this.highlight.set(opts);
            }),
            ctx.chartState.observe((get) => {
                const opts = get('options', 'seriesArea');
                if (opts != null) this.seriesArea.set(opts);
            }),
            ctx.chartState.observe((get) => {
                const opts = get('options', 'overlays');
                if (opts != null) this.overlays.set(opts);
            }),
            ctx.chartState.observe((get) => {
                this.validationCollector.setOverlayLevel(get('options', 'validations')?.overlayLevel ?? 'none');
            }),
            ctx.layoutManager.registerElement(LayoutElement.Caption, (e) => {
                e.layoutBox.shrink(ctx.chartState.getValue('options', 'padding'));
                this.chartCaptions.positionCaptions(e);
            }),
            ctx.eventsHub.on('layout:complete', (e) => this.chartCaptions.positionAbsoluteCaptions(e)),

            ctx.eventsHub.on('data:load', (event) => {
                this.pendingDataRetain = { snapshot: this.data, requestId: event.requestId };
                this.data = this.createDataSet(event.data);
            }),

            ctx.eventsHub.on('update:complete', () => this.resolveDataRetain()),

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

    public hasListener(type: ChartServiceEventType): boolean {
        return this.hasEventListener(type);
    }

    public callListener(event: ChartServiceEvent): void {
        this.fireEvent(event);
    }

    private initSeriesAreaDependencies(): SeriesAreaChartDependencies {
        const { ctx, tooltip, highlight, overlays, seriesRoot } = this;
        const chartType = this.getChartType();
        const hasViewportSupport: () => boolean = () => this.hasViewportSupport();
        const hasPgUpPgDownSupport: () => boolean = () => this.hasPgUpPgDownSupport();
        const fireEvent = this.fireEvent.bind(this);
        const getUpdateType = () => this.performUpdateType;
        const getTooltipContent = (
            series: ISeries<SeriesNodeDatum, ISeriesProperties, unknown>,
            datumIndex: DatumIndex,
            removeThisDatum: SeriesNodeDatum,
            purpose: 'aria-label' | 'tooltip'
        ) => this.getTooltipContent(series, datumIndex, removeThisDatum, purpose);

        return {
            hasViewportSupport,
            hasPgUpPgDownSupport,
            fireEvent,
            getUpdateType,
            getTooltipContent,
            chartType,
            ctx,
            tooltip,
            highlight,
            overlays,
            seriesRoot,
        };
    }

    getModuleContext(): DynamicContext<ChartRegistry> {
        return this.ctx;
    }

    abstract getChartType(): ChartType;

    public getTooltipContent(
        series: ISeries<SeriesNodeDatum, ISeriesProperties, unknown>,
        datumIndex: DatumIndex,
        removeMeDatum: SeriesNodeDatum,
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

    getSelection(): Iterable<AgSelectionItem<unknown>> | undefined {
        return this.modulesManager.selection()?.getSelection();
    }

    setSelection(items: Iterable<AgSelectionItemIds>): void {
        return this.modulesManager.selection()?.setSelection(items);
    }

    clearSelection(): void {
        return this.modulesManager.selection()?.clearSelection();
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

    private requestRefreshListener?: () => void;
    setRequestRefreshListener(listener: () => void) {
        if (this.requestRefreshListener) {
            this.ctx.eventsHub.off('chart:request-refresh', this.requestRefreshListener);
        }
        this.ctx.eventsHub.on('chart:request-refresh', listener);
        this.requestRefreshListener = listener;
    }

    destroy(opts?: { keepTransferableResources: boolean }): TransferableResources | undefined {
        if (this.destroyed) return;
        // Set the flag before any further work so any event emitted or callback fired
        // during the cascade sees a destroyed chart and early-exits via this guard.
        this.destroyed = true;

        const keepTransferableResources = opts?.keepTransferableResources;
        let result: TransferableResources | undefined;

        if (keepTransferableResources) {
            // Strip synchronously so the scene is safe to hand to a replacement chart
            // even while the rest of the teardown is queued behind any in-flight update.
            this.ctx.scene.strip();
            result = {
                container: this.container,
                scene: this.ctx.scene,
            };
        }

        // Queue teardown behind any in-flight update so we don't mutate shared state
        // (e.g. clear `series.chart`) mid-render-cycle.
        this.updateMutex
            .acquire(() => this.performTeardown(!!keepTransferableResources))
            .catch((e) => this.ctx.logger.errorOnce(e));

        return result;
    }

    private performTeardown(keepTransferableResources: boolean): void {
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

        if (!keepTransferableResources) {
            this.ctx.scene.destroy();
            this.container = undefined;
        }

        this.destroySeries(this.series);
        this.seriesLayerManager.destroy();

        this.axes.destroy();

        // Reset animation state.
        this.animationRect = undefined;

        this.ctx.destroy();

        Object.freeze(this);
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
            .catch((e) => this.ctx.logger.errorOnce(e));
    }

    private clearCallbackCache() {
        this.ctx.callbackCache.invalidateCache();
        for (const series of this.series) {
            series.resetDatumCallbackCache();
        }
    }

    private apiUpdate = false;
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
        this.updateMutex.acquire(this.tryPerformUpdate.bind(this, count)).catch((e) => this.ctx.logger.errorOnce(e));
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
        this.ctx.widgets.seriesWidget.setDragTouchEnabled(
            this.ctx.chartState.getValue('options', 'touch').dragAction !== 'none'
        );

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
            this.ctx.logger.error('update error', error, error.stack);
            this.validationCollector.add({
                severity: 'error',
                message: String(error?.message ?? error),
                code: typeof error?.stack === 'string' ? error.stack : undefined,
            });
            this.runningUpdateType = ChartUpdateType.NONE;
            this._performUpdateNotify.notify();
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

        ctx.chartState.flushChanges();

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

                this.ctx.eventsHub.emit('update:pre-dom', null);
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

                // Refresh theme CSS variables whenever resolved options change, independent of the layout shortcut.
                ctx.domManager.setThemeParameters(this.chartOptions.themeParameters);

                if (this.checkUpdateShortcut(ChartUpdateType.PERFORM_LAYOUT)) break;

                ctx.chartState.flushChanges('legendData');
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
                ctx.eventsHub.emit('update:pre-scene-render', { apiUpdate: this.apiUpdate });

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
            ctx.eventsHub.emit('update:complete', {
                apiUpdate: this.apiUpdate,
                wasShortcut: this.updateShortcutCount > 0,
            });
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

        const { enabled, tabIndex } = this.ctx.chartState.getValue('options', 'keyboard');
        this.ctx.domManager.setTabGuardIndex(enabled ? (tabIndex ?? 0) : -1);
    }

    private updateAriaLabels() {
        this.ctx.domManager.updateCanvasLabel(this.getAriaLabel());
    }

    private checkUpdateShortcut(checkUpdateType: ChartUpdateType) {
        const maxShortcuts = 3;

        if (this.destroyed) return true;

        if (this.updateShortcutCount > maxShortcuts) {
            this.ctx.logger.warn(
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
    series: Series<SeriesNodeDatum, object, SeriesProperties<object>>[] = [];

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
                get: () => this.ctx.chartState.getValue('options', 'mode'),
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
            function seriesPredicateFn(s: Series<SeriesNodeDatum, any, any>) {
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
                    this.ctx.logger.warnOnce(
                        `no matching axis for direction [${direction}] and id [${seriesAxisId}]; check series and axes configuration.`
                    );
                    return;
                }
                series.axes[direction] = newAxis;
            }
        }
    }

    private parentResize(size: { width: number; height: number; pixelRatio: number } | undefined) {
        if (this.destroyed || size == null || (this.width != null && this.height != null)) return;

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
            } else if (this.chartAnimationPhase === 'initial') {
                // A resize during the initial phase (e.g. the size monitor re-measuring
                // after a series-type switch) must not cancel the pending entry animation.
                skipAnimations = false;
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

        const dataController = new DataController(
            this.ctx.chartState.getValue('options', 'mode'),
            this.ctx.chartState.getValue('options', 'suppressFieldDotNotation'),
            this.ctx.eventsHub,
            this.ctx.logger
        );

        const promises: Promise<void>[] = [];
        for (const series of this.series) {
            promises.push(series.processData(dataController) ?? Promise.resolve());
        }
        for (const module of this.modulesManager.modules()) {
            if (module?.processData) {
                promises.push(module.processData(dataController) ?? Promise.resolve());
            }
        }

        this._cachedData = dataController.execute(this._cachedData, this.ctx.dataSelectionService);

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
            // IMPORTANT: _requiredRange must only be set here (during PROCESS_RANGE), not during
            // PERFORM_LAYOUT. The zoom oscillation guard in zoomManager.restoreRequiredRange() depends
            // on this value being stable across re-layouts to distinguish genuine option changes from
            // layout-triggered dimension changes. See AG-16803 and AG-17008.
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
                    const moduleInstance = this.modulesManager.getModule<ChartLegend>('gradientLegend')!;
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
            legendManager?.updateData(s.id, seriesLegendData);
            return seriesLegendData;
        });

        if (initialState && legendManager) {
            stateManager.setStateAndRestore(legendManager, initialState);
            return;
        }

        if (this.ctx.chartState.getValue('options', 'mode') !== 'integrated') {
            // Validate each series that shares a legend item label uses the same fill colour
            const seriesMarkerFills: { [key: string]: Map<NormalisedTextOrSegments, AgColorType | undefined> } = {};
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
                        this.ctx.logger.warnOnce(
                            `legend item '${toPlainText(label.text)}' has multiple fill colours, this may cause unexpected behaviour.`
                        );
                    }
                } else {
                    markerFill.set(label.text, marker.fill);
                }
            }
        }
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
        const bg = this.ctx.chartState.getValue('options', 'background').fill;
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
        this.ctx.eventsHub.emit('update:pre-series', {
            requiredRangeRatio,
            requiredRangeDirection: this._requiredRangeDirection,
            requiredRange: _requiredRange,
        });
    }

    protected async updateSeries(seriesToUpdate: ISeries<SeriesNodeDatum, ISeriesProperties>[]) {
        const { seriesRect } = this;

        function seriesUpdate(series: ISeries<SeriesNodeDatum, ISeriesProperties>) {
            return series.update({ seriesRect });
        }

        await Promise.all(seriesToUpdate.map(seriesUpdate).filter((p): p is Promise<void> => p != null));

        this.ctx.labelManager.updateLabels(
            this.series.filter((s) => s.visible),
            this.ctx.chartState.getValue('options', 'padding'),
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
                    this.ctx.logger.warnOnce(message);
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
        this.validationCollector.setIssues(newChartOptions.validationIssues);

        if (newChartOptions.seriesWithUserVisibility) {
            this.refreshSeriesUserVisibility(this.chartOptions, newChartOptions.seriesWithUserVisibility);
        }

        const minimumUpdateType = ChartUpdateType.PERFORM_LAYOUT;
        const deltaOptions = this.firstApply
            ? newChartOptions.processedOptions
            : newChartOptions.diffOptions(this.chartOptions);
        if (deltaOptions == null || Object.keys(deltaOptions).length === 0) {
            debug('Chart.applyOptions() - no delta, forcing re-layout', deltaOptions);
            // Theme params resolve into `themeParameters`, not `processedOptions`, so a
            // params-only change diffs empty here; adopt the resolved options regardless.
            this.chartOptions = newChartOptions;
            this.update(minimumUpdateType, { apiUpdate: true, newAnimationBatch: true });
            return;
        }

        const oldOpts = this.firstApply ? {} : this.chartOptions.processedOptions;
        const newOpts = newChartOptions.processedOptions;

        debug('Chart.applyOptions() - applying delta', deltaOptions);

        // Store options in chartState BEFORE creating modules, so modules can read
        // their initial options via chartState from construction.
        this.ctx.chartState.setValue('options', newChartOptions.processedOptions as unknown as ChartState['options']);

        const modulesChanged = this.applyModules();

        // Needs to be done before applying the series to detect if a seriesNode[Double]Click listener has been added
        if ('listeners' in deltaOptions) {
            this.registerListeners(this, deltaOptions.listeners as Record<string, TypedEventListener> | undefined);
        }

        if ('enableRtl' in deltaOptions) {
            this.ctx.domManager.setEnableRtl(deltaOptions.enableRtl);
        }

        // Chart-level fields not yet migrated to chartState-driven consumption.
        // Their @ActionOnSet decorators trigger resize / DOM setup on assignment.
        if ('container' in deltaOptions) this.container = deltaOptions.container ?? undefined;
        if ('height' in deltaOptions) this.height = deltaOptions.height;
        if ('minHeight' in deltaOptions) this.minHeight = deltaOptions.minHeight;
        if ('minWidth' in deltaOptions) this.minWidth = deltaOptions.minWidth;
        if ('overrideDevicePixelRatio' in deltaOptions) {
            this.overrideDevicePixelRatio = deltaOptions.overrideDevicePixelRatio as number | undefined;
        }
        if ('width' in deltaOptions) this.width = deltaOptions.width;
        if ('loading' in deltaOptions) this.loading = deltaOptions.loading;
        if ('context' in deltaOptions) this.context = deltaOptions.context;

        // tooltip/highlight/seriesArea/overlays subtrees are applied via chartState observers
        // registered in the constructor — no explicit cascade needed here.

        let forceNodeDataRefresh = false;
        let seriesStatus: SeriesChangeType = 'no-op';
        if (deltaOptions.series != null) {
            seriesStatus = this.applySeries(this, deltaOptions.series, oldOpts?.series);
            forceNodeDataRefresh = true;
        }
        if (seriesStatus === 'replaced') {
            this.resetAnimations();
        }
        if (this.applyAxes(this, newOpts, seriesStatus)) {
            forceNodeDataRefresh = true;
        }

        // AG-16389: Only reset data if the user explicitly passed 'data' in their delta.
        const { userDeltaKeys } = newChartOptions;
        const userExplicitlyPassedData = userDeltaKeys === undefined || userDeltaKeys.has('data');
        let dataSetRecreated = false;
        if (deltaOptions.data && userExplicitlyPassedData) {
            // Always create a new DataSet for updateDelta to ensure cache invalidation.
            // Only clone when we still hold the caller's array reference (updateDelta fast path).
            const suppliedData = deltaOptions.data;
            const userOptionsData = newChartOptions.userOptions.data;
            const needsClone = Array.isArray(suppliedData) && suppliedData !== userOptionsData;
            const dataForDataSet = needsClone ? suppliedData.slice() : suppliedData;
            this.data = this.createDataSet(dataForDataSet);
            dataSetRecreated = true;
        }
        if (
            'dataIdKey' in deltaOptions &&
            !(deltaOptions.data && userExplicitlyPassedData) &&
            this.data.dataIdKey !== this.ctx.chartState.getValue('options', 'dataIdKey')
        ) {
            this.data = this.createDataSet(this.data.data);
            dataSetRecreated = true;
        }
        if (seriesStatus === 'replaced' && !dataSetRecreated) {
            // Series type changed without a data change — recreate DataSet so subclass
            // overrides (e.g. HierarchyDataSet for treemap) are installed.
            this.data = this.createDataSet(this.data.data);
        }

        this.chartOptions = newChartOptions;

        const navigatorModule = this.modulesManager.getModule<{
            miniChart?: { enabled?: boolean; series: unknown[]; axes: unknown[] };
        }>('navigator');

        if (!this.hasViewportSupport()) {
            // reset zoom to initial state
            this.ctx.zoomManager?.updateZoom(
                { source: 'chart-update', sourceDetail: 'internal-applyOptions' },
                { x: { min: 0, max: 1 }, y: { min: 0, max: 1 } }
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

        this.ctx.annotationManager?.setAnnotationStyles(newChartOptions.annotationThemes);

        forceNodeDataRefresh ||= this.shouldForceNodeDataRefresh(deltaOptions, seriesStatus);
        const majorChange = forceNodeDataRefresh || modulesChanged;
        const updateType = majorChange ? ChartUpdateType.FULL : minimumUpdateType;
        this.maybeResetAnimations(seriesStatus);

        if (this.shouldClearLegendData(newOpts, oldOpts, seriesStatus)) {
            this.ctx.legendManager?.clearData();
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

        if (
            'annotations' in options &&
            options.annotations?.enabled &&
            initialState?.annotations != null &&
            annotationManager
        ) {
            const annotations = initialState.annotations.map((annotation) => {
                const annotationTheme = annotationManager.getAnnotationTypeStyles(annotation.type);
                return mergeDefaults(annotation, annotationTheme);
            });

            stateManager.setState(annotationManager, annotations);
        }

        if (initialState?.chartType != null) {
            stateManager.setState(chartTypeOriginator, initialState.chartType);
        }

        if (this.needsViewportSupport(options) && initialState?.zoom != null && zoomManager) {
            stateManager.setState(zoomManager, initialState.zoom);
        }

        if (initialState?.active != null) {
            stateManager.setState(activeManager, initialState.active);
        }

        if (initialState?.collapsed != null) {
            stateManager.setState(this.ctx.collapsedManager, initialState.collapsed);
        }

        if (initialState?.legend != null) {
            this.updateLegends(initialState.legend);
        }

        if (initialState?.legendPagination != null) {
            const categoryLegend = findCategoryLegend(this.modulesManager.legends());
            if (categoryLegend) {
                stateManager.setState(new LegendPaginationOriginator(categoryLegend), initialState.legendPagination);
            }
        }

        if (initialState != null) {
            historyManager.clear();
        }
    }

    private maybeResetAnimations(seriesStatus: SeriesChangeType) {
        if (this.ctx.chartState.getValue('options', 'mode') !== 'standalone') return;

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
        const derivedOptions = deriveMiniChartOptions(completeOptions);
        this.applyAxes(miniChart, derivedOptions, miniChartSeriesStatus);

        const series: UnknownSeries[] = miniChart.series;
        for (const s of series) {
            // AG-12681
            s.properties.id = undefined;
        }

        const axes = miniChart.axes as ChartAxis[];

        // AG-17456: the navigator overlay is derived from the main chart's domain-direction
        // axis after `nice` rounding, so the mini-chart axis on that same direction must
        // inherit `nice` from the main axis or the handles drift. All other (cross) axes
        // keep `nice = false` — restoring the pre-AG-13759 raw-extent rendering and avoiding
        // collateral mini-chart rendering changes (see AG-17456 history comment).
        // The domain direction is resolved from the main series rather than
        // `_requiredRangeDirection`, which is only set later by `processRanges()`.
        const domainDirection = this.series.some(
            (s) => s.visible && s.resolveKeyDirection(ChartAxisDirection.X) === ChartAxisDirection.Y
        )
            ? ChartAxisDirection.Y
            : ChartAxisDirection.X;
        const mainDomainAxis = this.axes.find((axis) => axis.direction === domainDirection);
        for (const axis of axes) {
            axis.nice = axis.direction === domainDirection ? (mainDomainAxis?.nice ?? true) : false;
            axis.interactionEnabled = false;
        }
    }

    private applyModules() {
        const { type: chartType } = this.constructor as any;

        let modulesChanged = false;
        for (const module of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
            const shouldBeEnabled = !module.chartType || module.chartType === chartType;
            if (shouldBeEnabled === this.modulesManager.isEnabled(module.name)) continue;

            if (shouldBeEnabled) {
                // Register any services this module contributes before constructing it.
                // Modules registered after `createChartContext()` (e.g. a plugin added via
                // `AgCharts.registerModule()` post-construction) would otherwise miss the
                // one-shot `register()` loop in `createChartContext`. `ctx.has()` guards in
                // each register hook keep repeated registration a no-op.
                module.register?.(this.getModuleContext());
                const moduleInstance = module.create(this.getModuleContext());
                this.modulesManager.addModule(module.name, moduleInstance);
            } else {
                this.modulesManager.removeModule(module.name);
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

    private applyAxes(chart: { axes: ChartAxes }, options: AgChartOptions, seriesStatus: SeriesChangeType) {
        if (!('axes' in options) || !options.axes) {
            return false;
        }

        const axes = options.axes;
        const forceRecreate = seriesStatus === 'replaced';
        const matchingTypes = !forceRecreate && chart.axes.matches(axes);

        // Try to optimise series updates if series count and types didn't change.
        if (matchingTypes) {
            for (const axis of chart.axes) {
                const newOpts = axes[axis.id];
                axis.applyOptions(newOpts as typeof axis.options);
                syncAxisContext(axis, newOpts);
                this.applyAxisModules(axis, newOpts);
            }
        } else {
            debug(`Chart.applyAxes() - creating new axes instances; seriesStatus: ${seriesStatus}`);
            chart.axes = this.createAxes(axes);
        }

        for (const [canonicalKey, userKey] of this.chartOptions.unmappedAxisKeys) {
            const axis = chart.axes.findById(canonicalKey);
            if (axis) {
                axis.userKey = userKey;
            }
        }
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

    private createAxes(options: Record<string, AgBaseAxisOptions>): ChartAxes {
        const newAxes = this.createChartAxes();
        const moduleContext = this.getModuleContext();

        for (const [id, axisOptions] of entries(options)) {
            const axis = ModuleRegistry.getAxisModule(axisOptions.type!)!.create(
                moduleContext,
                id as AxisID,
                axisOptions
            ) as ChartAxis;
            this.applyAxisModules(axis, axisOptions);

            newAxes.push(axis);
        }

        guessInvalidPositions(newAxes);

        return newAxes;
    }

    private applyAxisModules(axis: ChartAxis, options: AgBaseAxisOptions) {
        const moduleContext = axis.createModuleContext();
        const moduleMap = axis.getModuleMap();
        const { type: chartType } = this.constructor as any;

        for (const module of ModuleRegistry.listModulesByType(ModuleType.AxisPlugin)) {
            if (module.chartType && module.chartType !== chartType) continue;

            const optionsKey = module.optionsKey ?? module.name;
            const pluginOpts = (options as any)[optionsKey];
            const shouldBeEnabled = pluginOpts != null;
            const isEnabled = moduleMap.isEnabled(module.name);

            if (!shouldBeEnabled) {
                if (isEnabled) {
                    moduleMap.removeModule(module.name);
                }
                continue;
            }

            if (!isEnabled) {
                module.register?.(moduleContext);
                moduleMap.addModule(module.name, module.create(moduleContext));
            }

            const plugin = moduleMap.getModule(module.name) as AxisPluginModuleInstance;
            plugin.applyOptions(pluginOpts);
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

    private needsViewportSupport(options: {
        [Module in 'navigator' | 'zoom' | 'scrollbar']?: { enabled?: boolean };
    }): boolean {
        return !!options.navigator?.enabled || !!options.zoom?.enabled || !!options.scrollbar?.enabled;
    }

    public hasViewportSupport(): boolean {
        return this.needsViewportSupport({
            navigator: this.modulesManager.getModule('navigator'),
            zoom: this.modulesManager.getModule('zoom'),
            scrollbar: this.modulesManager.getModule('scrollbar'),
        });
    }

    public hasPgUpPgDownSupport(): boolean {
        return true;
    }
}
