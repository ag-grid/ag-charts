import type { AgBaseAxisOptions, AgChartClickEvent, AgChartDoubleClickEvent, AgChartOptions } from 'ag-charts-types';

import type { ModuleInstance } from '../module/baseModule';
import type { LegendModule, RootModule } from '../module/coreModules';
import { moduleRegistry } from '../module/module';
import type { ModuleContext } from '../module/moduleContext';
import type { AxisOptionModule, ChartOptions } from '../module/optionsModule';
import type { SeriesOptionModule } from '../module/optionsModuleTypes';
import { BBox } from '../scene/bbox';
import { Group } from '../scene/group';
import type { Point } from '../scene/point';
import type { Scene } from '../scene/scene';
import type { PlacedLabel, PointLabelDatum } from '../scene/util/labelPlacement';
import { isPointLabelDatum, placeLabels } from '../scene/util/labelPlacement';
import styles from '../styles/styles';
import { groupBy } from '../util/array';
import { sleep } from '../util/async';
import { setAttribute } from '../util/attributeUtil';
import { Debug } from '../util/debug';
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
import { REGIONS } from './interaction/regions';
import { SyncManager } from './interaction/syncManager';
import { TooltipManager } from './interaction/tooltipManager';
import { ZoomManager } from './interaction/zoomManager';
import { Keyboard } from './keyboard';
import { makeKeyboardPointerEvent } from './keyboardUtil';
import { Layers } from './layers';
import type { CategoryLegendDatum, ChartLegend, ChartLegendType, GradientLegendDatum } from './legendDatum';
import { guessInvalidPositions } from './mapping/prepareAxis';
import { matchSeriesOptions } from './mapping/prepareSeries';
import { type SeriesOptionsTypes, isAgCartesianChartOptions } from './mapping/types';
import { ModulesManager } from './modulesManager';
import { ChartOverlays } from './overlay/chartOverlays';
import { getLoadingSpinner } from './overlay/loadingSpinner';
import { type PickFocusOutputs, type Series, SeriesGroupingChangedEvent, SeriesNodePickMode } from './series/series';
import { SeriesLayerManager } from './series/seriesLayerManager';
import type { SeriesProperties } from './series/seriesProperties';
import type { SeriesGrouping } from './series/seriesStateManager';
import type { ISeries, SeriesNodeDatum } from './series/seriesTypes';
import {
    DEFAULT_TOOLTIP_CLASS,
    Tooltip,
    type TooltipContent,
    type TooltipEventType,
    type TooltipPointerEvent,
} from './tooltip/tooltip';
import { BaseLayoutProcessor } from './update/baseLayoutProcessor';
import { DataWindowProcessor } from './update/dataWindowProcessor';
import { OverlaysProcessor } from './update/overlaysProcessor';
import type { UpdateProcessor } from './update/processor';
import type { UpdateOpts } from './updateService';

const debug = Debug.create(true, 'opts');

export type TransferableResources = {
    container?: HTMLElement;
    scene: Scene;
};

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

type PointerOffsetsAndHistory = PointerOffsets & { pointerHistory?: PointerOffsets[] };

type ChartFocusData = {
    hasFocus: boolean;
    series?: Series<any, any>;
    seriesIndex: number;
    datum: any;
    datumIndex: number;
};

class SeriesArea extends BaseProperties {
    @Validate(BOOLEAN, { optional: true })
    clip?: boolean;

    @Validate(OBJECT)
    padding = new Padding(0);
}

export abstract class Chart extends Observable {
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

