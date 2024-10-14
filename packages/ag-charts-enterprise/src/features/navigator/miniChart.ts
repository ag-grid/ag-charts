import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const { Validate, BOOLEAN, POSITIVE_NUMBER, ZIndexMap, ActionOnSet, CategoryAxis, GroupedCategoryAxis, TextUtils } =
    _ModuleSupport;

const { Padding, Logger } = _Util;
const { Group, BBox, TranslatableLayer, Layer } = _Scene;

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
        new TranslatableLayer({ name: 'Series-root', zIndex: ZIndexMap.SERIES_LAYER })
    );
    readonly axisGridGroup = this.root.appendChild(new Layer({ name: 'Axes-Grids', zIndex: ZIndexMap.AXIS_GRID }));
    readonly axisGroup = this.root.appendChild(new Layer({ name: 'Axes-Grids', zIndex: ZIndexMap.AXIS_GRID }));
    readonly axisLabelGroup = this.root.appendChild(new Layer({ name: 'Axes-Labels', zIndex: ZIndexMap.SERIES_LABEL }));
    readonly axisCrosslineRangeGroup = this.root.appendChild(
        new Layer({ name: 'Axes-Crosslines-Range', zIndex: ZIndexMap.SERIES_CROSSLINE_RANGE })
    );
    readonly axisCrosslineLineGroup = this.root.appendChild(
        new Layer({ name: 'Axes-Crosslines-Line', zIndex: ZIndexMap.SERIES_CROSSLINE_LINE })
    );
    readonly axisCrosslineLabelGroup = this.root.appendChild(
        new Layer({ name: 'Axes-Crosslines-Label', zIndex: ZIndexMap.SERIES_LABEL })
    );

    public data: any = [];

    private _destroyed: boolean = false;

    private miniChartAnimationPhase: 'initial' | 'ready' = 'initial';

    @ActionOnSet<MiniChart>({
        changeValue(newValue: _ModuleSupport.ChartAxis[], oldValue: _ModuleSupport.ChartAxis[] = []) {
            const axisNodes = {
                axisNode: this.axisGroup,
                gridNode: this.axisGridGroup,
                labelNode: this.axisLabelGroup,
                crossLineLineNode: this.axisCrosslineLineGroup,
                crossLineRangeNode: this.axisCrosslineRangeGroup,
                crossLineLabelNode: this.axisCrosslineLabelGroup,
            };

            for (const axis of oldValue) {
                if (newValue.includes(axis)) continue;
                axis.detachAxis(axisNodes);
                axis.destroy();
            }

            for (const axis of newValue) {
                if (oldValue?.includes(axis)) continue;

                axis.attachAxis(axisNodes);
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

            if (series.rootGroup.isRoot()) {
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
            series.rootGroup?.remove();
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

    updateData(data: any) {
        this.series.forEach((s) => s.setChartData(data));
        if (this.miniChartAnimationPhase === 'initial') {
            this.ctx.animationManager.onBatchStop(() => {
                this.miniChartAnimationPhase = 'ready';
                // Disable animations after initial load.
                this.series.forEach((s) => s.resetAnimation('disabled'));
            });
        }
    }

    async processData(dataController: _ModuleSupport.DataController) {
        if (this.series.some((s) => s.canHaveAxes)) {
            this.assignAxesToSeries();
            this.assignSeriesToAxes();
        }
        await Promise.all(this.series.map((s) => s.processData(dataController)));
    }

    computeAxisPadding() {
        const padding = new Padding();
        if (!this.enabled) {
            return padding;
        }

        this.axes.forEach(({ position, thickness = 0, line, label }) => {
            if (position == null) return;

            let size: number;
            if (thickness > 0) {
                size = thickness;
            } else {
                // Because of the rotation technique used by axes rendering labels are padded 5px off,
                // which need to be account for in these calculations to make sure labels aren't being clipped.
                // This will become obsolete only once axes rotation technique would be removed.
                const rotationPaddingFix = 5;
                size =
                    (line.enabled ? line.width : 0) +
                    (label.enabled
                        ? TextUtils.getLineHeight(label.fontSize ?? 0) + label.padding + rotationPaddingFix
                        : 0);
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
        this.seriesRoot.setClipRect(new BBox(0, -padding.top, width, height), false);

        this.axes.forEach((axis) => {
            const { position = 'left' } = axis;
            switch (position) {
                case 'top':
                case 'bottom':
                    axis.range = [0, seriesRect.width];
                    axis.gridLength = seriesRect.height;
                    break;
                case 'right':
                case 'left': {
                    const isCategoryAxis = axis instanceof CategoryAxis || axis instanceof GroupedCategoryAxis;
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

            axis.calculateLayout();
            axis.updatePosition();
            axis.update(animated);
        });

        await Promise.all(this.series.map((series) => series.update({ seriesRect })));
    }

    // Should be available after the first layout.
    protected seriesRect?: _Scene.BBox;
}
