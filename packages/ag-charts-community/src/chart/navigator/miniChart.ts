import type { ModuleContext } from '../../module/moduleContext';
import type { AgChartInstance, AgChartOptions } from '../../options/agChartOptions';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { toRadians } from '../../util/angle';
import { createId } from '../../util/id';
import { deepClone } from '../../util/json';
import { Logger } from '../../util/logger';
import { Observable } from '../../util/observable';
import { Padding } from '../../util/padding';
import { ActionOnSet } from '../../util/proxy';
import { CategoryAxis } from '../axis/categoryAxis';
import { GroupedCategoryAxis } from '../axis/groupedCategoryAxis';
import type { ChartAxis } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { DataController } from '../data/dataController';
import { Layers } from '../layers';
import type { SeriesOptionsTypes } from '../mapping/types';
import type { Series } from '../series/series';

export class MiniChart extends Observable implements AgChartInstance {
    static className = 'MiniChart';
    static type = 'cartesian';

    readonly id = createId(this);

    processedOptions: AgChartOptions & { type?: SeriesOptionsTypes['type'] } = {};
    userOptions: AgChartOptions = {};
    queuedUserOptions: AgChartOptions[] = [];

    getOptions() {
        return deepClone(this.queuedUserOptions.at(-1) ?? this.userOptions);
    }

    readonly root = new Group({ name: 'root' });
    readonly seriesRoot = new Group({
        name: `${this.id}-Series-root`,
        layer: true,
        zIndex: Layers.SERIES_LAYER_ZINDEX,
    });
    readonly axisGridGroup = new Group({ name: 'Axes-Grids', layer: true, zIndex: Layers.AXIS_GRID_ZINDEX });
    readonly axisGroup = new Group({ name: 'Axes-Grids', layer: true, zIndex: Layers.AXIS_GRID_ZINDEX });

    public data: any = [];

    width: number = 0;
    height: number = 0;

    private _destroyed: boolean = false;

    constructor(public ctx: ModuleContext) {
        super();

        this.root.appendChild(this.seriesRoot);
        this.root.appendChild(this.axisGridGroup);
        this.root.appendChild(this.axisGroup);
    }

    getModuleContext(): ModuleContext {
        return this.ctx;
    }

    resetAnimations(): void {}

    destroy() {
        if (this._destroyed) {
            return;
        }

        this.destroySeries(this.series);

        this.axes.forEach((a) => a.destroy());
        this.axes = [];

        this._destroyed = true;
    }

    @ActionOnSet<MiniChart>({
        changeValue(newValue: ChartAxis[], oldValue: ChartAxis[] = []) {
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
                }

                axis.attachAxis(this.axisGroup, this.axisGridGroup);
            }
        },
    })
    axes: ChartAxis[] = [];

    @ActionOnSet<MiniChart>({
        changeValue(newValue, oldValue) {
            this.onSeriesChange(newValue, oldValue);
        },
    })
    series: Series<any>[] = [];

    private onSeriesChange(newValue: Series<any>[], oldValue?: Series<any>[]) {
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

    protected destroySeries(series: Series<any>[]): void {
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
        const directionToAxesMap: { [key in ChartAxisDirection]?: ChartAxis[] } = {};

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

    async updateData(opts: { data: any }) {
        this.series.forEach((s) => s.setChartData(opts.data));
    }

    async processData(opts: { dataController: DataController }) {
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

    async performCartesianLayout() {
        const { width, height } = this;
        const seriesRect = new BBox(0, 0, width, height);
        this.seriesRect = seriesRect;

        const axisLeftRightRange = (axis: ChartAxis) => {
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

            axis.update();
        });

        await Promise.all(this.series.map((series) => series.update({ seriesRect })));
    }

    // Should be available after the first layout.
    protected seriesRect?: BBox;
}
