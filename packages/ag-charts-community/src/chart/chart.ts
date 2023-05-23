import { Scene } from '../scene/scene';
import { Group } from '../scene/group';
import { Text } from '../scene/shape/text';
import { Series, SeriesNodeDatum, SeriesNodePickMode } from './series/series';
import { Padding } from '../util/padding';

import { BBox } from '../scene/bbox';
import { SizeMonitor } from '../util/sizeMonitor';
import { Caption } from '../caption';
import { Observable, TypedEvent } from '../util/observable';
import { ChartAxis } from './chartAxis';
import { ChartAxisDirection } from './chartAxisDirection';
import { createId } from '../util/id';
import { isPointLabelDatum, PlacedLabel, placeLabels, PointLabelDatum } from '../util/labelPlacement';
import { AgChartOptions, AgChartClickEvent, AgChartDoubleClickEvent, AgChartInstance } from './agChartOptions';
import { debouncedAnimationFrame, debouncedCallback } from '../util/render';
import { CartesianSeries } from './series/cartesian/cartesianSeries';
import { Point } from '../scene/point';
import { BOOLEAN, STRING_UNION, Validate } from '../util/validation';
import { sleep } from '../util/async';
import { Tooltip, TooltipMeta as PointerMeta } from './tooltip/tooltip';
import { ChartOverlays } from './overlay/chartOverlays';
import { jsonMerge } from '../util/json';
import { Layers } from './layers';
import { AnimationManager } from './interaction/animationManager';
import { CursorManager } from './interaction/cursorManager';
import { ChartEventManager } from './interaction/chartEventManager';
import { HighlightChangeEvent, HighlightManager } from './interaction/highlightManager';
import { InteractionEvent, InteractionManager } from './interaction/interactionManager';
import { TooltipManager } from './interaction/tooltipManager';
import { ZoomManager } from './interaction/zoomManager';
import { Module, ModuleContext, ModuleInstance, RootModule } from '../util/module';
import { LayoutService } from './layout/layoutService';
import { DataService } from './dataService';
import { UpdateService } from './updateService';
import { ChartUpdateType } from './chartUpdateType';
import { ChartLegendDatum, ChartLegend } from './legendDatum';
import { Logger } from '../util/logger';
import { ActionOnSet } from '../util/proxy';
import { ChartHighlight } from './chartHighlight';
import { getLegend } from './factory/legendTypes';

type OptionalHTMLElement = HTMLElement | undefined | null;

export type TransferableResources = { container?: OptionalHTMLElement; scene: Scene; element: HTMLElement };

type PickedNode = {
    series: Series<any>;
    datum: SeriesNodeDatum;
    distance: number;
};

export abstract class Chart extends Observable implements AgChartInstance {
    readonly id = createId(this);

    processedOptions: AgChartOptions = {};
    userOptions: AgChartOptions = {};
    queuedUserOptions: AgChartOptions[] = [];

    getOptions() {
        const { queuedUserOptions } = this;
        const lastUpdateOptions = queuedUserOptions[queuedUserOptions.length - 1] ?? this.userOptions;
        return jsonMerge([lastUpdateOptions]);
    }

    readonly scene: Scene;
    readonly seriesRoot = new Group({ name: `${this.id}-Series-root` });
    legend: ChartLegend | undefined;
    readonly tooltip: Tooltip;
    readonly overlays: ChartOverlays;
    readonly highlight: ChartHighlight;

    @ActionOnSet<Chart>({
        newValue(value) {
            this.scene.debug.consoleLog = value;
        },
    })
    public debug;

    private extraDebugStats: Record<string, number> = {};

    private _container: OptionalHTMLElement = undefined;
    set container(value: OptionalHTMLElement) {
        if (this._container !== value) {
            const { parentNode } = this.element;

            if (parentNode != null) {
                parentNode.removeChild(this.element);
            }

            if (value && !this.destroyed) {
                value.appendChild(this.element);
            }

            this._container = value;
        }
    }
    get container(): OptionalHTMLElement {
        return this._container;
    }

    @ActionOnSet<Chart>({
        newValue(value) {
            this.series?.forEach((series) => (series.data = value));
        },
    })
    public data: any = [];

    @ActionOnSet<Chart>({
        newValue(value) {
            this.resize(value);
        },
    })
    width?: number;

