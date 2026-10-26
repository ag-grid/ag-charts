import type { BBox, CanvasPoint, Scale } from 'ag-charts-core';
import { ChartAxisDirection, ZIndexMap, fitCircleToLabels } from 'ag-charts-core';
import type { AgCoordinates } from 'ag-charts-types';

import type { ChartOptions } from '../module/optionsModule';
import type { PolarAxis } from './axis/polarAxis';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
import { PolarChartAxes } from './chartAxes';
import type { LayoutContext } from './layout/layoutManager';
import { PolarSeries, type UnknownPolarSeries } from './series/polar/polarSeries';
import type { Series } from './series/series';
import type { SeriesNodeDatum } from './series/seriesTypes';

export class PolarChart extends Chart {
    static override readonly className = 'PolarChart';
    static readonly type = 'polar' as const;

    declare series: Series<SeriesNodeDatum, { marker?: { size?: number } }>[];

    declare axes: PolarChartAxes;
    override createChartAxes() {
        return new PolarChartAxes();
    }

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);
        this.ctx.axisManager.axisGroup.zIndex = ZIndexMap.AXIS_FOREGROUND;
    }

    override onAxisChange(newValue: PolarAxis[], oldValue?: PolarAxis[]) {
        super.onAxisChange(newValue, oldValue);
        if (this.ctx == null) return;

        // Registered here rather than by the axis, matching the cartesian chart.
        const { labelManager } = this.ctx;
        for (const axis of oldValue ?? []) {
            labelManager.unregisterSource(axis.labelSource.id, axis.labelSource);
        }
        for (const axis of newValue) {
            labelManager.registerSource(axis.labelSource);
        }
    }

    override toAgCoordinates(_point: CanvasPoint): AgCoordinates | undefined {
        return undefined; // TODO: stub
    }

    override getChartType() {
        return 'polar' as const;
    }

    protected async performLayout(ctx: LayoutContext) {
        const seriesRect = ctx.layoutBox.clone().shrink(this.getSeriesAreaPadding());

        this.seriesRect = seriesRect;
        this.animationRect = seriesRect;

        this.seriesRoot.translationX = seriesRect.x;
        this.seriesRoot.translationY = seriesRect.y;
        await this.computeCircle(seriesRect);
        for (const axis of this.axes) {
            axis.update();
        }

        let maxMarkerSize = 0;
        for (const series of this.series) {
            maxMarkerSize = Math.max(maxMarkerSize, series.options.marker?.size ?? 0);
        }
        for (const series of filterPolarSeries(this.series)) {
            series.maxChartMarkerSize = maxMarkerSize;
        }

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: true, rect: seriesRect, paddedRect: ctx.layoutBox },
            layoutBox: ctx.layoutBox,
        });
    }

    protected updateAxes(seriesBox: BBox, cx: number, cy: number, radius: number) {
        if (this.axes.length === 0) return;

        const angleAxis = this.axes[ChartAxisDirection.Angle];
        const radiusAxis = this.axes[ChartAxisDirection.Radius];

        const angleScale: Scale<number, number> = angleAxis.scale;
        const innerRadiusRatio = radiusAxis.innerRadiusRatio;

        angleAxis.innerRadiusRatio = innerRadiusRatio;
        angleAxis.computeRange();
        angleAxis.gridLength = radius;

        radiusAxis.gridAngles = angleScale
            .ticks({
                nice: [angleAxis.nice, angleAxis.nice],
                interval: undefined,
                tickCount: undefined,
                minTickCount: 0,
                maxTickCount: Infinity,
            })
            ?.ticks?.map((value) => angleScale.convert(value));
        radiusAxis.gridRange = angleAxis.range;
        radiusAxis.range = [radius, radius * innerRadiusRatio];

        for (const axis of [angleAxis, radiusAxis]) {
            axis.translation.x = seriesBox.x + cx;
            axis.translation.y = seriesBox.y + cy;
            axis.calculateLayout();
        }
    }

    private computeCircle(seriesBox: BBox) {
        const polarSeries = filterPolarSeries(this.series);
        return fitCircleToLabels(seriesBox, [...this.axes, ...polarSeries], (cx, cy, r) => {
            this.updateAxes(seriesBox, cx, cy, r);
            for (const series of polarSeries) {
                series.centerX = cx;
                series.centerY = cy;
                series.radius = r;
            }
        });
    }
}

function filterPolarSeries(series: any[]): UnknownPolarSeries[] {
    return series.filter((s: any): s is UnknownPolarSeries => s instanceof PolarSeries);
}
