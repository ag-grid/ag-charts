import type { TextAlign, VerticalAlign } from 'ag-charts-types';

import type { LayoutContext } from '../module/baseModule';
import type { BBox } from '../scene/bbox';
import { sectorBox } from '../scene/util/sector';
import { isBetweenAngles, normalizeAngle360Inclusive } from '../util/angle';
import { Logger } from '../util/logger';
import { CartesianAxis } from './axis/cartesianAxis';
import { PolarAxis } from './axis/polarAxis';
import { Chart } from './chart';
import { ChartAxisDirection } from './chartAxisDirection';
import type { GaugeSeries, LinearGaugeSeries, RadialGaugeSeries } from './series/gaugeSeries';
import type { Series } from './series/series';

function isRadialGaugeSeries(series: Series<any, any>): series is RadialGaugeSeries {
    return series.type === 'radial-gauge';
}

function isLinearGaugeSeries(series: Series<any, any>): series is LinearGaugeSeries {
    return series.type === 'linear-gauge';
}

export class GaugeChart extends Chart {
    static readonly className = 'GaugeChart';
    static readonly type = 'gauge' as const;

    override getChartType() {
        return 'gauge' as const;
    }

    private updateRadialGauge(seriesRect: BBox, series: RadialGaugeSeries) {
        const angleAxis = this.axes.find((axis) => axis.direction === ChartAxisDirection.X);
        if (!(angleAxis instanceof PolarAxis)) return;

        angleAxis.computeRange();

        const seriesRectX0 = seriesRect.x;
        const seriesRectX1 = seriesRectX0 + seriesRect.width;
        const seriesRectY0 = seriesRect.y;
        const seriesRectY1 = seriesRectY0 + seriesRect.height;

        const [startAngle, endAngle] = angleAxis.range;
        const sweepAngle = normalizeAngle360Inclusive(endAngle - startAngle);
        const largerThanHalf = sweepAngle > Math.PI;
        const containsTop = largerThanHalf || isBetweenAngles(1.5 * Math.PI, startAngle, endAngle);
        const containsRight = largerThanHalf || isBetweenAngles(0.0 * Math.PI, startAngle, endAngle);
        const containsBottom = largerThanHalf || isBetweenAngles(0.5 * Math.PI, startAngle, endAngle);
        const containsLeft = largerThanHalf || isBetweenAngles(1.0 * Math.PI, startAngle, endAngle);

        let textAlign: TextAlign;
        if (containsLeft && !containsRight) {
            textAlign = 'right';
        } else if (!containsLeft && containsRight) {
            textAlign = 'left';
        } else {
            textAlign = 'center';
        }

        let verticalAlign: VerticalAlign;
        if (containsTop && !containsBottom) {
            verticalAlign = 'bottom';
        } else if (!containsTop && containsBottom) {
            verticalAlign = 'top';
        } else {
            verticalAlign = 'middle';
        }

        const unitBox = sectorBox({
            startAngle,
            endAngle,
            innerRadius: 0,
            outerRadius: 0.5,
        });
        const centerXOffset = -(unitBox.x + unitBox.width / 2) * 2;
        const centerYOffset = -(unitBox.y + unitBox.height / 2) * 2;
        const { minimumRadius = 0, maximumRadius } = series;
        const radiusBounds = Math.max(
            0.5 * Math.min(seriesRect.width / unitBox.width, seriesRect.height / unitBox.height),
            // seriesRect may have negative size
            0
        );
        let radius = Math.min(maximumRadius ?? Infinity, Math.max(radiusBounds, minimumRadius ?? 0));

        const MAX_ITERATIONS = 8;
        for (let i = 0; i < MAX_ITERATIONS; i += 1) {
            const isFinalIteration = radius <= minimumRadius || i === MAX_ITERATIONS - 1;

            const centerX = seriesRect.x + seriesRect.width / 2 + centerXOffset * radius;
            const centerY = seriesRect.y + seriesRect.height / 2 + centerYOffset * radius;

            angleAxis.translation.x = centerX;
            angleAxis.translation.y = centerY;

            angleAxis.gridLength = radius;
            angleAxis.calculateLayout();
            const bbox = angleAxis.computeLabelsBBox({ hideWhenNecessary: isFinalIteration }, seriesRect);

            if (isFinalIteration) break;

            let shrinkDelta = 0;
            if (bbox != null) {
                const bboxX0 = bbox.x + centerX;
                const bboxX1 = bboxX0 + bbox.width;
                const bboxY0 = bbox.y + centerY;
                const bboxY1 = bboxY0 + bbox.height;

                shrinkDelta = Math.max(
                    seriesRectY0 - bboxY0,
                    seriesRectX0 - bboxX0,
                    bboxY1 - seriesRectY1,
                    bboxX1 - seriesRectX1,
                    0
                );
            }

            if (shrinkDelta > 0) {
                radius = Math.max(radius - shrinkDelta, minimumRadius);
            } else {
                break;
            }
        }

        angleAxis.translation.x = seriesRect.x + seriesRect.width / 2 + centerXOffset * radius;
        angleAxis.translation.y = seriesRect.y + seriesRect.height / 2 + centerYOffset * radius;

        series.centerX = seriesRect.width / 2 + centerXOffset * radius;
        series.centerY = seriesRect.height / 2 + centerYOffset * radius;
        series.radius = radius;
        series.textAlign = textAlign;
        series.verticalAlign = verticalAlign;

        if (radius === 0 || radius > radiusBounds) {
            Logger.warnOnce('There was insufficient space to display the Radial Gauge.');
        }
    }

