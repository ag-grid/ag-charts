import { _ModuleSupport } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    ActionOnSet,
    ChartAxisDirection,
    type DynamicContext,
    Padding,
    ProxyProperty,
    ZIndexMap,
    calcLineHeight,
} from 'ag-charts-core';

import { MiniChartGroup } from './shapes/miniChartGroup';

const { CategoryAxis, Group, BBox, stackCartesianSeries } = _ModuleSupport;

export class MiniChart extends AbstractModuleInstance {
    get enabled(): boolean {
        return this.ctx.chartState.getValue('options', 'navigator.miniChart.enabled') ?? false;
    }

    @ProxyProperty(['seriesRoot', 'inset'])
    inset!: number;

    @ProxyProperty(['seriesRoot', 'cornerRadius'])
    cornerRadius!: number;

    readonly root = new Group({ name: 'root' });
    readonly seriesRoot = this.root.appendChild(
        new MiniChartGroup({ name: 'Series-root', zIndex: ZIndexMap.SERIES_LAYER, renderToOffscreenCanvas: true })
    );
    readonly axisGridGroup = this.root.appendChild(new Group({ name: 'Axes-Grids', zIndex: ZIndexMap.AXIS_GRID }));
    readonly axisGroup = this.root.appendChild(new Group({ name: 'Axes-Grids', zIndex: ZIndexMap.AXIS_GRID }));
    readonly axisLabelGroup = this.root.appendChild(new Group({ name: 'Axes-Labels', zIndex: ZIndexMap.SERIES_LABEL }));
    readonly axisCrosslineRangeGroup = this.root.appendChild(
        new Group({ name: 'Axes-Crosslines-Range', zIndex: ZIndexMap.SERIES_CROSSLINE_RANGE })
    );
    readonly axisCrosslineLineGroup = this.root.appendChild(
        new Group({ name: 'Axes-Crosslines-Line', zIndex: ZIndexMap.SERIES_CROSSLINE_LINE })
    );
    readonly axisCrosslineLabelGroup = this.root.appendChild(
        new Group({ name: 'Axes-Crosslines-Label', zIndex: ZIndexMap.SERIES_LABEL })
    );

    private _destroyed: boolean = false;

    private miniChartAnimationPhase: 'initial' | 'ready' = 'initial';

    // Should be available after the first layout.
    protected seriesRect?: _ModuleSupport.BBox = undefined;

    @ActionOnSet<MiniChart>({
        changeValue(
            newValue: _ModuleSupport.ChartAxes,
            oldValue: _ModuleSupport.ChartAxes = new _ModuleSupport.ChartAxes()
        ) {
            const axisNodes = {
                axisNode: this.axisGroup,
                gridNode: this.axisGridGroup,
                labelNode: this.axisLabelGroup,
                overlayLowNode: this.axisCrosslineRangeGroup,
                overlayMidNode: this.axisCrosslineLineGroup,
                overlayHighNode: this.axisCrosslineLabelGroup,
            };

            for (const axis of oldValue) {
                if (newValue.includes(axis)) continue;
                axis.detachAxis();
                axis.destroy();
            }

            for (const axis of newValue) {
                if (oldValue?.includes(axis)) continue;

                axis.attachAxis(axisNodes);
            }
        },
    })
    axes: _ModuleSupport.ChartAxes = new _ModuleSupport.ChartAxes();

    @ActionOnSet<MiniChart>({
        changeValue(newValue, oldValue) {
            this.onSeriesChange(newValue, oldValue);
        },
    })
    series: _ModuleSupport.UnknownSeries[] = [];

    private _unregisterLoader?: () => void;

    constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();

