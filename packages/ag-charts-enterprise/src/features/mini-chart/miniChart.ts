import { type AgChartInstance, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const { Validate, BOOLEAN, Layers, ActionOnSet, ChartAxisDirection, CategoryAxis, GroupedCategoryAxis } =
    _ModuleSupport;
const { toRadians, Padding, Logger } = _Util;
const { Group, BBox } = _Scene;

export class MiniChart
    extends _ModuleSupport.BaseModuleInstance
    implements _ModuleSupport.ModuleInstance, AgChartInstance
{
    @Validate(BOOLEAN)
    enabled: boolean = false;

    readonly root = new Group({ name: 'root' });
    readonly seriesRoot = new Group({
        name: 'Series-root',
        layer: true,
        zIndex: Layers.SERIES_LAYER_ZINDEX,
    });
    readonly axisGridGroup = new Group({ name: 'Axes-Grids', layer: true, zIndex: Layers.AXIS_GRID_ZINDEX });
    readonly axisGroup = new Group({ name: 'Axes-Grids', layer: true, zIndex: Layers.AXIS_GRID_ZINDEX });

    public data: any = [];

    private _destroyed: boolean = false;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        this.root.appendChild(this.seriesRoot);
        this.root.appendChild(this.axisGridGroup);
        this.root.appendChild(this.axisGroup);
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

    getOptions() {
        return null!;
    }

    getModuleContext() {
        return this.ctx;
    }

    resetAnimations(): void {}

    @ActionOnSet<MiniChart>({
        changeValue(newValue: _ModuleSupport.ChartAxis[], oldValue: _ModuleSupport.ChartAxis[] = []) {
            for (const axis of oldValue) {
                if (newValue.includes(axis)) continue;
                axis.detachAxis(this.axisGroup, this.axisGridGroup);
                axis.destroy();
            }

            for (const axis of newValue) {
                if (oldValue?.includes(axis)) continue;
                if (axis.direction === ChartAxisDirection.X) {
                    axis.label.autoRotate = false;
                } else {
                    axis.label.enabled = false;
                    axis.tick.enabled = false;
                }

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
    series: _ModuleSupport.Series<any>[] = [];

    private onSeriesChange(newValue: _ModuleSupport.Series<any>[], oldValue?: _ModuleSupport.Series<any>[]) {
        const seriesToDestroy = oldValue?.filter((series) => !newValue.includes(series)) ?? [];
        this.destroySeries(seriesToDestroy);

        for (const series of newValue) {
            if (oldValue?.includes(series)) continue;

            this.seriesRoot.appendChild(series.rootGroup);

            const chart = this;
            series.chart = {
                get mode() {
                    return 'standalone' as const;
                },
                get seriesRect() {
                    return chart.seriesRect;
                },
                placeLabels() {
                    return new Map();
                },
            };

            series.resetAnimation('initial');
            series.addChartEventListeners();
        }
    }

    protected destroySeries(series: _ModuleSupport.Series<any>[]): void {
        series?.forEach((series) => {
            series.destroy();

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
        let bottomAxisHeight = 0;
        const bottomAxis = this.axes.find((axis) => axis.direction === ChartAxisDirection.X);
        if (bottomAxis != null) {
            const { thickness = 0, line, label } = bottomAxis;
            if (thickness > 0) {
                bottomAxisHeight = thickness;
            } else {
                bottomAxisHeight =
                    (line.enabled ? line.width : 0) +
                    (label.enabled ? (label.fontSize ?? 0) * 1.25 + label.padding : 0);
            }
        }
        return new Padding(0, 0, bottomAxisHeight, 0);
    }

    async layout(width: number, height: number) {
        const animated = this.seriesRect != null;
        const seriesRect = new BBox(0, 0, width, height);
        this.seriesRect = seriesRect;

        this.seriesRoot.setClipRectInGroupCoordinateSpace(this.seriesRoot.inverseTransformBBox(seriesRect));

        const axisLeftRightRange = (axis: _ModuleSupport.ChartAxis) => {
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
                    axis.translation.y = seriesRect.height;
                    break;
                case 'right':
                    axis.translation.x = seriesRect.width;
                    axis.translation.y = 0;
                    break;
            }

            axis.gridPadding = 0;

            axis.calculateLayout();
            axis.updatePosition({ rotation: toRadians(axis.rotation), sideFlag: axis.label.getSideFlag() });

            axis.update(undefined, animated);
        });

        await Promise.all(this.series.map((series) => series.update({ seriesRect })));
    }

    // Should be available after the first layout.
    protected seriesRect?: _Scene.BBox;
}
