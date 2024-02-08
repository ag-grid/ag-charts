import { toRadians } from '../../integrated-charts-scene';
import type { ModuleContext } from '../../module/moduleContext';
import type { AgCartesianAxisPosition, AgChartInstance, AgChartOptions } from '../../options/agChartOptions';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { createId } from '../../util/id';
import { deepClone } from '../../util/json';
import { Logger } from '../../util/logger';
import { mapValues } from '../../util/object';
import { Observable } from '../../util/observable';
import { ActionOnSet } from '../../util/proxy';
import { CategoryAxis } from '../axis/categoryAxis';
import { GroupedCategoryAxis } from '../axis/groupedCategoryAxis';
import type { ChartAxis } from '../chartAxis';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { DataController } from '../data/dataController';
import { Layers } from '../layers';
import type { SeriesOptionsTypes } from '../mapping/types';
import type { Series } from '../series/series';

type VisibilityMap = { crossLines: boolean; series: boolean };

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

    public data: any = [];

    width: number = 0;
    height: number = 0;

    private _destroyed: boolean = false;
    private readonly _destroyFns: (() => void)[] = [];

    protected readonly axisGridGroup: Group;
    protected readonly axisGroup: Group;

    constructor(public ctx: ModuleContext) {
        super();

        this.root.append(this.seriesRoot);

        this.axisGridGroup = new Group({ name: 'Axes-Grids', layer: true, zIndex: Layers.AXIS_GRID_ZINDEX });
        this.root.appendChild(this.axisGridGroup);

        this.axisGroup = new Group({ name: 'Axes', layer: true, zIndex: Layers.AXIS_ZINDEX });
        this.root.appendChild(this.axisGroup);

        this._destroyFns.push();
    }

    getModuleContext(): ModuleContext {
        return this.ctx;
    }

    resetAnimations(): void {}

    destroy() {
        if (this._destroyed) {
            return;
        }

        this._destroyFns.forEach((fn) => fn());

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
                axis.label.enabled = false;
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

    async performCartesianLayout() {
        const { width, height } = this;
        const shrinkRect = new BBox(0, 0, width, height);

        const { seriesRect, visibility } = this.updateAxes(shrinkRect);
        this.seriesRoot.visible = visibility.series;
        this.seriesRect = seriesRect;

        await Promise.all(this.series.map((series) => series.update({ seriesRect })));
    }

    // Should be available after the first layout.
    protected seriesRect?: BBox;

    protected getMinRect() {
        const minRects = this.series.map((series) => series.getMinRect()).filter((rect) => rect !== undefined);
        if (!minRects.length) return undefined;
        return new BBox(
            0,
            0,
            minRects.reduce((max, rect) => Math.max(max, rect!.width), 0),
            minRects.reduce((max, rect) => Math.max(max, rect!.height), 0)
        );
    }

    private _lastCrossLineIds?: string[] = undefined;
    private _lastAxisWidths: Partial<Record<AgCartesianAxisPosition, number>> = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    };
    private _lastVisibility: VisibilityMap = {
        crossLines: true,
        series: true,
    };
    updateAxes(inputShrinkRect: BBox) {
        // FIXME - the crosslines get regenerated when switching between light/dark mode.
        // Ideally, even in this case this updateAxes logic would still work. But there's more work to make that happen.
        const crossLineIds = this.axes.flatMap((axis) => axis.crossLines ?? []).map((crossLine) => crossLine.id);
        const axesValid =
            this._lastCrossLineIds != null &&
            this._lastCrossLineIds.length === crossLineIds.length &&
            this._lastCrossLineIds.every((id, index) => crossLineIds[index] === id);

        let axisWidths: typeof this._lastAxisWidths;
        let visibility: typeof this._lastVisibility;
        if (axesValid) {
            // Start with a good approximation from the last update - this should mean that in many resize
            // cases that only a single pass is needed \o/.
            axisWidths = { ...this._lastAxisWidths };
            visibility = { ...this._lastVisibility };
        } else {
            axisWidths = { top: 0, bottom: 0, left: 0, right: 0 };
            visibility = { crossLines: true, series: true };
            this._lastCrossLineIds = crossLineIds;
        }

        // Clean any positions which aren't valid with the current axis status (otherwise we end up
        // never being able to find a stable result).
        const liveAxisWidths = new Set(this.axes.map((a) => a.position));
        for (const position of Object.keys(axisWidths) as AgCartesianAxisPosition[]) {
            if (!liveAxisWidths.has(position)) {
                delete axisWidths[position];
            }
        }

        const stableOutputs = <T extends typeof axisWidths>(
            otherAxisWidths: T,
            otherVisibility: Partial<VisibilityMap>
        ) => {
            // Check for new axis positions.
            if (Object.keys(otherAxisWidths).some((k) => (axisWidths as any)[k] == null)) {
                return false;
            }
            return (
                visibility.crossLines === otherVisibility.crossLines &&
                visibility.series === otherVisibility.series &&
                // Check for existing axis positions and equality.
                Object.entries(axisWidths).every(([p, w]) => {
                    const otherW = (otherAxisWidths as any)[p];
                    if (w != null || otherW != null) {
                        return w === otherW;
                    }
                    return true;
                })
            );
        };

        const ceilValues = (records: Record<string, number | undefined>) =>
            mapValues(records, (value) => {
                if (value && Math.abs(value) === Infinity) {
                    return 0;
                }
                return value != null ? Math.ceil(value) : value;
            });

        // Iteratively try to resolve axis widths - since X axis width affects Y axis range,
        // and vice-versa, we need to iteratively try and find a fit for the axes and their
        // ticks/labels.
        let lastPassAxisWidths: typeof axisWidths = {};
        let lastPassVisibility: Partial<VisibilityMap> = {};
        let clipSeries = false;
        let seriesRect = this.seriesRect?.clone();
        let count = 0;
        let primaryTickCounts: Partial<Record<ChartAxisDirection, number>> = {};
        do {
            Object.assign(axisWidths, lastPassAxisWidths);
            Object.assign(visibility, lastPassVisibility);

            const result = this.updateAxesPass(axisWidths, inputShrinkRect.clone(), seriesRect);
            lastPassAxisWidths = ceilValues(result.axisWidths);
            lastPassVisibility = result.visibility;
            clipSeries = result.clipSeries;
            seriesRect = result.seriesRect;
            primaryTickCounts = result.primaryTickCounts;

            if (count++ > 10) {
                Logger.warn('unable to find stable axis layout.');
                break;
            }
        } while (!stableOutputs(lastPassAxisWidths, lastPassVisibility));

        this.axes.forEach((axis) => {
            axis.update(primaryTickCounts[axis.direction]);
        });

        const clipRectPadding = 5;
        this.axes.forEach((axis) => {
            // update visibility of crosslines
            axis.setCrossLinesVisible(visibility.crossLines);

            if (!seriesRect) {
                return;
            }

            axis.clipGrid(
                seriesRect.x,
                seriesRect.y,
                seriesRect.width + clipRectPadding,
                seriesRect.height + clipRectPadding
            );

            switch (axis.position) {
                case 'left':
                case 'right':
                    axis.clipTickLines(
                        inputShrinkRect.x,
                        seriesRect.y,
                        inputShrinkRect.width + clipRectPadding,
                        seriesRect.height + clipRectPadding
                    );
                    break;
                case 'top':
                case 'bottom':
                    axis.clipTickLines(
                        seriesRect.x,
                        inputShrinkRect.y,
                        seriesRect.width + clipRectPadding,
                        inputShrinkRect.height + clipRectPadding
                    );
                    break;
            }
        });

        this._lastAxisWidths = axisWidths;
        this._lastVisibility = visibility;

        return { seriesRect, animationRect: inputShrinkRect, visibility, clipSeries };
    }

    private updateAxesPass(
        axisWidths: Partial<Record<AgCartesianAxisPosition, number>>,
        bounds: BBox,
        lastPassSeriesRect?: BBox
    ) {
        const visited: Partial<Record<AgCartesianAxisPosition, number>> = {};
        const newAxisWidths: Partial<Record<AgCartesianAxisPosition, number>> = {};
        const visibility: Partial<VisibilityMap> = {
            series: true,
            crossLines: true,
        };

        let clipSeries = false;
        const primaryTickCounts: Partial<Record<ChartAxisDirection, number>> = {};

        const paddedBounds = bounds.clone(); // Refactor
        const crossLinePadding = lastPassSeriesRect ? this.buildCrossLinePadding(axisWidths) : {};
        const axisBound = this.buildAxisBound(paddedBounds, axisWidths, crossLinePadding, visibility);
        const seriesRect = this.buildSeriesRect(axisBound, axisWidths);

        // Set the number of ticks for continuous axes based on the available range
        // before updating the axis domain via `this.updateAxes()` as the tick count has an effect on the calculated `nice` domain extent
        this.axes.forEach((axis) => {
            const { position = 'left' } = axis;

            const {
                clipSeries: newClipSeries,
                axisThickness,
                axisOffset,
            } = this.calculateAxisDimensions({
                axis,
                seriesRect,
                paddedBounds,
                axisWidths,
                newAxisWidths,
                primaryTickCounts,
                clipSeries,
                addInterAxisPadding: (visited[position] ?? 0) > 0,
            });

            visited[position] = (visited[position] ?? 0) + 1;
            clipSeries = clipSeries || newClipSeries;

            this.positionAxis({
                axis,
                axisBound,
                axisOffset,
                axisThickness,
                axisWidths,
                primaryTickCounts,
                seriesRect,
            });
        });

        return { clipSeries, seriesRect, axisWidths: newAxisWidths, visibility, primaryTickCounts };
    }

    private buildCrossLinePadding(axisWidths: Partial<Record<AgCartesianAxisPosition, number>>) {
        const crossLinePadding: Partial<Record<AgCartesianAxisPosition, number>> = {};

        this.axes.forEach((axis) => {
            if (axis.crossLines) {
                axis.crossLines.forEach((crossLine) => {
                    crossLine.calculatePadding(crossLinePadding);
                });
            }
        });
        // Reduce cross-line padding to account for overlap with axes.
        for (const [side, padding = 0] of Object.entries(crossLinePadding) as [AgCartesianAxisPosition, number][]) {
            crossLinePadding[side] = Math.max(padding - (axisWidths[side] ?? 0), 0);
        }

        return crossLinePadding;
    }

    private buildAxisBound(
        bounds: BBox,
        axisWidths: Partial<Record<AgCartesianAxisPosition, number>>,
        crossLinePadding: Partial<Record<AgCartesianAxisPosition, number>>,
        visibility: Partial<VisibilityMap>
    ) {
        const result = bounds.clone();
        const { top = 0, right = 0, bottom = 0, left = 0 } = crossLinePadding;
        const horizontalPadding = left + right;
        const verticalPadding = top + bottom;
        const totalWidth = (axisWidths.left ?? 0) + (axisWidths.right ?? 0) + horizontalPadding;
        const totalHeight = (axisWidths.top ?? 0) + (axisWidths.bottom ?? 0) + verticalPadding;
        if (result.width <= totalWidth || result.height <= totalHeight) {
            // Not enough space for crossLines and series
            visibility.crossLines = false;
            visibility.series = false;
            return result;
        }

        result.x += left;
        result.y += top;
        result.width -= horizontalPadding;
        result.height -= verticalPadding;

        return result;
    }

    private buildSeriesRect(axisBound: BBox, axisWidths: Partial<Record<AgCartesianAxisPosition, number>>) {
        const result = axisBound.clone();
        const { top, bottom, left, right } = axisWidths;
        result.x += left ?? 0;
        result.y += top ?? 0;
        result.width -= (left ?? 0) + (right ?? 0);
        result.height -= (top ?? 0) + (bottom ?? 0);

        // Width and height should not be negative.
        result.width = Math.max(0, result.width);
        result.height = Math.max(0, result.height);

        return result;
    }

    private clampToOutsideSeriesRect(seriesRect: BBox, value: number, dimension: 'x' | 'y', direction: -1 | 1) {
        const { x, y, width, height } = seriesRect;
        const clampBounds = [x, y, x + width, y + height];
        const compareTo = clampBounds[(dimension === 'x' ? 0 : 1) + (direction === 1 ? 0 : 2)];
        const clampFn = direction === 1 ? Math.min : Math.max;

        return clampFn(value, compareTo);
    }

    private calculateAxisDimensions(opts: {
        axis: ChartAxis;
        seriesRect: BBox;
        paddedBounds: BBox;
        axisWidths: Partial<Record<AgCartesianAxisPosition, number>>;
        newAxisWidths: Partial<Record<AgCartesianAxisPosition, number>>;
        primaryTickCounts: Partial<Record<ChartAxisDirection, number>>;
        clipSeries: boolean;
        addInterAxisPadding: boolean;
    }) {
        const { axis, seriesRect, paddedBounds, axisWidths, newAxisWidths, primaryTickCounts, addInterAxisPadding } =
            opts;
        let { clipSeries } = opts;
        const { position = 'left', direction } = axis;

        const axisLeftRightRange = (axis: ChartAxis) => {
            if (axis instanceof CategoryAxis || axis instanceof GroupedCategoryAxis) {
                return [0, seriesRect.height];
            }
            return [seriesRect.height, 0];
        };

        const axisOffset = newAxisWidths[position] ?? 0;
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

        clipSeries ||= axis.dataDomain.clipped || axis.visibleRange[0] > 0 || axis.visibleRange[1] < 1;

        let primaryTickCount = axis.nice ? primaryTickCounts[direction] : undefined;
        const isVertical = direction === ChartAxisDirection.Y;
        const paddedBoundsCoefficient = 0.3;

        axis.maxThickness =
            axis.thickness || (isVertical ? paddedBounds.width : paddedBounds.height) * paddedBoundsCoefficient;

        const layout = axis.calculateLayout(primaryTickCount);
        primaryTickCount = layout.primaryTickCount;
        primaryTickCounts[direction] ??= primaryTickCount;

        let axisThickness;
        if (axis.thickness != null && axis.thickness > 0) {
            axisThickness = axis.thickness;
        } else {
            const { bbox } = layout;
            axisThickness = isVertical ? bbox.width : bbox.height;
        }

        // for multiple axes in the same direction and position, apply padding at the top of each inner axis (i.e. between axes).
        const axisPadding = 15;
        if (addInterAxisPadding) {
            axisThickness += axisPadding;
        }
        axisThickness = Math.ceil(axisThickness);
        newAxisWidths[position] = (newAxisWidths[position] ?? 0) + axisThickness;

        axis.gridPadding = (axisWidths[position] ?? 0) - (newAxisWidths[position] ?? 0);

        return { clipSeries, axisThickness, axisOffset, primaryTickCount };
    }

    private positionAxis(opts: {
        axis: ChartAxis;
        axisBound: BBox;
        axisWidths: Partial<Record<AgCartesianAxisPosition, number>>;
        primaryTickCounts: Partial<Record<ChartAxisDirection, number>>;
        seriesRect: BBox;
        axisOffset: number;
        axisThickness: number;
    }) {
        const { axis, axisBound, axisWidths, seriesRect, axisOffset, axisThickness } = opts;
        const { position } = axis;

        switch (position) {
            case 'top':
                axis.translation.x = axisBound.x + (axisWidths.left ?? 0);
                axis.translation.y = this.clampToOutsideSeriesRect(
                    seriesRect,
                    axisBound.y + 1 + axisOffset + axisThickness,
                    'y',
                    1
                );
                break;
            case 'bottom':
                axis.translation.x = axisBound.x + (axisWidths.left ?? 0);
                axis.translation.y = this.clampToOutsideSeriesRect(
                    seriesRect,
                    axisBound.y + axisBound.height + 1 - axisThickness - axisOffset,
                    'y',
                    -1
                );
                break;
            case 'left':
                axis.translation.y = axisBound.y + (axisWidths.top ?? 0);
                axis.translation.x = this.clampToOutsideSeriesRect(
                    seriesRect,
                    axisBound.x + axisOffset + axisThickness,
                    'x',
                    1
                );
                break;
            case 'right':
                axis.translation.y = axisBound.y + (axisWidths.top ?? 0);
                axis.translation.x = this.clampToOutsideSeriesRect(
                    seriesRect,
                    axisBound.x + axisBound.width - axisThickness - axisOffset,
                    'x',
                    -1
                );
                break;
        }

        axis.updatePosition({ rotation: toRadians(axis.rotation), sideFlag: axis.label.getSideFlag() });
    }
}