        this.cleanup.register(
            this.ctx.chartState.observe((get) => {
                const enabled = get('options', 'navigator.miniChart.enabled');
                if (enabled) {
                    this._unregisterLoader?.();
                    this._unregisterLoader = this.ctx.dataService.registerSecondaryLoader(
                        'mini-chart',
                        ['chart-update', 'data-update', 'range-check', 'state-change', 'sync'],
                        (data) => this.updateData(data)
                    );
                } else {
                    this._unregisterLoader?.();
                }
            }),
            () => this._unregisterLoader?.()
        );
    }

    override destroy() {
        if (this._destroyed) {
            return;
        }

        super.destroy();
        this.destroySeries(this.series);

        this.axes.destroy();

        this._destroyed = true;
    }

    private onSeriesChange(newValue: _ModuleSupport.UnknownSeries[], oldValue?: _ModuleSupport.UnknownSeries[]) {
        const seriesToDestroy = oldValue?.filter((series) => !newValue.includes(series)) ?? [];
        this.destroySeries(seriesToDestroy);

        for (const series of newValue) {
            if (this.ctx.dataService.isLazy()) {
                series.disconnectData();
            } else {
                series.reconnectData();
            }

            if (oldValue?.includes(series)) continue;

            series.attachSeries(this.seriesRoot, this.seriesRoot, undefined);

            series.chart = {} as any;
            Object.defineProperty(series.chart, 'mode', {
                get: () => 'standalone' as const,
            });
            Object.defineProperty(series.chart, 'isMiniChart', {
                get: () => true,
            });
            Object.defineProperty(series.chart, 'flashOnUpdateEnabled', {
                get: () => false,
            });
            Object.defineProperty(series.chart, 'seriesRect', {
                get: () => this.seriesRect,
            });

            series.resetAnimation(this.miniChartAnimationPhase === 'initial' ? 'initial' : 'disabled');
            // @todo(AG-10653) Enable when there is an id per series group, irrespective of series instance
            // series.addChartEventListeners();
        }

        this.seriesRect = undefined; // Force re-layout
    }

    protected destroySeries(allSeries: _ModuleSupport.UnknownSeries[]): void {
        if (allSeries) {
            for (const series of allSeries) {
                series.destroy();
                series.detachSeries(this.seriesRoot, this.seriesRoot, undefined);
                series.chart = undefined;
            }
        }
    }

    protected assignSeriesToAxes() {
        for (const axis of this.axes) {
            axis.boundSeries = this.series.filter((s) => {
                const seriesAxis = s.axes[axis.direction];
                return seriesAxis === axis;
            });
        }
    }

    protected assignAxesToSeries() {
        // This method has to run before `assignSeriesToAxes`.
        const directionToAxesMap: { [K in ChartAxisDirection]?: _ModuleSupport.ChartAxis[] } = {};

        for (const axis of this.axes) {
            const direction = axis.direction;
            const directionAxes = (directionToAxesMap[direction] ??= []);
            directionAxes.push(axis);
        }

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

    updateData(data: unknown[]) {
        const dataSet = _ModuleSupport.DataSet.wrap(data, this.ctx.logger);
        for (const series of this.series) {
            series.setChartData(dataSet);
        }
        if (this.miniChartAnimationPhase === 'initial') {
            this.ctx.animationManager.onBatchStop(() => {
                this.miniChartAnimationPhase = 'ready';
                // Disable animations after initial load.
                for (const s of this.series) {
                    s.resetAnimation('disabled');
                }
            });
        }
    }

    async processData(mainDataController: _ModuleSupport.DataController) {
        if (this.series.some((s) => s.canHaveAxes)) {
            this.assignAxesToSeries();
            this.assignSeriesToAxes();
        }

        const dataController = this.ctx.dataService.isLazy()
            ? new _ModuleSupport.DataController(
                  this.ctx.chartState.getValue('options', 'mode'),
                  this.ctx.chartState.getValue('options', 'suppressFieldDotNotation'),
                  this.ctx.eventsHub,
                  this.ctx.logger
              )
            : mainDataController;

        const promises: Promise<void>[] = [];
        for (const series of this.series) {
            series.resetDatumCallbackCache();
            promises.push(series.processData(dataController) ?? Promise.resolve());
        }

        if (this.ctx.dataService.isLazy()) {
            dataController.execute(undefined, undefined);
        }

        await Promise.all(promises);

        for (const axis of this.axes) {
            axis.processData();
        }
    }

    computeAxisPadding() {
        const padding = new Padding();
        if (!this.enabled) {
            return padding;
        }

        for (const axis of this.axes) {
            if (!(axis instanceof _ModuleSupport.CartesianAxis)) continue;
            const { position } = axis;
            if (position == null) continue;

            const { thickness, label, line } = axis.options;
            let size: number;
            if (thickness) {
                size = thickness;
            } else {
                size =
                    (line.enabled ? line.width : 0) +
                    (label.enabled ? calcLineHeight(label.fontSize) + label.spacing : 0);
            }

            padding[position] = Math.ceil(size);
        }

        return padding;
    }

    async layout(width: number, height: number) {
        const padding = this.ctx.chartState.getValue('options', 'navigator.miniChart.padding');
        const animated = this.seriesRect != null;
        const seriesRect = new BBox(0, 0, width, height - (padding.top + padding.bottom));

        const resized = this.seriesRect?.width !== width || this.seriesRect?.height !== height;

        this.seriesRect = seriesRect;
        this.seriesRoot.translationY = padding.top;
        this.seriesRoot.setClipRectCanvasSpace(new BBox(0, -padding.top, width, height));

        for (const axis of this.axes) {
            const { position = 'left' } = axis;
            switch (position) {
                case 'top':
                case 'bottom':
                    axis.range = [padding.left, seriesRect.width - padding.right];
                    axis.gridLength = seriesRect.height;
                    break;
                case 'right':
                case 'left': {
                    const isCategoryAxis = axis instanceof CategoryAxis;
                    axis.range = isCategoryAxis ? [0, seriesRect.height] : [seriesRect.height, 0];
                    axis.gridLength = seriesRect.width;
                    break;
                }
            }

            axis.gridPadding = 0;
            axis.translation.x = 0;
            axis.translation.y = 0;

            if (position === 'right') {
                axis.translation.x = width;
            } else if (position === 'bottom') {
                axis.translation.y = height;
            }

            if (!animated) {
                axis.resetAnimation('initial');
            }

            const crossLines = _ModuleSupport.getCrossLinesPlugin(axis)?.getInstances();
            if (crossLines) {
                for (const crossLine of crossLines) {
                    if (crossLine instanceof _ModuleSupport.CartesianCrossLine) {
                        crossLine.position = axis.position ?? 'top';
                        crossLine.label.parallel ??= axis.parallel;
                    }
                }
            }

            axis.calculateLayout();
            axis.update();
        }

        if (resized) {
            stackCartesianSeries(this.series);
        }

        await Promise.all(this.series.map(async (series) => series.update({ seriesRect })));
    }
}
