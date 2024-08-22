import type { TextAlign, VerticalAlign } from 'ag-charts-types';

import type { LayoutContext } from '../module/baseModule';
import type { BBox } from '../scene/bbox';
import { isBetweenAngles, normalizeAngle360Inclusive } from '../util/angle';
import { PolarAxis } from './axis/polarAxis';
import { Chart } from './chart';
import { ChartAxisDirection } from './chartAxisDirection';
import type { RadialGaugeSeries } from './series/gaugeSeries';
import type { Series } from './series/series';

function isRadialGaugeSeries(series: Series<any, any>): series is RadialGaugeSeries {
    return series.type === 'radial-gauge';
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

        let centerXOffset = 0;
        let centerYOffset = 0;

        let textAlign: TextAlign;
        if (containsLeft && !containsRight) {
            textAlign = 'right';
            centerXOffset = 0.5;
        } else if (!containsLeft && containsRight) {
            textAlign = 'left';
            centerXOffset = -0.5;
        } else {
            textAlign = 'center';
        }

        let verticalAlign: VerticalAlign;
        if (containsTop && !containsBottom) {
            verticalAlign = 'bottom';
            centerYOffset = 0.5;
        } else if (!containsTop && containsBottom) {
            verticalAlign = 'top';
            centerYOffset = -0.5;
        } else {
            verticalAlign = 'middle';
        }

        const radiusFactor = verticalAlign === 'middle' || textAlign === 'center' ? 2 : 1;
        let radius = Math.min(seriesRect.width, seriesRect.height) / radiusFactor;

        const MAX_ITERATIONS = 8;
        for (let i = 0; i < MAX_ITERATIONS; i += 1) {
            const isFinalIteration = i === MAX_ITERATIONS - 1;

            const centerX = seriesRect.x + seriesRect.width / 2 + centerXOffset * radius;
            const centerY = seriesRect.y + seriesRect.height / 2 + centerYOffset * radius;

            angleAxis.translation.x = centerX;
            angleAxis.translation.y = centerY;

            angleAxis.gridLength = radius;
            angleAxis.calculateLayout();
            const bbox = angleAxis.computeLabelsBBox({ hideWhenNecessary: isFinalIteration }, seriesRect);

            let shrinkDelta = 0;
            if (!isFinalIteration && bbox != null) {
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
                radius -= shrinkDelta;
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
    }

    protected performLayout(ctx: LayoutContext) {
        const { seriesRoot, annotationRoot, highlightRoot, series, seriesArea } = this;
        const { layoutBox } = ctx;
        const seriesRect = layoutBox.clone();

        const radialGaugeSeries = this.series.find(isRadialGaugeSeries);
        if (radialGaugeSeries != null) {
            this.updateRadialGauge(seriesRect, radialGaugeSeries);
        }

        this.axes.forEach((axis) => axis.update());

        layoutBox.shrink(seriesArea.padding.toJson());

        this.seriesRect = layoutBox;
        this.animationRect = layoutBox;
        seriesRoot.visible = series.some((s) => s.visible);

        for (const group of [seriesRoot, annotationRoot, highlightRoot]) {
            group.translationX = Math.floor(layoutBox.x);
            group.translationY = Math.floor(layoutBox.y);
            group.setClipRectInGroupCoordinateSpace(seriesRect.clone());
        }

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: seriesRoot.visible, rect: seriesRect, paddedRect: layoutBox },
        });
    }
}
