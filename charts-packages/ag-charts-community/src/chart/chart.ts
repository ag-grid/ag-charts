import { Scene } from '../scene/scene';
import { Group } from '../scene/group';
import { Series, SeriesNodeDatum, SeriesNodePickMode } from './series/series';
import { Padding } from '../util/padding';
import { Background } from './background';
import { Legend, LegendDatum } from './legend';
import { BBox } from '../scene/bbox';
import { SizeMonitor } from '../util/sizeMonitor';
import { Caption } from '../caption';
import { Observable, SourceEvent } from '../util/observable';
import { ChartAxis, ChartAxisDirection } from './chartAxis';
import { createId } from '../util/id';
import { isPointLabelDatum, PlacedLabel, placeLabels, PointLabelDatum } from '../util/labelPlacement';
import { AgChartOptions, AgChartClickEvent, AgChartInstance } from './agChartOptions';
import { debouncedAnimationFrame, debouncedCallback } from '../util/render';
import { CartesianSeries } from './series/cartesian/cartesianSeries';
import { Point } from '../scene/point';
import { BOOLEAN, Validate } from '../util/validation';
import { sleep } from '../util/async';
import { doOnce } from '../util/function';
import { Tooltip, TooltipMeta as PointerMeta } from './tooltip/tooltip';
import { InteractionEvent, InteractionManager } from './interaction/interactionManager';
import { jsonMerge } from '../util/json';
import { ClipRect } from '../scene/clipRect';
import { Layers } from './layers';
import { CursorManager } from './interaction/cursorManager';
import { HighlightChangeEvent, HighlightManager } from './interaction/highlightManager';

/** Types of chart-update, in pipeline execution order. */
export enum ChartUpdateType {
    FULL,
    PROCESS_DATA,
    PERFORM_LAYOUT,
    SERIES_UPDATE,
    SCENE_RENDER,
    NONE,
}

type OptionalHTMLElement = HTMLElement | undefined | null;

