import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const { Validate, BOOLEAN, POSITIVE_NUMBER, Layers, ActionOnSet, CategoryAxis, GroupedCategoryAxis } = _ModuleSupport;
const { Padding, Logger } = _Util;
const { Text, Group, BBox } = _Scene;

class MiniChartPadding {
    @Validate(POSITIVE_NUMBER)
    top: number = 0;

    @Validate(POSITIVE_NUMBER)
    bottom: number = 0;
}

export class MiniChart extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    enabled: boolean = false;

    readonly padding = new MiniChartPadding();

    readonly root = new Group({ name: 'root' });
    readonly seriesRoot = this.root.appendChild(
        new Group({ name: 'Series-root', layer: true, zIndex: Layers.SERIES_LAYER_ZINDEX })
    );
    readonly axisGridGroup = this.root.appendChild(
        new Group({ name: 'Axes-Grids', layer: true, zIndex: Layers.AXIS_GRID_ZINDEX })
    );
    readonly axisGroup = this.root.appendChild(
        new Group({ name: 'Axes-Grids', layer: true, zIndex: Layers.AXIS_GRID_ZINDEX })
    );

    public data: any = [];

    private _destroyed: boolean = false;

    private miniChartAnimationPhase: 'initial' | 'ready' = 'initial';

    @ActionOnSet<MiniChart>({
        changeValue(newValue: _ModuleSupport.ChartAxis[], oldValue: _ModuleSupport.ChartAxis[] = []) {
            for (const axis of oldValue) {
                if (newValue.includes(axis)) continue;
                axis.detachAxis(this.axisGroup, this.axisGridGroup);
                axis.destroy();
            }

            for (const axis of newValue) {
                if (oldValue?.includes(axis)) continue;

                axis.attachAxis(this.axisGroup, this.axisGridGroup);
            }
        },
    })
    axes: _ModuleSupport.ChartAxis[] = [];

    @ActionOnSet<MiniChart>({
        changeValue(newValue, oldValue) {
            this.onSeriesChange(newValue, oldValue);
        },
    })
    series: _ModuleSupport.Series<any, any>[] = [];

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();
    }

    override destroy() {
        if (this._destroyed) {
            return;
        }

        this.destroySeries(this.series);

        this.axes.forEach((a) => a.destroy());
        this.axes = [];

        this._destroyed = true;
    }

    private onSeriesChange(newValue: _ModuleSupport.Series<any, any>[], oldValue?: _ModuleSupport.Series<any, any>[]) {
        const seriesToDestroy = oldValue?.filter((series) => !newValue.includes(series)) ?? [];
        this.destroySeries(seriesToDestroy);

        for (const series of newValue) {
            if (oldValue?.includes(series)) continue;

            if (series.rootGroup.parent == null) {
                this.seriesRoot.appendChild(series.rootGroup);
            }

            const chart = this;
            series.chart = {
                get mode() {
                    return 'standalone' as const;
                },
                get isMiniChart() {
                    return true;
                },
                get seriesRect() {
                    return chart.seriesRect;
                },
                placeLabels() {
                    return new Map();
                },
            };

            series.resetAnimation(this.miniChartAnimationPhase === 'initial' ? 'initial' : 'disabled');
            // @todo(AG-10653) Enable when there is an id per series group, irrespective of series instance
            // series.addChartEventListeners();
        }
    }

    protected destroySeries(allSeries: _ModuleSupport.Series<any, any>[]): void {
        allSeries?.forEach((series) => {
            series.destroy();

            if (series.rootGroup != null) {
                this.seriesRoot.removeChild(series.rootGroup);
            }

            series.chart = undefined;
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
        const directionToAxesMap: { [key in _ModuleSupport.ChartAxisDirection]?: _ModuleSupport.ChartAxis[] } = {};

        this.axes.forEach((axis) => {
            const direction = axis.direction;
            const directionAxes = (directionToAxesMap[direction] ??= []);
            directionAxes.push(axis);
        });

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

    private findMatchingAxis(
        directionAxes: _ModuleSupport.ChartAxis[],
        directionKeys?: string[]
    ): _ModuleSupport.ChartAxis | undefined {
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

    async updateData(opts: { data: any }) {
        this.series.forEach((s) => s.setChartData(opts.data));
        if (this.miniChartAnimationPhase === 'initial') {
            this.ctx.animationManager.onBatchStop(() => {
                this.miniChartAnimationPhase = 'ready';
                // Disable animations after initial load.
                this.series.forEach((s) => s.resetAnimation('disabled'));
            });
        }
    }

    async processData(opts: { dataController: _ModuleSupport.DataController }) {
        if (this.series.some((s) => s.canHaveAxes)) {
            this.assignAxesToSeries();
            this.assignSeriesToAxes();
        }

        const seriesPromises = this.series.map((s) => s.processData(opts.dataController));
        await Promise.all(seriesPromises);
    }

    computeAxisPadding() {
        const padding = new Padding();
        if (!this.enabled) {
            return padding;
        }

        this.axes.forEach((axis) => {
            const { position, thickness = 0, line, label } = axis;
            if (position == null) return;

            let size: number;
            if (thickness > 0) {
                size = thickness;
            } else {
                size =
                    (line.enabled ? line.width : 0) +
                    (label.enabled ? (label.fontSize ?? 0) * Text.defaultLineHeightRatio + label.padding : 0);
            }

            padding[position] = Math.ceil(size);
        });

        return padding;
    }

    async layout(width: number, height: number) {
        const { padding } = this;

        const animated = this.seriesRect != null;

        const seriesRect = new BBox(0, 0, width, height - (padding.top + padding.bottom));
        this.seriesRect = seriesRect;

        this.seriesRoot.translationY = padding.top;
        this.seriesRoot.setClipRectInGroupCoordinateSpace(
            this.seriesRoot.inverseTransformBBox(new BBox(0, -padding.top, width, height))
        );

        const axisLeftRightRange = (axis: _ModuleSupport.ChartAxis): [number, number] => {
            if (axis instanceof CategoryAxis || axis instanceof GroupedCategoryAxis) {
                return [0, seriesRect.height];
            }
            return [seriesRect.height, 0];
        };

        this.axes.forEach((axis) => {
            const { position = 'left' } = axis;

            switch (position) {
                case 'top':
                case 'bottom':
                    axis.range = [0, seriesRect.width];
                    axis.gridLength = seriesRect.height;
                    break;
                case 'right':
                case 'left':
                    axis.range = axisLeftRightRange(axis);
                    axis.gridLength = seriesRect.width;
                    break;
            }

            switch (position) {
                case 'top':
                case 'left':
                    axis.translation.x = 0;
                    axis.translation.y = 0;
                    break;
                case 'bottom':
                    axis.translation.x = 0;
                    axis.translation.y = height;
                    break;
                case 'right':
                    axis.translation.x = width;
                    axis.translation.y = 0;
                    break;
            }

            axis.gridPadding = 0;

            axis.calculateLayout();
            axis.updatePosition();

            axis.update(undefined, animated);
        });

        await Promise.all(this.series.map((series) => series.update({ seriesRect })));
    }

    // Should be available after the first layout.
    protected seriesRect?: _Scene.BBox;
}