            this.ctx.domManager.setContainer(value);
            Chart.chartsInstances.set(value, this);
        },
        oldValue(value: HTMLElement) {
            Chart.chartsInstances.delete(value);
        },
    })
    container?: HTMLElement;

    public data: any = [];

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

    /** NOTE: This is exposed for use by Integrated charts only. */
    get canvasElement() {
        return this.ctx.scene.canvas.element;
    }

    private _lastAutoSize?: [number, number];
    private _firstAutoSize = true;

    download(fileName?: string, fileFormat?: string) {
        this.ctx.scene.download(fileName, fileFormat);
    }
    getCanvasDataURL(fileFormat?: string) {
        return this.ctx.scene.getDataURL(fileFormat);
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
    protected readonly seriesLayerManager: SeriesLayerManager;

    private readonly processors: UpdateProcessor[] = [];

    processedOptions: AgChartOptions & { type?: SeriesOptionsTypes['type'] } = {};
    queuedUserOptions: AgChartOptions[] = [];
    chartOptions: ChartOptions;

    getOptions() {
        return this.queuedUserOptions.at(-1) ?? this.chartOptions.userOptions;
    }

    protected constructor(options: ChartOptions, resources?: TransferableResources) {
        super();

        this.chartOptions = options;

        const scene: Scene | undefined = resources?.scene;
        const container = resources?.container;

        const root = new Group({ name: 'root' });
        // Prevent the scene from rendering chart components in an invalid state
        // (before first layout is performed).
        root.visible = false;
        root.append(this.seriesRoot);
        root.append(this.highlightRoot);
        root.append(this.annotationRoot);

        const { overrideDevicePixelRatio } = options.specialOverrides;

        this.tooltip = new Tooltip();
        this.seriesLayerManager = new SeriesLayerManager(this.seriesRoot, this.highlightRoot, this.annotationRoot);
        const ctx = (this.ctx = new ChartContext(this, {
            scene,
            root,
            syncManager: new SyncManager(this),
            container,
            updateCallback: (type = ChartUpdateType.FULL, opts) => this.update(type, opts),
            updateMutex: this.updateMutex,
            overrideDevicePixelRatio,
        }));
        ctx.domManager.addListener('resize', (e) => this.parentResize(e.size));

        this.overlays = new ChartOverlays();
        this.overlays.loading.renderer ??= () =>
            getLoadingSpinner(this.overlays.loading.getText(ctx.localeManager), ctx.animationManager.defaultDuration);

        this.processors = [
            new BaseLayoutProcessor(this, ctx.layoutService),
            new DataWindowProcessor(this, ctx.dataService, ctx.updateService, ctx.zoomManager),
            new OverlaysProcessor(
                this,
                this.overlays,
                ctx.dataService,
                ctx.layoutService,
                ctx.localeManager,
                ctx.animationManager,
                ctx.domManager
            ),
        ];

        this.highlight = new ChartHighlight();
        this.container = container;

        const { All } = InteractionState;
        const moduleContext = this.getModuleContext();
        const seriesRegion = ctx.regionManager.addRegion(
            REGIONS.SERIES,
            this.seriesRoot,
            this.ctx.axisManager.axisGridGroup
        );

        const horizontalAxesRegion = this.ctx.regionManager.addRegion(REGIONS.HORIZONTAL_AXES);
        const verticalAxesRegion = this.ctx.regionManager.addRegion(REGIONS.VERTICAL_AXES);

        ctx.regionManager.addRegion('root', root);

        this._destroyFns.push(
            ctx.dataService.addListener('data-load', (event) => {
                this.data = event.data;
            }),

            ctx.scene.attachNode(this.title.node),
            ctx.scene.attachNode(this.subtitle.node),
            ctx.scene.attachNode(this.footnote.node),

            this.title.registerInteraction(moduleContext),
            this.subtitle.registerInteraction(moduleContext),
            this.footnote.registerInteraction(moduleContext),

            ctx.regionManager.listenAll('click', (event) => this.onClick(event)),
            ctx.regionManager.listenAll('dblclick', (event) => this.onDoubleClick(event)),
            seriesRegion.addListener(
                'hover',
                (event) => this.onMouseMove(event),
                InteractionState.Default | InteractionState.Annotations
            ),
            seriesRegion.addListener(
                'drag',
                (event) => this.onMouseMove(event),
                InteractionState.Default | InteractionState.Annotations
            ),
            horizontalAxesRegion.addListener('hover', (event) => this.onMouseMove(event)),
            verticalAxesRegion.addListener('hover', (event) => this.onMouseMove(event)),
            seriesRegion.addListener('leave', (event) => this.onLeave(event)),
            horizontalAxesRegion.addListener('leave', (event) => this.onLeave(event)),
            verticalAxesRegion.addListener('leave', (event) => this.onLeave(event)),
            seriesRegion.addListener('blur', () => this.onBlur()),
            seriesRegion.addListener('tab', (event) => this.onTab(event)),
            seriesRegion.addListener('nav-vert', (event) => this.onNavVert(event)),
            seriesRegion.addListener('nav-hori', (event) => this.onNavHori(event)),
            seriesRegion.addListener('submit', (event) => this.onSubmit(event)),
            seriesRegion.addListener('contextmenu', (event) => this.onContextMenu(event), All),
            ctx.keyNavManager.addListener('browserfocus', (event) => this.onBrowserFocus(event)),
            ctx.interactionManager.addListener('page-left', () => this.destroy()),
            ctx.animationManager.addListener('animation-start', () => this.onAnimationStart()),

            ctx.animationManager.addListener('animation-frame', () => {
                this.update(ChartUpdateType.SCENE_RENDER);
            }),
            ctx.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event)),
            ctx.zoomManager.addListener('zoom-pan-start', () => this.resetPointer()),
            ctx.zoomManager.addListener('zoom-change', () => {
                this.resetPointer();
                this.ctx.focusIndicator.updateBounds(undefined);
                this.series.map((s) => (s as any).animationState?.transition('updateData'));
                const skipAnimations = this.chartAnimationPhase !== 'initial';
                this.update(ChartUpdateType.PERFORM_LAYOUT, { forceNodeDataRefresh: true, skipAnimations });
            })
        );
    }

    getModuleContext(): ModuleContext {
        return this.ctx;
    }

    protected getCaptionText(): string {
        return [this.title, this.subtitle, this.footnote]
            .filter((caption) => caption.enabled && caption.text)
            .map((caption) => caption.text)
            .join('. ');
    }

    getAriaLabel(): string {
        return this.ctx.localeManager.t('ariaAnnounceChart', {
            seriesCount: this.series.length,
            caption: this.getCaptionText(),
        });
    }

    private getDatumAriaText(datum: SeriesNodeDatum, html: TooltipContent): string {
        const description = html.ariaLabel;
        return datum.series.getDatumAriaText?.(datum, description) ?? description;
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
        this.tooltip.destroy(this.ctx.domManager);
        this.overlays.destroy();
        this.modulesManager.destroy();

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
    private readonly seriesToUpdate: Set<ISeries<any, any>> = new Set();
    private readonly updateMutex = new Mutex();
    private updateRequestors: Record<string, ChartUpdateType> = {};
    private readonly performUpdateTrigger = debouncedCallback(async ({ count }) => {
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

    private readonly _performUpdateSplits: Record<string, number> = {};
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
                this.updateDOM();
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

                this.ctx.domManager.incrementDataCounter('sceneRenders');
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

        this.ctx.domManager.setThemeClass(themeClassName);
    }

    private updateDOM() {
        this.updateThemeClassName();

        const { enabled, tabIndex } = this.keyboard;
        this.ctx.domManager.setTabIndex(enabled ? tabIndex ?? 0 : -1);

        setAttribute(this.ctx.scene.canvas.element, 'role', 'figure');
        setAttribute(this.ctx.scene.canvas.element, 'aria-label', this.getAriaLabel());
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
        if (this.width != null && this.height != null) {
            // Auto-size isn't in use in this case, don't wait for it.
        } else if (!this._lastAutoSize) {
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

    protected onAxisChange(newValue: ChartAxis[], oldValue?: ChartAxis[]) {
        if (oldValue == null && newValue.length === 0) return;

        this.ctx.axisManager.updateAxes(oldValue ?? [], newValue);
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

    private parentResize({ width, height }: { width: number; height: number }) {
        if (this.width != null && this.height != null) return;

        width = Math.floor(width);
        height = Math.floor(height);

        if (width === 0 && height === 0) return;

        const [autoWidth = 0, authHeight = 0] = this._lastAutoSize ?? [];
        if (autoWidth === width && authHeight === height) return;

        this._lastAutoSize = [width, height];
        this.resize('SizeMonitor', {});
    }

    private resize(
        source: string,
        opts: { inWidth?: number; inHeight?: number; inMinWidth?: number; inMinHeight?: number }
    ) {
        const { scene, animationManager } = this.ctx;
        const { inWidth, inHeight, inMinWidth, inMinHeight } = opts;

        this.ctx.domManager.setSizeOptions(
            inMinWidth ?? this.minWidth,
            inMinHeight ?? this.minHeight,
            inWidth ?? this.width,
            inHeight ?? this.height
        );

        const width = inWidth ?? this.width ?? this._lastAutoSize?.[0];
        const height = inHeight ?? this.height ?? this._lastAutoSize?.[1];
        this.debug(`Chart.resize() from ${source}`, { width, height, stack: new Error().stack });
        if (width == null || height == null || !isFiniteNumber(width) || !isFiniteNumber(height)) return;

        if (scene.resize(width, height)) {
            this.resetPointer();
            animationManager.reset();

            let skipAnimations = true;
            if ((this.width == null || this.height == null) && this._firstAutoSize) {
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

            for (const {
                seriesId,
                symbols: [{ marker }],
                label,
            } of legendData) {
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
    private pickNode(
        point: Point,
        collection: {
            series: Series<SeriesNodeDatum, SeriesProperties<object[]>>;
            pickModes?: SeriesNodePickMode[];
            maxDistance?: number;
        }[]
    ): PickedNode | undefined {
        const start = performance.now();

        // Iterate through series in reverse, as later declared series appears on top of earlier
        // declared series.
        const reverseSeries = [...collection].reverse();

        let result: { series: Series<any, any>; datum: SeriesNodeDatum; distance: number } | undefined;
        for (const { series, pickModes, maxDistance } of reverseSeries) {
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

    private pickSeriesNode(point: Point, exactMatchOnly: boolean, maxDistance?: number): PickedNode | undefined {
        // Disable 'nearest match' options if looking for exact matches only
        const pickModes = exactMatchOnly ? [SeriesNodePickMode.EXACT_SHAPE_MATCH] : undefined;
        return this.pickNode(
            point,
            this.series.map((series) => {
                return { series, pickModes, maxDistance };
            })
        );
    }

    private pickTooltip(point: Point): PickedNode | undefined {
        return this.pickNode(
            point,
            this.series.map((series) => {
                const tooltipRange = series.properties.tooltip.range;
                let pickModes: SeriesNodePickMode[] | undefined;
                if (tooltipRange === 'exact') {
                    pickModes = [SeriesNodePickMode.EXACT_SHAPE_MATCH];
                } else {
                    pickModes = undefined;
                }

                const maxDistance = typeof tooltipRange === 'number' ? tooltipRange : undefined;
                return { series, pickModes, maxDistance };
            })
        );
    }

    private lastPick?: SeriesNodeDatum;

    protected onMouseMove(event: PointerInteractionEvent<'hover' | 'drag'>): void {
        this.lastInteractionEvent = event;
        this.pointerScheduler.schedule();

        this.extraDebugStats['mouseX'] = event.offsetX;
        this.extraDebugStats['mouseY'] = event.offsetY;
        this.update(ChartUpdateType.SCENE_RENDER);
    }

    protected onLeave(event: PointerInteractionEvent<'leave'>): void {
        const el = event.relatedElement;
        if (el && this.ctx.domManager.isManagedDOMElement(el)) return;

        this.resetPointer();
        this.update(ChartUpdateType.SCENE_RENDER);
        this.ctx.cursorManager.updateCursor('chart');
    }

    private onBrowserFocus(event: KeyNavEvent<'browserfocus'>): void {
        if (event.delta > 0) {
            this.focus.datum = undefined;
            this.focus.series = undefined;
            this.focus.datumIndex = 0;
            this.focus.seriesIndex = 0;
        } else {
            this.focus.datum = undefined;
            this.focus.series = undefined;
            this.focus.datumIndex = Infinity;
            this.focus.seriesIndex = Infinity;
        }
    }

    private onAnimationStart() {
        if (this.focus.hasFocus) {
            this.onBlur();
        }
    }

    private onBlur(): void {
        this.ctx.focusIndicator.updateBounds(undefined);
        this.resetPointer();
        this.focus.hasFocus = false;
        // Do not consume blur events to allow the browser-focus to leave the canvas element.
    }

    private onTab(event: KeyNavEvent<'tab'>): void {
        this.handleFocus(0, 0);
        event.preventDefault();
        this.focus.hasFocus = true;
    }

    private onNavVert(event: KeyNavEvent<'nav-vert'>): void {
        this.focus.seriesIndex += event.delta;
        this.handleFocus(event.delta, 0);
        event.preventDefault();
    }

    private onNavHori(event: KeyNavEvent<'nav-hori'>): void {
        this.focus.datumIndex += event.delta;
        this.handleFocus(0, event.delta);
        event.preventDefault();
    }

    private onSubmit(event: KeyNavEvent<'submit'>): void {
        const { series, datum } = this.focus;
        const sourceEvent = event.sourceEvent.sourceEvent;
        if (series !== undefined && datum !== undefined) {
            series.fireNodeClickEvent(sourceEvent, datum);
        } else {
            this.fireEvent<AgChartClickEvent>({
                type: 'click',
                event: sourceEvent,
            });
        }
        event.preventDefault();
    }

    private onContextMenu(event: PointerInteractionEvent<'contextmenu'>): void {
        this.ctx.tooltipManager.removeTooltip(this.id);

        // If there is already a context menu visible, then re-pick the highlighted node.
        // We check InteractionState.Default too just in case we were in ContextMenu and the
        // mouse hasn't moved since (see AG-10233).
        const { Default, ContextMenu } = InteractionState;

        let pickedNode: SeriesNodeDatum | undefined;
        if (this.ctx.interactionManager.getState() & (Default | ContextMenu)) {
            this.checkSeriesNodeRange(event, (_series, datum) => {
                this.ctx.highlightManager.updateHighlight(this.id);
                pickedNode = datum;
            });
        }

        this.ctx.contextMenuRegistry.dispatchContext('series', event, { pickedNode });
    }

    protected focus: ChartFocusData = {
        hasFocus: false,
        series: undefined,
        seriesIndex: 0,
        datumIndex: 0,
        datum: undefined,
    };

    private handleFocus(seriesIndexDelta: number, datumIndexDelta: number) {
        this.focus.hasFocus = true;
        const overlayFocus = this.overlays.getFocusInfo(this.ctx.localeManager);
        if (overlayFocus == null) {
            this.handleSeriesFocus(seriesIndexDelta, datumIndexDelta);
        } else {
            this.ctx.focusIndicator.updateBounds(overlayFocus.rect);
            this.ctx.ariaAnnouncementService.announceValue(overlayFocus.text);
        }
    }

    protected handleSeriesFocus(otherIndexDelta: number, datumIndexDelta: number) {
        const { series, seriesRect, focus } = this;
        const visibleSeries = series.filter((s) => s.visible);
        if (visibleSeries.length === 0) return;

        // Update focused series:
        focus.seriesIndex = clamp(0, focus.seriesIndex, visibleSeries.length - 1);
        focus.series = visibleSeries[focus.seriesIndex];

        // Update focused datum:
        const { datumIndex, seriesIndex: otherIndex } = focus;
        const pick = focus.series.pickFocus({ datumIndex, datumIndexDelta, otherIndex, otherIndexDelta, seriesRect });
        this.updatePickedFocus(pick);
    }

    protected updatePickedFocus(pick: PickFocusOutputs | undefined) {
        const { focus } = this;
        if (pick === undefined || focus.series === undefined) return;

        const { datum, datumIndex } = pick;
        focus.datumIndex = datumIndex;
        focus.datum = datum;

        // Update user interaction/interface:
        const keyboardEvent = makeKeyboardPointerEvent(this.ctx.focusIndicator, pick);
        if (keyboardEvent !== undefined) {
            this.lastInteractionEvent = keyboardEvent;
            const html = focus.series.getTooltipHtml(datum);
            const meta = TooltipManager.makeTooltipMeta(this.lastInteractionEvent, datum);
            const aria = this.getDatumAriaText(datum, html);
            this.ctx.highlightManager.updateHighlight(this.id, datum);
            this.ctx.tooltipManager.updateTooltip(this.id, meta, html);
            this.ctx.ariaAnnouncementService.announceValue('ariaAnnounceHoverDatum', { datum: aria });
        }
    }

    private lastInteractionEvent?: TooltipPointerEvent<'hover' | 'drag' | 'keyboard'>;
    private static isHoverEvent(
        event: TooltipPointerEvent<TooltipEventType> | undefined
    ): event is TooltipPointerEvent<'hover'> {
        return event !== undefined && event.type === 'hover';
    }
    private static isDragEvent(
        event: TooltipPointerEvent<TooltipEventType> | undefined
    ): event is TooltipPointerEvent<'drag'> {
        return event !== undefined && event.type === 'drag';
    }
    private readonly pointerScheduler = debouncedAnimationFrame(() => {
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
    protected handlePointer(event: TooltipPointerEvent<'hover' | 'drag' | 'keyboard'>, redisplay: boolean) {
        // Ignored "pointer event" that comes from a keyboard. We don't need to worry about finding out
        // which datum to use in the highlight & tooltip because the keyboard just navigates through the
        // data directly.
        const state = this.ctx.interactionManager.getState();
        if (
            (state !== InteractionState.Default && state !== InteractionState.Annotations) ||
            (!Chart.isHoverEvent(event) && !Chart.isDragEvent(event))
        ) {
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
        event: TooltipPointerEvent<'hover' | 'drag'>,
        disablePointer: (highlightOnly?: boolean) => void
    ) {
        const { lastPick } = this;
        const { offsetX, offsetY, targetElement } = event;

        if (
            targetElement &&
            this.tooltip.interactive &&
            this.ctx.domManager.isManagedChildDOMElement(targetElement, 'canvas-overlay', DEFAULT_TOOLTIP_CLASS)
        ) {
            // Skip tooltip update if tooltip is interactive, and the source event was for a tooltip HTML element.
            return;
        }

        const pick = this.pickTooltip({ x: offsetX, y: offsetY });
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

        const tooltipEnabled = this.tooltip.enabled && pick.series.tooltipEnabled;
        const shouldUpdateTooltip = tooltipEnabled && (!isNewDatum || html !== undefined);

        const meta = TooltipManager.makeTooltipMeta(event, pick.datum);

        if (shouldUpdateTooltip) {
            this.ctx.tooltipManager.updateTooltip(this.id, meta, html);
        }
    }

    protected handlePointerNode(event: PointerOffsetsAndHistory) {
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
            event.preventDefault();
            return;
        }
        this.fireEvent<AgChartClickEvent>({ type: 'click', event: event.sourceEvent });
    }

    protected onDoubleClick(event: PointerInteractionEvent<'dblclick'>) {
        if (this.checkSeriesNodeDoubleClick(event)) {
            this.update(ChartUpdateType.SERIES_UPDATE);
            event.preventDefault();
            return;
        }
        this.fireEvent<AgChartDoubleClickEvent>({ type: 'doubleClick', event: event.sourceEvent });
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
        event: PointerOffsetsAndHistory & { preventZoomDblClick?: boolean },
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
            // See: AG-11737#TC3, AG-11676
            //
            // The Zoom module's double-click handler resets the zoom, but only if there isn't an
            // exact match on a node. This is counter-intuitive, and there's no built-in mechanism
            // in the InteractionManager / RegionManager for the Zoom module to listen to non-exact
            // series-rect double-clicks. As a workaround, we'll set this boolean to tell the Zoom
            // double-click handler to ignore the event whenever we are double-clicking exactly on
            // a node.
            event.preventZoomDblClick = true;
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

    private readonly onSeriesNodeClick = (event: TypedEvent) => {
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

    private readonly onSeriesNodeDoubleClick = (event: TypedEvent) => {
        const seriesNodeDoubleClick = {
            ...event,
            type: 'seriesNodeDoubleClick',
        };
        this.fireEvent(seriesNodeDoubleClick);
    };

    private readonly seriesGroupingChanged = (event: TypedEvent) => {
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

    private readonly dataProcessListeners = new Set<(...args: any[]) => void>();
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

        if (deltaOptions == null) return;

        debug('Chart.applyOptions() - applying delta', deltaOptions);

        const completeOptions = mergeDefaults(deltaOptions, oldOpts);
        const modulesChanged = this.applyModules(completeOptions);

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
            'axes',
            'topology',
            'nodes',
            'initialState',
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

        this.ctx.domManager.addStyles('chart', styles);
        this.ctx.annotationManager.setAnnotationStyles(chartOptions.annotationThemes);

        forceNodeDataRefresh ||= this.shouldForceNodeDataRefresh(deltaOptions, seriesStatus);
        const majorChange = forceNodeDataRefresh || modulesChanged;
        const updateType = majorChange ? ChartUpdateType.FULL : ChartUpdateType.PERFORM_LAYOUT;
        this.maybeResetAnimations(seriesStatus);

        debug('Chart.applyOptions() - update type', ChartUpdateType[updateType], {
            seriesStatus,
            forceNodeDataRefresh,
        });
        this.update(updateType, { forceNodeDataRefresh, newAnimationBatch: true });
    }

    applyInitialState() {
        const {
            ctx: { annotationManager, stateManager },
        } = this;

        const options = this.getOptions();

        if (options.initialState?.annotations != null) {
            const annotations = options.initialState.annotations.map((annotation) => {
                const annotationTheme = annotationManager.getAnnotationTypeStyles(annotation.type);
                return mergeDefaults(annotation, annotationTheme);
            });

            stateManager.setState(annotationManager, annotations);
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
                horizontalAxis.interval.step = step;
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
            debug(`Chart.applySeries() - creating new series instances, status: ${matchResult.status}`, matchResult);
            chart.series = optSeries.map((opts) => this.createSeries(opts));
            return 'replaced';
        }

        debug(`Chart.applySeries() - matchResult`, matchResult);

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
                    debug(`Chart.applySeries() - created new series`, newSeries);
                    break;

                case 'remove':
                    debug(`Chart.applySeries() - removing series at previous idx ${change.idx}`, change.series);
                    break;

                case 'no-op':
                    seriesInstances.push(change.series);
                    debug(`Chart.applySeries() - no change to series at previous idx ${change.idx}`, change.series);
                    break;

                case 'series-grouping':
                case 'update':
                default:
                    const { series, diff, idx } = change;
                    debug(`Chart.applySeries() - applying series diff previous idx ${idx}`, diff, series);
                    this.applySeriesValues(series, diff);
                    series.markNodeDataDirty();
                    seriesInstances.push(series);
            }
        }
        // Ensure declaration order is set, this is used for correct z-index behavior for combo charts.
        for (let idx = 0; idx < seriesInstances.length; idx++) {
            seriesInstances[idx]._declarationOrder = idx;
        }

        debug(`Chart.applySeries() - final series instances`, seriesInstances);
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

                debug(`Chart.applyAxes() - applying axis diff idx ${index}`, axisDiff);

                const path = `axes[${index}]`;
                jsonApply(axis, axisDiff, { ...JSON_APPLY_PLUGINS, path, skip });
            });
            return true;
        }

        debug(`Chart.applyAxes() - creating new axes instances; seriesStatus: ${seriesStatus}`);
        chart.axes = this.createAxis(axes, skip);

        const axisGroups: { [Key in ChartAxisDirection]: Group[] } = {
            [ChartAxisDirection.X]: [],
            [ChartAxisDirection.Y]: [],
        };

        chart.axes.forEach((axis) => axisGroups[axis.direction].push(axis.getAxisGroup()));

        this.ctx.regionManager.updateRegion(REGIONS.HORIZONTAL_AXES, ...axisGroups[ChartAxisDirection.X]);
        this.ctx.regionManager.updateRegion(REGIONS.VERTICAL_AXES, ...axisGroups[ChartAxisDirection.Y]);

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
                if (module) {
                    const moduleOptions = seriesOptions[moduleDef.optionsKey];
                    delete seriesOptions[moduleDef.optionsKey];
                    module.properties.set(moduleOptions);
                }
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
        const newAxes: ChartAxis[] = [];
        const moduleContext = this.getModuleContext();

        for (let index = 0; index < options.length; index++) {
            const axisOptions = options[index];
            const axis = axisRegistry.create(axisOptions.type, moduleContext);
            this.applyAxisModules(axis, axisOptions);
            jsonApply(axis, axisOptions, { ...JSON_APPLY_PLUGINS, path: `axes[${index}]`, skip });

            newAxes.push(axis);
        }

        guessInvalidPositions(newAxes);

        return newAxes;
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