    private updateLinearGauge(seriesRect: BBox, series: LinearGaugeSeries) {
        const xAxis = this.axes.find((axis) => axis.direction === ChartAxisDirection.X);
        const yAxis = this.axes.find((axis) => axis.direction === ChartAxisDirection.Y);

        if (!(xAxis instanceof CartesianAxis)) return seriesRect;
        if (!(yAxis instanceof CartesianAxis)) return seriesRect;

        const { horizontal, thickness } = series;

        const width = Math.max(horizontal ? seriesRect.width : thickness, 0);
        const height = Math.max(horizontal ? thickness : seriesRect.height, 0);

        const x0 = seriesRect.x + (seriesRect.width - width) / 2;
        const y0 = seriesRect.y + (seriesRect.height - height) / 2;

        xAxis.range = [0, width];
        xAxis.gridLength = width;
        xAxis.calculateLayout();
        xAxis.translation.x = x0;
        xAxis.translation.y = y0 + (xAxis.position === 'bottom' ? thickness : 0);

        yAxis.range = [0, height];
        yAxis.gridLength = height;
        yAxis.calculateLayout();
        yAxis.translation.x = x0 + (yAxis.position === 'right' ? thickness : 0);
        yAxis.translation.y = y0;

        series.originX = x0 - seriesRect.x;
        series.originY = y0 - seriesRect.y;

        if (width === 0 || height === 0) {
            Logger.warnOnce('There was insufficient space to display the Linear Gauge.');
        }
    }

    protected performLayout(ctx: LayoutContext) {
        const { seriesRoot, annotationRoot, highlightRoot, series, seriesArea } = this;
        const { layoutBox } = ctx;
        const seriesRect = layoutBox.clone();

        layoutBox.shrink(seriesArea.padding.toJson());

        const firstSeries = this.series[0];
        if (isRadialGaugeSeries(firstSeries)) {
            this.updateRadialGauge(layoutBox, firstSeries);
        } else if (isLinearGaugeSeries(firstSeries)) {
            this.updateLinearGauge(layoutBox, firstSeries);
        }

        this.axes.forEach((axis) => axis.update());

        this.seriesRect = seriesRect.clone().translate(seriesRect.x - layoutBox.x, seriesRect.y - layoutBox.y);
        this.animationRect = layoutBox;
        seriesRoot.visible = series.some((s) => s.visible);

        for (const group of [seriesRoot, annotationRoot, highlightRoot]) {
            group.translationX = Math.floor(layoutBox.x);
            group.translationY = Math.floor(layoutBox.y);
        }

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: seriesRoot.visible, rect: seriesRect, paddedRect: layoutBox },
        });
    }

    protected override getAriaLabel(): string {
        const captions: string[] = [];

        const chartCaption = this.getCaptionText();
        if (chartCaption.length !== 0) {
            captions.push(chartCaption);
        }

        for (const series of this.series) {
            captions.push((series as GaugeSeries).getCaptionText());
        }

        const caption = captions.join('. ');

        return this.ctx.localeManager.t('ariaAnnounceGaugeChart', { caption });
    }
}