    @ActionOnSet<Chart>({
        newValue(value) {
            this.resize(undefined, value);
        },
    })
    height?: number;

    @ActionOnSet<Chart>({
        changeValue(value) {
            this.autoSizeChanged(value);
        },
    })
    @Validate(BOOLEAN)
    public autoSize;
    private _lastAutoSize?: [number, number];

    private autoSizeChanged(value: boolean) {
        const { style } = this.element;
        if (value) {
            style.display = 'block';
            style.width = '100%';
            style.height = '100%';

            if (!this._lastAutoSize) {
                return;
            }
            this.resize();
        } else {
            style.display = 'inline-block';
            style.width = 'auto';
            style.height = 'auto';
        }
    }

    download(fileName?: string, fileFormat?: string) {
        this.scene.download(fileName, fileFormat);
    }

    padding = new Padding(20);

    seriesAreaPadding = new Padding(0);

    @ActionOnSet<Chart>({
        newValue(value) {
            this.scene.root?.appendChild(value.node);
        },
        oldValue(oldValue) {
            this.scene.root?.removeChild(oldValue.node);
        },
    })
    public title?: Caption = undefined;

    @ActionOnSet<Chart>({
        newValue(value) {
            this.scene.root?.appendChild(value.node);
        },
        oldValue(oldValue) {
            this.scene.root?.removeChild(oldValue.node);
        },
    })
    public subtitle?: Caption = undefined;

    @ActionOnSet<Chart>({
        newValue(value) {
            this.scene.root?.appendChild(value.node);
        },
        oldValue(oldValue) {
            this.scene.root?.removeChild(oldValue.node);
        },
    })
    public footnote?: Caption = undefined;

    @Validate(STRING_UNION('standalone', 'integrated'))
    mode: 'standalone' | 'integrated' = 'standalone';

    private _destroyed: boolean = false;
    get destroyed() {
        return this._destroyed;
    }

    protected readonly animationManager: AnimationManager;
    protected readonly chartEventManager: ChartEventManager;
    protected readonly cursorManager: CursorManager;
    protected readonly highlightManager: HighlightManager;
    protected readonly interactionManager: InteractionManager;
    protected readonly tooltipManager: TooltipManager;
    protected readonly zoomManager: ZoomManager;
    protected readonly layoutService: LayoutService;
    protected readonly updateService: UpdateService;
    protected readonly dataService: DataService;
    protected readonly axisGroup: Group;
    protected readonly modules: Record<string, { instance: ModuleInstance }> = {};
    protected readonly legendModules: Record<string, { instance: ModuleInstance }> = {};
    private legendType: string | undefined;

