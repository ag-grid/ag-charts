import type { Scale } from 'ag-charts-core';
import { ChartAxisDirection, Padding, ZIndexMap, iterate } from 'ag-charts-core';

import type { ChartOptions } from '../module/optionsModule';
import { BBox } from '../scene/bbox';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
import { PolarChartAxes } from './chartAxes';
import type { LayoutContext } from './layout/layoutManager';
import { PolarSeries, type UnknownPolarSeries } from './series/polar/polarSeries';

export class PolarChart extends Chart {
    static override readonly className = 'PolarChart';
    static readonly type = 'polar' as const;

    override axes = this.createChartAxes();
    override createChartAxes() {
        return new PolarChartAxes();
    }

    override padding = new Padding(40);

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);
        this.ctx.axisManager.axisGroup.zIndex = ZIndexMap.AXIS_FOREGROUND;
    }

    override getChartType() {
        return 'polar' as const;
    }

    override isDataTransactionSupported() {
        return !this.series.some((s) => s.type === 'pie' || s.type === 'donut');
    }

    protected async performLayout(ctx: LayoutContext) {
        const seriesRect = ctx.layoutBox.clone().shrink(this.seriesArea.getPadding());

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
            maxMarkerSize = Math.max(maxMarkerSize, series.properties.marker?.size ?? 0);
        }
        for (const series of this.series.filter(isPolarSeries)) {
            series.maxChartMarkerSize = maxMarkerSize;
        }

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: true, rect: seriesRect, paddedRect: ctx.layoutBox },
        });
    }

    protected updateAxes(seriesBox: BBox, cx: number, cy: number, radius: number) {
        // pie & donut series do not have axes
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

    private async computeCircle(seriesBox: BBox) {
        const polarSeries = this.series.filter(isPolarSeries);

        const setSeriesCircle = (cx: number, cy: number, r: number) => {
            this.updateAxes(seriesBox, cx, cy, r);
            for (const series of polarSeries) {
                series.centerX = cx;
                series.centerY = cy;
                series.radius = r;
            }

            const pieSeries = polarSeries.filter((s) => s.type === 'donut' || s.type === 'pie');
            if (pieSeries.length > 1) {
                const innerRadii = pieSeries
                    .map((series) => {
                        const innerRadius = series.getInnerRadius();
                        return { series, innerRadius };
                    })
                    .sort((a, b) => a.innerRadius - b.innerRadius);
                innerRadii.at(-1)!.series.surroundingRadius = undefined;
                for (let i = 0; i < innerRadii.length - 1; i++) {
                    innerRadii[i].series.surroundingRadius = innerRadii[i + 1].innerRadius;
                }
            }
        };

        const centerX = seriesBox.width / 2;
        const centerY = seriesBox.height / 2;
        const initialRadius = Math.max(0, Math.min(seriesBox.width, seriesBox.height) / 2);
        let radius = initialRadius;
        setSeriesCircle(centerX, centerY, radius);

        const shake = async ({ hideWhenNecessary = false } = {}) => {
            const labelBoxes = [];
            for (const series of iterate(this.axes, polarSeries)) {
                const box = await series.computeLabelsBBox({ hideWhenNecessary }, seriesBox);
                if (box) {
                    labelBoxes.push(box);
                }
            }

            if (labelBoxes.length === 0) {
                setSeriesCircle(centerX, centerY, initialRadius);
                return;
            }

            const labelBox = BBox.merge(labelBoxes);
            const refined = this.refineCircle(labelBox, radius, seriesBox);
            setSeriesCircle(refined.centerX, refined.centerY, refined.radius);

            radius = refined.radius;
        };

        await shake(); // Initial attempt
        await shake(); // Precise attempt
        await shake(); // Just in case
        await shake({ hideWhenNecessary: true }); // Hide unnecessary labels
        await shake({ hideWhenNecessary: true }); // Final result

        // Must compute labels again in case last shake changed niceDomain
        for (const series of iterate(this.axes, polarSeries)) {
            await series.computeLabelsBBox({ hideWhenNecessary: true }, seriesBox);
        }

        return { radius, centerX, centerY };
    }

    private refineCircle(labelsBox: BBox, radius: number, seriesBox: BBox) {
        const minCircleRatio = 0.5; // Prevents reduced circle to be too small

        const circleLeft = -radius;
        const circleTop = -radius;
        const circleRight = radius;
        const circleBottom = radius;

        // Label padding around the circle
        let padLeft = Math.max(0, circleLeft - labelsBox.x);
        let padTop = Math.max(0, circleTop - labelsBox.y);
        let padRight = Math.max(0, labelsBox.x + labelsBox.width - circleRight);
        let padBottom = Math.max(0, labelsBox.y + labelsBox.height - circleBottom);

        padLeft = padRight = Math.max(padLeft, padRight);
        padTop = padBottom = Math.max(padTop, padBottom);

        // Available area for the circle (after the padding will be applied)
        const availCircleWidth = seriesBox.width - padLeft - padRight;
        const availCircleHeight = seriesBox.height - padTop - padBottom;

        let newRadius = Math.min(availCircleWidth, availCircleHeight) / 2;
        const minHorizontalRadius = (minCircleRatio * seriesBox.width) / 2;
        const minVerticalRadius = (minCircleRatio * seriesBox.height) / 2;
        const minRadius = Math.min(minHorizontalRadius, minVerticalRadius);
        if (newRadius < minRadius) {
            // If the radius is too small, reduce the label padding
            newRadius = minRadius;
            const horizontalPadding = padLeft + padRight;
            const verticalPadding = padTop + padBottom;
            if (2 * newRadius + verticalPadding > seriesBox.height) {
                const padHeight = seriesBox.height - 2 * newRadius;
                if (Math.min(padTop, padBottom) * 2 > padHeight) {
                    padTop = padHeight / 2;
                    padBottom = padHeight / 2;
                } else if (padTop > padBottom) {
                    padTop = padHeight - padBottom;
                } else {
                    padBottom = padHeight - padTop;
                }
            }

            if (2 * newRadius + horizontalPadding > seriesBox.width) {
                const padWidth = seriesBox.width - 2 * newRadius;
                if (Math.min(padLeft, padRight) * 2 > padWidth) {
                    padLeft = padWidth / 2;
                    padRight = padWidth / 2;
                } else if (padLeft > padRight) {
                    padLeft = padWidth - padRight;
                } else {
                    padRight = padWidth - padLeft;
                }
            }
        }

        const newWidth = padLeft + 2 * newRadius + padRight;
        const newHeight = padTop + 2 * newRadius + padBottom;

        return {
            centerX: (seriesBox.width - newWidth) / 2 + padLeft + newRadius,
            centerY: (seriesBox.height - newHeight) / 2 + padTop + newRadius,
            radius: newRadius,
        };
    }
}

function isPolarSeries(series: unknown): series is UnknownPolarSeries {
    return series instanceof PolarSeries;
}
