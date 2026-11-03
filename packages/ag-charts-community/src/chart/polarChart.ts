import type { BBox, ChartAnimationPhase, Scale, SeriesChangeType } from 'ag-charts-core';
import { ChartAxisDirection, ZIndexMap, fitCircleToLabels, isFiniteNumber, isObject } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { ChartOptions } from '../module/optionsModule';
import { PolarChartAxes } from './chartAxes';
import { ChartAxesComponent } from './chartAxesComponent';
import type { ChartTypeHost, ChartTypeInstance } from './chartTypeEnv';
import type { LayoutContext } from './layout/layoutManager';
import { PolarSeries, type UnknownPolarSeries } from './series/polar/polarSeries';
import type { UnknownSeries } from './series/series';

export class PolarChartType implements ChartTypeInstance {
    static readonly type = 'polar' as const;
    readonly type = PolarChartType.type;

    private readonly axesComponent: ChartAxesComponent<PolarChartAxes>;

    constructor(private readonly host: ChartTypeHost) {
        this.axesComponent = new ChartAxesComponent(host.ctx, this.type, () => new PolarChartAxes());
        host.ctx.axisManager.axisGroup.zIndex = ZIndexMap.AXIS_FOREGROUND;
    }

    get axes() {
        return this.axesComponent.axes;
    }

    applyAxisOptions(
        options: AgChartOptions,
        chartOptions: ChartOptions,
        seriesStatus: SeriesChangeType,
        axesChanged: boolean
    ) {
        this.axesComponent.applyAxes(this.axesComponent, options, chartOptions, seriesStatus, axesChanged);
    }

    supportsLayoutOnlyDelta() {
        return this.axes.length > 0;
    }

    beforeProcessData() {
        const { series } = this.host;
        if (!series.some((s) => s.canHaveAxes)) return;
        this.axesComponent.assignAxesToSeries(series);
        this.axesComponent.assignSeriesToAxes(series);
    }

    beforeSeriesDomains() {
        this.axesComponent.processDomains();
    }

    getResizeUpdateType() {
        return this.axesComponent.getResizeUpdateType();
    }

    resetAnimations(phase: ChartAnimationPhase) {
        this.axesComponent.resetAnimations(phase);
    }

    destroy() {
        this.axesComponent.destroy();
    }

    async layout(ctx: LayoutContext) {
        const { host } = this;
        const seriesRect = ctx.layoutBox.clone().shrink(host.getSeriesAreaPadding());

        host.setLayoutRects(seriesRect, seriesRect);

        host.seriesRoot.translationX = seriesRect.x;
        host.seriesRoot.translationY = seriesRect.y;
        await this.computeCircle(seriesRect);
        for (const axis of this.axes) {
            axis.update();
        }

        let maxMarkerSize = 0;
        for (const series of host.series) {
            maxMarkerSize = Math.max(maxMarkerSize, getMarkerSize(series.options));
        }
        for (const series of filterPolarSeries(host.series)) {
            series.maxChartMarkerSize = maxMarkerSize;
        }

        host.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: true, rect: seriesRect, paddedRect: ctx.layoutBox },
            layoutBox: ctx.layoutBox,
        });
    }

    private updateAxes(seriesBox: BBox, cx: number, cy: number, radius: number) {
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
        const polarSeries = filterPolarSeries(this.host.series);
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

function filterPolarSeries(series: UnknownSeries[]): UnknownPolarSeries[] {
    const result: UnknownPolarSeries[] = [];
    for (const s of series) {
        if (s instanceof PolarSeries) result.push(s);
    }
    return result;
}

function getMarkerSize(options: object): number {
    if (!('marker' in options) || !isObject(options.marker)) return 0;
    const { size } = options.marker;
    return isFiniteNumber(size) ? size : 0;
}