    protected constructor(
        document = window.document,
        overrideDevicePixelRatio?: number,
        resources?: TransferableResources
    ) {
        super();

        const scene = resources?.scene;
        const element = resources?.element ?? document.createElement('div');
        const container = resources?.container;

        const root = new Group({ name: 'root' });
        // Prevent the scene from rendering chart components in an invalid state
        // (before first layout is performed).
        root.visible = false;
        root.append(this.seriesRoot);

        this.axisGroup = new Group({ name: 'Axes', layer: true, zIndex: Layers.AXIS_ZINDEX });
        root.appendChild(this.axisGroup);

        this.element = element;
        element.classList.add('ag-chart-wrapper');
        element.style.position = 'relative';

        this.scene = scene ?? new Scene({ document, overrideDevicePixelRatio });
        this.debug = false;
        this.scene.debug.consoleLog = false;
        this.scene.root = root;
        this.scene.container = element;
        this.autoSize = true;

        this.chartEventManager = new ChartEventManager();
        this.cursorManager = new CursorManager(element);
        this.highlightManager = new HighlightManager();
        this.interactionManager = new InteractionManager(element);
        this.zoomManager = new ZoomManager();
        this.dataService = new DataService(() => this.series);
        this.layoutService = new LayoutService();
        this.updateService = new UpdateService((type = ChartUpdateType.FULL, { forceNodeDataRefresh }) =>
            this.update(type, { forceNodeDataRefresh })
        );

        this.animationManager = new AnimationManager(this.interactionManager);
        this.animationManager.skipAnimations = true;
        this.animationManager.play();

        SizeMonitor.observe(this.element, (size) => {
            const { width, height } = size;

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
            this.resize();
        });
        this.layoutService.addListener('start-layout', (e) => this.positionPadding(e.shrinkRect));
        this.layoutService.addListener('start-layout', (e) => this.positionCaptions(e.shrinkRect));

        this.tooltip = new Tooltip(this.scene.canvas.element, document, document.body);
        this.tooltipManager = new TooltipManager(this.tooltip, this.interactionManager);
        this.attachLegend('category');
        this.overlays = new ChartOverlays(this.element);
        this.highlight = new ChartHighlight();
        this.container = container;

        // Add interaction listeners last so child components are registered first.
        this.interactionManager.addListener('click', (event) => this.onClick(event));
        this.interactionManager.addListener('dblclick', (event) => this.onDoubleClick(event));
        this.interactionManager.addListener('hover', (event) => this.onMouseMove(event));
        this.interactionManager.addListener('leave', (event) => this.onLeave(event));
        this.interactionManager.addListener('page-left', () => this.destroy());
        this.interactionManager.addListener('wheel', () => this.disablePointer());

        this.animationManager.addListener('animation-frame', (_) => {
            this.update(ChartUpdateType.SCENE_RENDER);
        });
        this.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event));
        this.zoomManager.addListener('zoom-change', (_) =>
            this.update(ChartUpdateType.PROCESS_DATA, { forceNodeDataRefresh: true })
        );
    }

    addModule(module: RootModule) {
        if (this.modules[module.optionsKey] != null) {
            throw new Error('AG Charts - module already initialised: ' + module.optionsKey);
        }

        const moduleInstance = new module.instanceConstructor(this.getModuleContext());
        this.modules[module.optionsKey] = { instance: moduleInstance };

        (this as any)[module.optionsKey] = moduleInstance;
    }

    removeModule(module: RootModule) {
        this.modules[module.optionsKey]?.instance?.destroy();
        delete this.modules[module.optionsKey];
        delete (this as any)[module.optionsKey];
    }

    isModuleEnabled(module: Module) {
        return this.modules[module.optionsKey] != null;
    }

    getModuleContext(): ModuleContext {
        const {
            scene,
            animationManager,
            chartEventManager,
            cursorManager,
            highlightManager,
            interactionManager,
            tooltipManager,
            zoomManager,
            dataService,
            layoutService,
            updateService,
            mode,
        } = this;
        return {
            scene,
            animationManager,
            chartEventManager,
            cursorManager,
            highlightManager,
            interactionManager,
            tooltipManager,
            zoomManager,
            dataService,
            layoutService,
            updateService,
            mode,
        };
    }

    destroy(opts?: { keepTransferableResources: boolean }): TransferableResources | undefined {
        if (this._destroyed) {
            return;
        }

        const keepTransferableResources = opts?.keepTransferableResources;
        let result: TransferableResources | undefined = undefined;

        this._performUpdateType = ChartUpdateType.NONE;
        this._pendingFactoryUpdates.splice(0);

        this.tooltipManager.destroy();
        this.tooltip.destroy();
        this.legend?.destroy();
        SizeMonitor.unobserve(this.element);

        for (const [key, module] of Object.entries(this.modules)) {
            module.instance.destroy();
            delete this.modules[key];
            delete (this as any)[key];
        }

        this.interactionManager.destroy();

        if (keepTransferableResources) {
            this.scene.strip();
            result = { container: this.container, scene: this.scene, element: this.element };
        } else {
            this.scene.destroy();
            this.container = undefined;
        }

        this.series.forEach((s) => s.destroy());
        this.series = [];

        this.axes.forEach((a) => a.destroy());
        this.axes = [];

        this._destroyed = true;

        return result;
    }

    log(opts: any) {
        if (this.debug) {
            Logger.debug(opts);
        }
    }

    disablePointer(highlightOnly = false) {
        if (!highlightOnly) {
            this.tooltipManager.removeTooltip(this.id);
        }
        this.highlightManager.updateHighlight(this.id);
        if (this.lastInteractionEvent) {
            this.lastInteractionEvent = undefined;
        }
    }

    private _pendingFactoryUpdates: (() => Promise<void>)[] = [];

    requestFactoryUpdate(cb: () => Promise<void>) {
        const callbacks = this._pendingFactoryUpdates;
        const count = callbacks.length;
        if (count === 0) {
            callbacks.push(cb);
            this._processCallbacks().catch((e) => Logger.errorOnce(e));
        } else {
            // Factory callback process already running, the callback will be invoked asynchronously.
            // Clear the queue after the first callback to prevent unnecessary re-renderings.
            callbacks.splice(1, count - 1, cb);
        }
    }

    private async _processCallbacks() {
        const callbacks = this._pendingFactoryUpdates;
        while (callbacks.length > 0) {
            if (this.updatePending) {
                await sleep(1);
                continue; // Make sure to check queue has an item before continuing.
            }
            try {
                await callbacks[0]();
            } catch (e) {
                Logger.error('update error', e);
            }

            callbacks.shift();
        }
    }

    private _performUpdateNoRenderCount = 0;
    private _performUpdateType: ChartUpdateType = ChartUpdateType.NONE;
    get performUpdateType() {
        return this._performUpdateType;
    }
    get updatePending(): boolean {
        return this._performUpdateType !== ChartUpdateType.NONE || this.lastInteractionEvent != null;
    }
    private _lastPerformUpdateError?: Error;
    get lastPerformUpdateError() {
        return this._lastPerformUpdateError;
    }

    private seriesToUpdate: Set<Series> = new Set();
    private performUpdateTrigger = debouncedCallback(async ({ count }) => {
        if (this._destroyed) return;

        try {
            await this.performUpdate(count);
        } catch (error) {
            this._lastPerformUpdateError = error as Error;
            Logger.error('update error', error);
        }
    });
    public async awaitUpdateCompletion() {
        await this.performUpdateTrigger.await();
    }
    public update(
        type = ChartUpdateType.FULL,
        opts?: { forceNodeDataRefresh?: boolean; seriesToUpdate?: Iterable<Series> }
    ) {
        const { forceNodeDataRefresh = false, seriesToUpdate = this.series } = opts ?? {};

        if (forceNodeDataRefresh) {
            this.series.forEach((series) => series.markNodeDataDirty());
        }

        for (const series of seriesToUpdate) {
            this.seriesToUpdate.add(series);
        }

        if (type < this._performUpdateType) {
            this._performUpdateType = type;
            this.performUpdateTrigger.schedule();
        }
    }
    private async performUpdate(count: number) {
        const { _performUpdateType: performUpdateType, extraDebugStats } = this;
        const splits = [performance.now()];

        switch (performUpdateType) {
            case ChartUpdateType.FULL:
            case ChartUpdateType.PROCESS_DATA:
                await this.processData();
                this.disablePointer(true);
                splits.push(performance.now());
            // eslint-disable-next-line no-fallthrough
            case ChartUpdateType.PERFORM_LAYOUT:
                if (this.autoSize && !this._lastAutoSize) {
                    const count = this._performUpdateNoRenderCount++;

                    if (count < 5) {
                        // Reschedule if canvas size hasn't been set yet to avoid a race.
                        this._performUpdateType = ChartUpdateType.PERFORM_LAYOUT;
                        this.performUpdateTrigger.schedule();
                        break;
                    }

                    // After several failed passes, continue and accept there maybe a redundant
                    // render. Sometimes this case happens when we already have the correct
                    // width/height, and we end up never rendering the chart in that scenario.
                }
                this._performUpdateNoRenderCount = 0;

                await this.performLayout();
                this.handleOverlays();
                splits.push(performance.now());

            // eslint-disable-next-line no-fallthrough
            case ChartUpdateType.SERIES_UPDATE:
                const { seriesRect } = this;
                const seriesUpdates = [...this.seriesToUpdate].map((series) => series.update({ seriesRect }));
                this.seriesToUpdate.clear();
                await Promise.all(seriesUpdates);

                splits.push(performance.now());
            // eslint-disable-next-line no-fallthrough
            case ChartUpdateType.TOOLTIP_RECALCULATION:
                const tooltipMeta = this.tooltipManager.getTooltipMeta(this.id);
                if (performUpdateType < ChartUpdateType.SERIES_UPDATE && tooltipMeta?.event?.type === 'hover') {
                    this.handlePointer(tooltipMeta.event as InteractionEvent<'hover'>);
                }

            // eslint-disable-next-line no-fallthrough
            case ChartUpdateType.SCENE_RENDER:
                await this.scene.render({ debugSplitTimes: splits, extraDebugStats });
                this.extraDebugStats = {};
            // eslint-disable-next-line no-fallthrough
            case ChartUpdateType.NONE:
                // Do nothing.
                this._performUpdateType = ChartUpdateType.NONE;
        }

        const end = performance.now();
        this.log({
            chart: this,
            durationMs: Math.round((end - splits[0]) * 100) / 100,
            count,
            performUpdateType: ChartUpdateType[performUpdateType],
        });
    }

    readonly element: HTMLElement;

    protected _axes: ChartAxis[] = [];
    set axes(values: ChartAxis[]) {
        const removedAxes = new Set<ChartAxis>();
        this._axes.forEach((axis) => {
            axis.detachAxis(this.axisGroup);
            removedAxes.add(axis);
        });
        // make linked axes go after the regular ones (simulates stable sort by `linkedTo` property)
        this._axes = values.filter((a) => !a.linkedTo).concat(values.filter((a) => a.linkedTo));
        this._axes.forEach((axis) => {
            axis.attachAxis(this.axisGroup);
            removedAxes.delete(axis);
        });

        removedAxes.forEach((axis) => axis.destroy());
    }
    get axes(): ChartAxis[] {
        return this._axes;
    }

    protected _series: Series[] = [];
    set series(values: Series[]) {
        this.removeAllSeries();
        values.forEach((series) => this.addSeries(series));
    }
    get series(): Series[] {
        return this._series;
    }

    addSeries(series: Series<any>, before?: Series<any>): boolean {
        const { series: allSeries, seriesRoot } = this;
        const canAdd = allSeries.indexOf(series) < 0;

        if (canAdd) {
            const beforeIndex = before ? allSeries.indexOf(before) : -1;

            if (beforeIndex >= 0) {
                allSeries.splice(beforeIndex, 0, series);
                seriesRoot.insertBefore(series.rootGroup, before!.rootGroup);
            } else {
                allSeries.push(series);
                seriesRoot.append(series.rootGroup);
            }
            this.initSeries(series);

            return true;
        }

        return false;
    }

    protected initSeries(series: Series<any>) {
        series.chart = this;
        series.highlightManager = this.highlightManager;
        series.animationManager = this.animationManager;
        if (!series.data) {
            series.data = this.data;
        }
        this.addSeriesListeners(series);

        series.chartEventManager = this.chartEventManager;
        series.addChartEventListeners();
    }

    protected freeSeries(series: Series<any>) {
        series.chart = undefined;
        series.removeEventListener('nodeClick', this.onSeriesNodeClick);
        series.removeEventListener('nodeDoubleClick', this.onSeriesNodeDoubleClick);
    }

    removeAllSeries(): void {
        this.series.forEach((series) => {
            this.freeSeries(series);
            this.seriesRoot.removeChild(series.rootGroup);
        });
        this._series = []; // using `_series` instead of `series` to prevent infinite recursion
    }

    protected addSeriesListeners(series: Series<any>) {
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
                const seriesAxis = axis.direction === ChartAxisDirection.X ? s.xAxis : s.yAxis;
                return seriesAxis === axis;
            });
        });
    }

    protected assignAxesToSeries(force: boolean = false) {
        // This method has to run before `assignSeriesToAxes`.
        const directionToAxesMap: { [key in ChartAxisDirection]?: ChartAxis[] } = {};

        this.axes.forEach((axis) => {
            const direction = axis.direction;
            const directionAxes = (directionToAxesMap[direction] ??= []);
            directionAxes.push(axis);
        });

        this.series.forEach((series) => {
            series.directions.forEach((direction) => {
                const currentAxis = direction === ChartAxisDirection.X ? series.xAxis : series.yAxis;
                if (currentAxis && !force) {
                    return;
                }

                const directionAxes = directionToAxesMap[direction];
                if (!directionAxes) {
                    Logger.warn(`no available axis for direction [${direction}]; check series and axes configuration.`);
                    return;
                }

                const seriesKeys = series.getKeys(direction);
                const newAxis = this.findMatchingAxis(directionAxes, series.getKeys(direction));
                if (!newAxis) {
                    Logger.warn(
                        `no matching axis for direction [${direction}] and keys [${seriesKeys}]; check series and axes configuration.`
                    );
                    return;
                }

                if (direction === ChartAxisDirection.X) {
                    series.xAxis = newAxis;
                } else {
                    series.yAxis = newAxis;
                }
            });
        });
    }

    private findMatchingAxis(directionAxes: ChartAxis[], directionKeys?: string[]): ChartAxis | undefined {
        for (const axis of directionAxes) {
            const axisKeys = axis.keys;

            if (!axisKeys.length) {
                return axis;
            }

            if (!directionKeys) {
                continue;
            }

            for (const directionKey of directionKeys) {
                if (axisKeys.indexOf(directionKey) >= 0) {
                    return axis;
                }
            }
        }
    }

    private resize(width?: number, height?: number) {
        width ??= this.width ?? (this.autoSize ? this._lastAutoSize?.[0] : this.scene.canvas.width);
        height ??= this.height ?? (this.autoSize ? this._lastAutoSize?.[1] : this.scene.canvas.height);
        if (!width || !height || !Number.isFinite(width) || !Number.isFinite(height)) return;

        if (this.scene.resize(width, height)) {
            this.disablePointer();
            this.update(ChartUpdateType.PERFORM_LAYOUT, { forceNodeDataRefresh: true });
        }
    }

    async processData() {
        if (this.axes.length > 0 || this.series.some((s) => s instanceof CartesianSeries)) {
            this.assignAxesToSeries(true);
            this.assignSeriesToAxes();
        }

        await Promise.all(this.series.map((s) => s.processData()));
        await this.updateLegend();
    }

    placeLabels(): Map<Series<any>, PlacedLabel[]> {
        const visibleSeries: Series[] = [];
        const data: (readonly PointLabelDatum[])[] = [];
        for (const series of this.series) {
            if (!series.visible) {
                continue;
            }

            const labelData: PointLabelDatum[] = series.getLabelData();

            if (!(labelData && isPointLabelDatum(labelData[0]))) {
                continue;
            }

            data.push(labelData);

            visibleSeries.push(series);
        }

        const { seriesRect } = this;
        const labels: PlacedLabel[][] =
            seriesRect && data.length > 0
                ? placeLabels(data, { x: 0, y: 0, width: seriesRect.width, height: seriesRect.height })
                : [];
        return new Map(labels.map((l, i) => [visibleSeries[i], l]));
    }

    private attachLegend(legendType: string) {
        if (this.legendType === legendType) {
            return;
        }

        this.legend?.destroy();
        this.legend = undefined;

        const ctx = this.getModuleContext();
        this.legend = getLegend(legendType, ctx);
        this.legend.attachLegend(this.scene.root);
        this.legendType = legendType;
    }

    private applyLegendOptions?: (legend: ChartLegend) => void = undefined;

    setLegendInit(initLegend: (legend: ChartLegend) => void) {
        this.applyLegendOptions = initLegend;
    }

    private async updateLegend() {
        const legendData: ChartLegendDatum[] = [];
        this.series
            .filter((s) => s.showInLegend)
            .forEach((series) => {
                const data = series.getLegendData();
                legendData.push(...data);
            });
        const legendType = legendData.length > 0 ? legendData[0].legendType : 'category';
        this.attachLegend(legendType);
        this.applyLegendOptions?.(this.legend!);

        this.legend!.data = legendData;
    }

    protected async performLayout() {
        this.scene.root!.visible = true;

        const {
            scene: { width, height },
        } = this;

        let shrinkRect = new BBox(0, 0, width, height);
        ({ shrinkRect } = this.layoutService.dispatchPerformLayout('start-layout', { shrinkRect }));
        ({ shrinkRect } = this.layoutService.dispatchPerformLayout('before-series', { shrinkRect }));

        return shrinkRect;
    }

    private positionPadding(shrinkRect: BBox) {
        const { padding } = this;

        shrinkRect.shrink(padding.left, 'left');
        shrinkRect.shrink(padding.top, 'top');
        shrinkRect.shrink(padding.right, 'right');
        shrinkRect.shrink(padding.bottom, 'bottom');

        return { shrinkRect };
    }

    private positionCaptions(shrinkRect: BBox) {
        const { title, subtitle, footnote } = this;
        const newShrinkRect = shrinkRect.clone();

        const updateCaption = (caption: Caption) => {
            const defaultCaptionHeight = shrinkRect.height / 10;
            const captionLineHeight = caption.lineHeight ?? caption.fontSize * Text.defaultLineHeightRatio;
            const maxWidth = shrinkRect.width;
            const maxHeight = Math.max(captionLineHeight, defaultCaptionHeight);
            caption.computeTextWrap(maxWidth, maxHeight);
        };

        const positionTopAndShrinkBBox = (caption: Caption) => {
            const baseY = newShrinkRect.y;
            caption.node.x = newShrinkRect.x + newShrinkRect.width / 2;
            caption.node.y = baseY;
            caption.node.textBaseline = 'top';
            updateCaption(caption);
            const bbox = caption.node.computeBBox();

            // As the bbox (x,y) ends up at a different location than specified above, we need to
            // take it into consideration when calculating how much space needs to be reserved to
            // accommodate the caption.
            const bboxHeight = Math.ceil(bbox.y - baseY + bbox.height + (caption.spacing ?? 0));

            newShrinkRect.shrink(bboxHeight, 'top');
        };
        const positionBottomAndShrinkBBox = (caption: Caption) => {
            const baseY = newShrinkRect.y + newShrinkRect.height;
            caption.node.x = newShrinkRect.x + newShrinkRect.width / 2;
            caption.node.y = baseY;
            caption.node.textBaseline = 'bottom';
            updateCaption(caption);
            const bbox = caption.node.computeBBox();

            const bboxHeight = Math.ceil(baseY - bbox.y + (caption.spacing ?? 0));

            newShrinkRect.shrink(bboxHeight, 'bottom');
        };

        if (title) {
            title.node.visible = title.enabled;
            if (title.node.visible) {
                positionTopAndShrinkBBox(title);
            }
        }

        if (subtitle) {
            subtitle.node.visible = (title?.enabled && subtitle.enabled) ?? false;
            if (subtitle.node.visible) {
                positionTopAndShrinkBBox(subtitle);
            }
        }

        if (footnote) {
            footnote.node.visible = footnote.enabled;
            if (footnote.node.visible) {
                positionBottomAndShrinkBBox(footnote);
            }
        }

        return { shrinkRect: newShrinkRect };
    }

    protected hoverRect?: BBox;

    // Should be available after the first layout.
    protected seriesRect?: BBox;
    getSeriesRect(): Readonly<BBox | undefined> {
        return this.seriesRect;
    }

    // x/y are local canvas coordinates in CSS pixels, not actual pixels
    private pickSeriesNode(point: Point, exactMatchOnly: boolean, maxDistance?: number): PickedNode | undefined {
        const start = performance.now();

        // Disable 'nearest match' options if looking for exact matches only
        const pickModes = exactMatchOnly ? [SeriesNodePickMode.EXACT_SHAPE_MATCH] : undefined;

        // Iterate through series in reverse, as later declared series appears on top of earlier
        // declared series.
        const reverseSeries = [...this.series].reverse();

        let result: { series: Series<any>; datum: SeriesNodeDatum; distance: number } | undefined = undefined;
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
        if (this.tooltip.pointerLeftOntoTooltip(event)) {
            return;
        }

        this.disablePointer();
    }

    private lastInteractionEvent?: InteractionEvent<'hover'> = undefined;
    private pointerScheduler = debouncedAnimationFrame(() => {
        if (this.lastInteractionEvent) {
            this.handlePointer(this.lastInteractionEvent);
        }
        this.lastInteractionEvent = undefined;
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
        const { pageX, pageY, offsetX, offsetY } = event;

        let pixelRange;
        if (typeof range === 'number' && Number.isFinite(range)) {
            pixelRange = range;
        }
        const pick = this.pickSeriesNode({ x: offsetX, y: offsetY }, range === 'exact', pixelRange);

        if (!pick) {
            this.tooltipManager.updateTooltip(this.id);
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
        const tooltipEnabled = this.tooltip.enabled && pick.series.tooltip.enabled;
        const exactlyMatched = range === 'exact' && pick.distance === 0;
        const rangeMatched = range === 'nearest' || isPixelRange || exactlyMatched;
        const shouldUpdateTooltip = tooltipEnabled && rangeMatched && (!isNewDatum || html !== undefined);

        const position = {
            xOffset: pick.datum.series.tooltip.position.xOffset,
            yOffset: pick.datum.series.tooltip.position.yOffset,
        };

        const meta = this.mergePointerDatum(
            { pageX, pageY, offsetX, offsetY, event: event, showArrow: pick.series.tooltip.showArrow, position },
            pick.datum
        );
        meta.enableInteraction = pick.series.tooltip.interaction?.enabled ?? false;

        if (shouldUpdateTooltip) {
            this.tooltipManager.updateTooltip(this.id, meta, html);
        }
    }

    protected handlePointerNode(event: InteractionEvent<'hover'>) {
        const found = this.checkSeriesNodeRange(event, (series: Series, datum: any) => {
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
        return this.checkSeriesNodeRange(event, (series: Series, datum: any) =>
            series.fireNodeClickEvent(event.sourceEvent, datum)
        );
    }

    private checkSeriesNodeDoubleClick(event: InteractionEvent<'dblclick'>): boolean {
        return this.checkSeriesNodeRange(event, (series: Series, datum: any) =>
            series.fireNodeDoubleClickEvent(event.sourceEvent, datum)
        );
    }

    private checkSeriesNodeRange(
        event: InteractionEvent<'click' | 'dblclick' | 'hover'>,
        callback: (series: Series, datum: any) => void
    ): boolean {
        const nearestNode = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY }, false);

        const datum = nearestNode?.datum;
        const nodeClickRange = datum?.series.nodeClickRange;

        // First check if we should trigger the callback based on nearest node
        if (datum && nodeClickRange === 'nearest') {
            callback(datum.series, datum);
            return true;
        }

        // Then check for an exact match or within the given range
        let pixelRange;
        if (typeof nodeClickRange === 'number' && Number.isFinite(nodeClickRange)) {
            pixelRange = nodeClickRange;
        }

        const pick = this.pickSeriesNode(
            { x: event.offsetX, y: event.offsetY },
            nodeClickRange === 'exact',
            pixelRange
        );

        if (!pick) return false;

        // Then if we've picked a node within the pixel range, or exactly, trigger the callback
        const isPixelRange = pixelRange != null;
        const exactlyMatched = nodeClickRange === 'exact' && pick.distance === 0;

        if (isPixelRange || exactlyMatched) {
            callback(pick.series, pick.datum);
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

    private mergePointerDatum(meta: PointerMeta, datum: SeriesNodeDatum): PointerMeta {
        const { type } = datum.series.tooltip.position;

        if (type === 'node' && datum.nodeMidPoint) {
            const { x, y } = datum.nodeMidPoint;
            const { canvas } = this.scene;
            const point = datum.series.rootGroup.inverseTransformPoint(x, y);
            const canvasRect = canvas.element.getBoundingClientRect();
            return {
                ...meta,
                pageX: Math.round(canvasRect.left + window.scrollX + point.x),
                pageY: Math.round(canvasRect.top + window.scrollY + point.y),
                offsetX: Math.round(point.x),
                offsetY: Math.round(point.y),
            };
        }

        return meta;
    }

    changeHighlightDatum(event: HighlightChangeEvent) {
        const seriesToUpdate: Set<Series> = new Set<Series>();
        const { series: newSeries = undefined, datum: newDatum } = event.currentHighlight ?? {};
        const { series: lastSeries = undefined, datum: lastDatum } = event.previousHighlight ?? {};

        if (lastSeries) {
            seriesToUpdate.add(lastSeries);
        }

        if (newSeries) {
            seriesToUpdate.add(newSeries);
        }

        // Adjust cursor if a specific datum is highlighted, rather than just a series.
        if (lastSeries?.cursor && lastDatum) {
            this.cursorManager.updateCursor(lastSeries.id);
        }
        if (newSeries?.cursor && newDatum) {
            this.cursorManager.updateCursor(newSeries.id, newSeries.cursor);
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

        while (this._pendingFactoryUpdates.length > 0 || this.updatePending) {
            if (performance.now() - start > timeoutMs) {
                throw new Error('waitForUpdate() timeout reached.');
            }
            await sleep(5);
        }
        await this.awaitUpdateCompletion();
    }

    protected handleOverlays() {
        this.handleNoDataOverlay();
    }

    protected handleNoDataOverlay() {
        const shouldDisplayNoDataOverlay = !this.series.some((s) => s.hasData());
        const rect = this.getSeriesRect();

        if (shouldDisplayNoDataOverlay && rect) {
            this.overlays.noData.show(rect);
        } else {
            this.overlays.noData.hide();
        }
    }
}