export type TransferableResources = { container?: OptionalHTMLElement; scene: Scene; element: HTMLElement };

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
    readonly seriesRoot = new ClipRect();
    readonly background: Background = new Background();
    readonly legend: Legend;
    readonly tooltip: Tooltip;

    protected legendAutoPadding = new Padding();

    private _debug = false;
    set debug(value: boolean) {
        this._debug = value;
        this.scene.debug.consoleLog = value;
    }
    get debug() {
        return this._debug;
    }

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

    protected _data: any = [];
    set data(data: any) {
        this._data = data;
        this.series.forEach((series) => (series.data = data));
    }
    get data(): any {
        return this._data;
    }

    set width(value: number) {
        this.autoSize = false;
        if (this.width !== value) {
            this.resize(value, this.height);
        }
    }
    get width(): number {
        return this.scene.width;
    }

    set height(value: number) {
        this.autoSize = false;
        if (this.height !== value) {
            this.resize(this.width, value);
        }
    }
    get height(): number {
        return this.scene.height;
    }

    private _lastAutoSize?: [number, number];
    @Validate(BOOLEAN)
    protected _autoSize = false;
    set autoSize(value: boolean) {
        if (this._autoSize === value) {
            return;
        }

        this._autoSize = value;

        const { style } = this.element;
        if (value) {
            style.display = 'block';
            style.width = '100%';
            style.height = '100%';

            if (!this._lastAutoSize) {
                return;
            }
            this.resize(this._lastAutoSize[0], this._lastAutoSize[1]);
        } else {
            style.display = 'inline-block';
            style.width = 'auto';
            style.height = 'auto';
        }
    }
    get autoSize(): boolean {
        return this._autoSize;
    }

    download(fileName?: string, fileFormat?: string) {
        this.scene.download(fileName, fileFormat);
    }

    padding = new Padding(20);

    _title?: Caption = undefined;
    set title(caption: Caption | undefined) {
        const { root } = this.scene;
        if (this._title != null) {
            root?.removeChild(this._title.node);
        }
        this._title = caption;
        if (this._title != null) {
            root?.appendChild(this._title.node);
        }
    }
    get title() {
        return this._title;
    }

    _subtitle?: Caption = undefined;
    set subtitle(caption: Caption | undefined) {
        const { root } = this.scene;
        if (this._subtitle != null) {
            root?.removeChild(this._subtitle.node);
        }
        this._subtitle = caption;
        if (this._subtitle != null) {
            root?.appendChild(this._subtitle.node);
        }
    }
    get subtitle() {
        return this._subtitle;
    }

    private _destroyed: boolean = false;
    get destroyed() {
        return this._destroyed;
    }

    protected readonly interactionManager: InteractionManager;
    protected readonly cursorManager: CursorManager;
    protected readonly highlightManager: HighlightManager;
    protected readonly axisGroup: Group;

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

        const background = this.background;
        background.fill = 'white';
        root.appendChild(background.node);

        this.axisGroup = new Group({ name: 'Axes', layer: true, zIndex: Layers.AXIS_ZINDEX });
        root.appendChild(this.axisGroup);

        this.element = element;
        element.classList.add('ag-chart-wrapper');
        element.style.position = 'relative';

        this.scene = scene ?? new Scene({ document, overrideDevicePixelRatio });
        this.scene.debug.consoleLog = this._debug;
        this.scene.root = root;
        this.scene.container = element;
        this.autoSize = true;

        this.interactionManager = new InteractionManager(element);
        this.cursorManager = new CursorManager(element);
        this.highlightManager = new HighlightManager();

        background.width = this.scene.width;
        background.height = this.scene.height;

        SizeMonitor.observe(this.element, (size) => {
            const { width, height } = size;

            if (!this.autoSize) {
                return;
            }

            if (width === 0 && height === 0) {
                return;
            }

            if (width === this.width && height === this.height) {
                return;
            }

            this._lastAutoSize = [width, height];
            this.resize(width, height);
        });

        this.tooltip = new Tooltip(this.scene.canvas.element, document, document.body);
        this.legend = new Legend(this, this.interactionManager, this.cursorManager, this.highlightManager);
        this.container = container;

        // Add interaction listeners last so child components are registered first.
        this.interactionManager.addListener('click', (event) => this.onClick(event));
        this.interactionManager.addListener('hover', (event) => this.onMouseMove(event));
        this.interactionManager.addListener('leave', () => this.togglePointer(false));
        this.interactionManager.addListener('page-left', () => this.destroy());

        this.highlightManager.addListener('highlight-change', (event) => this.changeHighlightDatum(event));
    }

    destroy(opts?: { keepTransferableResources: boolean }): TransferableResources | undefined {
        if (this._destroyed) {
            return;
        }

        const keepTransferableResources = opts?.keepTransferableResources;
        let result: TransferableResources | undefined = undefined;

        this._performUpdateType = ChartUpdateType.NONE;
        this._pendingFactoryUpdates.splice(0);

        this.tooltip.destroy();
        SizeMonitor.unobserve(this.element);

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

        this._destroyed = true;

        return result;
    }

    log(opts: any) {
        if (this.debug) {
            console.log(opts);
        }
    }

    togglePointer(visible?: boolean) {
        if (this.tooltip.enabled) {
            this.tooltip.toggle(visible);
        }
        if (!visible) {
            this.highlightManager.updateHighlight(this.id);
        }
        if (!visible && this.lastInteractionEvent) {
            this.lastInteractionEvent = undefined;
        }
    }

    private _pendingFactoryUpdates: (() => Promise<void>)[] = [];

    requestFactoryUpdate(cb: () => Promise<void>) {
        const callbacks = this._pendingFactoryUpdates;
        const count = callbacks.length;
        if (count === 0) {
            callbacks.push(cb);
            this._processCallbacks();
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
                console.error(e);
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
            this._lastPerformUpdateError = error;
            console.error(error);
        }
    });
    public async awaitUpdateCompletion() {
        await this.performUpdateTrigger.await();
    }
    public update(
        type = ChartUpdateType.FULL,
        opts?: { forceNodeDataRefresh?: boolean; seriesToUpdate?: Iterable<Series> }
    ) {
        const { forceNodeDataRefresh = false, seriesToUpdate = this.series } = opts || {};

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
                splits.push(performance.now());

                // Disable tooltip/highlight if the data fundamentally shifted.
                this.disablePointer();
            // Fall-through to next pipeline stage.
            case ChartUpdateType.PERFORM_LAYOUT:
                if (this._autoSize && !this._lastAutoSize) {
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
                splits.push(performance.now());
            // Fall-through to next pipeline stage.
            case ChartUpdateType.SERIES_UPDATE:
                const { seriesRect } = this;
                const seriesUpdates = [...this.seriesToUpdate].map((series) => series.update({ seriesRect }));
                this.seriesToUpdate.clear();
                await Promise.all(seriesUpdates);

                splits.push(performance.now());
            // Fall-through to next pipeline stage.
            case ChartUpdateType.SCENE_RENDER:
                await this.scene.render({ debugSplitTimes: splits, extraDebugStats });
                this.extraDebugStats = {};
            // Fall-through to next pipeline stage.
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
        this._axes.forEach((axis) => axis.detachAxis(this.axisGroup));
        // make linked axes go after the regular ones (simulates stable sort by `linkedTo` property)
        this._axes = values.filter((a) => !a.linkedTo).concat(values.filter((a) => a.linkedTo));
        this._axes.forEach((axis) => axis.attachAxis(this.axisGroup));
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
        if (!series.data) {
            series.data = this.data;
        }
        series.addEventListener('nodeClick', this.onSeriesNodeClick, this);
    }

    protected freeSeries(series: Series<any>) {
        series.chart = undefined;
        series.removeEventListener('nodeClick', this.onSeriesNodeClick, this);
    }

    removeAllSeries(): void {
        this.series.forEach((series) => {
            this.freeSeries(series);
            this.seriesRoot.removeChild(series.rootGroup);
        });
        this._series = []; // using `_series` instead of `series` to prevent infinite recursion
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
            const directionAxes = directionToAxesMap[direction] || (directionToAxesMap[direction] = []);
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
                    console.warn(
                        `AG Charts - no available axis for direction [${direction}]; check series and axes configuration.`
                    );
                    return;
                }

                const seriesKeys = series.getKeys(direction);
                const newAxis = this.findMatchingAxis(directionAxes, series.getKeys(direction));
                if (!newAxis) {
                    console.warn(
                        `AG Charts - no matching axis for direction [${direction}] and keys [${seriesKeys}]; check series and axes configuration.`
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

    private resize(width: number, height: number) {
        if (this.scene.resize(width, height)) {
            this.background.width = this.width;
            this.background.height = this.height;

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

            let labelData: PointLabelDatum[] = series.getLabelData();

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

    private async updateLegend() {
        const legendData: LegendDatum[] = [];

        this.series
            .filter((s) => s.showInLegend)
            .forEach((series) => {
                legendData.push(...series.getLegendData());
            });

        const { formatter } = this.legend.item.label;
        if (formatter) {
            legendData.forEach(
                (datum) =>
                    (datum.label.text = formatter({
                        get id() {
                            doOnce(
                                () =>
                                    console.warn(
                                        `AG Charts - LegendLabelFormatterParams.id is deprecated, use seriesId instead`,
                                        datum
                                    ),
                                `LegendLabelFormatterParams.id deprecated`
                            );
                            return datum.seriesId;
                        },
                        itemId: datum.itemId,
                        value: datum.label.text,
                        seriesId: datum.seriesId,
                    }))
            );
        }

        this.legend.data = legendData;
    }

    abstract performLayout(): Promise<void>;

    protected positionCaptions(): { captionAutoPadding?: number } {
        const { _title: title, _subtitle: subtitle } = this;

        const spacing = 10;
        let paddingTop = spacing;

        if (!title) {
            return {};
        }
        title.node.visible = title.enabled;

        if (title.enabled) {
            title.node.x = this.width / 2;
            title.node.y = paddingTop;
            const titleBBox = title.node.computeBBox(); // make sure to set node's x/y, then computeBBox
            if (titleBBox) {
                paddingTop = titleBBox.y + titleBBox.height;
            }
        }

        if (!subtitle) {
            return {};
        }
        subtitle.node.visible = title.enabled && subtitle.enabled;

        if (title.enabled && subtitle.enabled) {
            subtitle.node.x = this.width / 2;
            subtitle.node.y = paddingTop + spacing;
            const subtitleBBox = subtitle.node.computeBBox();
            if (subtitleBBox) {
                paddingTop = subtitleBBox.y + subtitleBBox.height;
            }
        }

        return { captionAutoPadding: Math.floor(paddingTop) };
    }

    protected legendBBox: BBox = new BBox(0, 0, 0, 0);

    protected positionLegend(captionAutoPadding: number) {
        const { legend, legendAutoPadding } = this;
        legendAutoPadding.clear();

        if (!legend.enabled || !legend.data.length) {
            return;
        }

        const legendSpacing = legend.spacing;
        const width = this.width;
        const height = this.height - captionAutoPadding;

        const aspectRatio = width / height;
        const maxCoefficient = 0.5;
        const minHeightCoefficient = 0.2;
        const minWidthCoefficient = 0.25;

        // A horizontal legend should take maximum between 20 to 50 percent of the chart height if height is larger than width
        // and maximum 20 percent of the chart height if height is smaller than width.
        const heightCoefficient =
            aspectRatio < 1 ? Math.min(maxCoefficient, minHeightCoefficient * (1 / aspectRatio)) : minHeightCoefficient;
        const horizontalLegendWidth = legend.maxWidth ? Math.min(legend.maxWidth, width) : width - legendSpacing * 2;
        const horizontalLegendHeight = legend.maxHeight
            ? Math.min(legend.maxHeight, height)
            : Math.round(height * heightCoefficient);

        // A vertical legend should take maximum between 25 to 50 percent of the chart width if width is larger than height
        // and maximum 25 percent of the chart width if width is smaller than height.
        const widthCoefficient =
            aspectRatio > 1 ? Math.min(maxCoefficient, minWidthCoefficient * aspectRatio) : minWidthCoefficient;
        const verticalLegendWidth = legend.maxWidth
            ? Math.min(legend.maxWidth, width)
            : Math.round(width * widthCoefficient);
        const verticalLegendHeight = legend.maxHeight ? Math.min(legend.maxHeight, height) : height - legendSpacing * 2;

        let translationX = 0;
        let translationY = 0;

        let legendBBox: BBox;
        switch (legend.position) {
            case 'bottom':
                legend.performLayout(horizontalLegendWidth, horizontalLegendHeight);
                legendBBox = legend.computeBBox();

                if (legend.visible) {
                    translationX = (width - legendBBox.width) / 2 - legendBBox.x;
                    translationY = captionAutoPadding + height - legendBBox.height - legendBBox.y - legendSpacing;

                    legendAutoPadding.bottom = legendBBox.height;
                } else {
                    legendAutoPadding.bottom = 0;
                }

                break;

            case 'top':
                legend.performLayout(horizontalLegendWidth, horizontalLegendHeight);
                legendBBox = legend.computeBBox();

                if (legend.visible) {
                    translationX = (width - legendBBox.width) / 2 - legendBBox.x;
                    translationY = captionAutoPadding + legendSpacing - legendBBox.y;

                    legendAutoPadding.top = legendBBox.height;
                } else {
                    legendAutoPadding.top = 0;
                }

                break;

            case 'left':
                legend.performLayout(verticalLegendWidth, verticalLegendHeight);
                legendBBox = legend.computeBBox();

                if (legend.visible) {
                    translationX = legendSpacing - legendBBox.x;
                    translationY = captionAutoPadding + (height - legendBBox.height) / 2 - legendBBox.y;

                    legendAutoPadding.left = legendBBox.width;
                } else {
                    legendAutoPadding.left = 0;
                }

                break;

            default: // case 'right':
                legend.performLayout(verticalLegendWidth, verticalLegendHeight);
                legendBBox = legend.computeBBox();

                if (legend.visible) {
                    translationX = width - legendBBox.width - legendBBox.x - legendSpacing;
                    translationY = captionAutoPadding + (height - legendBBox.height) / 2 - legendBBox.y;

                    legendAutoPadding.right = legendBBox.width;
                } else {
                    legendAutoPadding.right = 0;
                }

                break;
        }

        if (legend.visible) {
            // Round off for pixel grid alignment to work properly.
            legend.translationX = Math.floor(translationX + legend.translationX);
            legend.translationY = Math.floor(translationY + legend.translationY);

            this.legendBBox = legend.computeBBox();
        }
    }

    // Should be available after the first layout.
    protected seriesRect?: BBox;
    getSeriesRect(): Readonly<BBox | undefined> {
        return this.seriesRect;
    }

    // x/y are local canvas coordinates in CSS pixels, not actual pixels
    private pickSeriesNode(point: Point):
        | {
              series: Series<any>;
              datum: SeriesNodeDatum;
          }
        | undefined {
        const {
            tooltip: { tracking },
        } = this;

        const start = performance.now();

        // Disable 'nearest match' options if tooltip.tracking is enabled.
        const pickModes = tracking ? undefined : [SeriesNodePickMode.EXACT_SHAPE_MATCH];

        // Iterate through series in reverse, as later declared series appears on top of earlier
        // declared series.
        const reverseSeries = [...this.series].reverse();

        let result: { series: Series<any>; datum: SeriesNodeDatum; distance: number } | undefined = undefined;
        for (const series of reverseSeries) {
            if (!series.visible || !series.rootGroup.visible) {
                continue;
            }
            let { match, distance } = series.pickNode(point, pickModes) ?? {};
            if (!match || distance == null) {
                continue;
            }
            if (!result || result.distance > distance) {
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
        if (this.tooltip.enabled) {
            if (this.tooltip.delay > 0) {
                this.togglePointer(false);
            }
        }

        this.lastInteractionEvent = event;
        this.pointerScheduler.schedule();

        this.extraDebugStats['mouseX'] = event.offsetX;
        this.extraDebugStats['mouseY'] = event.offsetY;
        this.update(ChartUpdateType.SCENE_RENDER);
    }

    private disablePointer() {
        this.highlightManager.updateHighlight(this.id);
        this.togglePointer(false);
    }

    private lastInteractionEvent?: InteractionEvent<'hover'> = undefined;
    private pointerScheduler = debouncedAnimationFrame(() => {
        if (this.lastInteractionEvent) {
            this.handlePointer(this.lastInteractionEvent);
        }
        this.lastInteractionEvent = undefined;
    });
    protected handlePointer(event: InteractionEvent<'hover'>) {
        if (!event) {
            return;
        }

        const { lastPick } = this;
        const { pageX, pageY, offsetX, offsetY } = event;

        const disablePointer = () => {
            if (lastPick) {
                // Cursor moved from a non-marker node to empty space.
                this.disablePointer();
            }
        };

        if (!(this.seriesRect && this.seriesRect.containsPoint(offsetX, offsetY))) {
            disablePointer();
            return;
        }

        const pick = this.pickSeriesNode({ x: offsetX, y: offsetY });

        if (!pick) {
            disablePointer();
            return;
        }

        const meta = { pageX, pageY, offsetX, offsetY, event: event.sourceEvent };
        if (!lastPick || lastPick.datum !== pick.datum) {
            this.onSeriesDatumPick(meta, pick.datum);
            return;
        }

        lastPick.event = event.sourceEvent;

        if (this.tooltip.enabled && pick.series.tooltip.enabled) {
            this.tooltip.show(this.mergePointerDatum(meta, pick.datum));
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

    private checkSeriesNodeClick(event: InteractionEvent<'click'>): boolean {
        const { lastPick } = this;

        if (lastPick?.datum) {
            const { datum } = lastPick;
            datum.series.fireNodeClickEvent(event.sourceEvent, datum);
            return true;
        } else if (event.sourceEvent.type.startsWith('touch')) {
            const pick = this.pickSeriesNode({ x: event.offsetX, y: event.offsetY });

            if (pick) {
                pick.series.fireNodeClickEvent(event.sourceEvent, pick.datum);
                return true;
            }
        }

        return false;
    }

    private onSeriesNodeClick(event: SourceEvent<Series<any>>) {
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
    }

    private onSeriesDatumPick(meta: PointerMeta, datum: SeriesNodeDatum) {
        const { lastPick } = this;
        if (lastPick) {
            if (lastPick.datum === datum) {
                return;
            }
        }

        this.highlightManager.updateHighlight(this.id, datum);

        if (datum) {
            meta = this.mergePointerDatum(meta, datum);
        }

        const tooltipEnabled = this.tooltip.enabled && datum.series.tooltip.enabled;
        const html = tooltipEnabled && datum.series.getTooltipHtml(datum);
        if (html) {
            this.tooltip.show(meta, html);
        }
    }

    private mergePointerDatum(meta: PointerMeta, datum: SeriesNodeDatum): PointerMeta {
        if (datum.point) {
            const { x, y } = datum.point;
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
        const { datum: { series: newSeries = undefined } = {}, datum: newDatum } = event.currentHighlight || {};
        const { datum: { series: lastSeries = undefined } = {}, datum: lastDatum } = event.previousHighlight || {};

        if (lastSeries) {
            seriesToUpdate.add(lastSeries);
        }

        if (newSeries) {
            seriesToUpdate.add(newSeries);
        }

        // Adjust cursor if a specific datum is highlighted, rather than just a series.
        if (lastSeries?.cursor && lastDatum?.datum) {
            this.cursorManager.updateCursor(lastSeries.id);
        }
        if (newSeries?.cursor && newDatum?.datum) {
            this.cursorManager.updateCursor(newSeries.id, newSeries.cursor);
        }

        this.lastPick = event.currentHighlight ? { datum: event.currentHighlight } : undefined;

        let updateAll = newSeries == null || lastSeries == null;
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
}
