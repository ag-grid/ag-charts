import type { ChartOptions } from '../module/optionsModule';
import type { Scale } from '../scale/scale';
import { BBox } from '../scene/bbox';
import { Padding } from '../util/padding';
import { PolarAxis } from './axis/polarAxis';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
import { ChartAxisDirection } from './chartAxisDirection';
import { Layers } from './layers';
import { PolarSeries } from './series/polar/polarSeries';

export class PolarChart extends Chart {
    static readonly className = 'PolarChart';
    static readonly type = 'polar' as const;

    override padding = new Padding(40);

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);
        this.ctx.axisManager.axisGroup.zIndex = Layers.AXIS_FOREGROUND_ZINDEX;
    }

    override async performLayout() {
        const shrinkRect = await super.performLayout();

        const fullSeriesRect = shrinkRect.clone();
        this.computeSeriesRect(shrinkRect);
        await this.computeCircle(shrinkRect);
        this.axes.forEach((axis) => axis.update());

        this.hoverRect = shrinkRect;

        this.ctx.layoutService.dispatchLayoutComplete({
            type: 'layout-complete',
            chart: { width: this.ctx.scene.width, height: this.ctx.scene.height },
            clipSeries: false,
            series: { rect: fullSeriesRect, paddedRect: shrinkRect, visible: true },
            axes: [],
        });

        return shrinkRect;
    }

    protected updateAxes(cx: number, cy: number, radius: number) {
        const angleAxis = this.axes.find((axis) => axis.direction === ChartAxisDirection.X);
        const radiusAxis = this.axes.find((axis) => axis.direction === ChartAxisDirection.Y);
        if (!(angleAxis instanceof PolarAxis) || !(radiusAxis instanceof PolarAxis)) {
            return;
        }

        const angleScale: Scale<number, number> = angleAxis.scale;
        const angles = angleScale.ticks?.().map((value) => angleScale.convert(value));
        const innerRadiusRatio = radiusAxis.innerRadiusRatio;

        angleAxis.innerRadiusRatio = innerRadiusRatio;
        angleAxis.computeRange?.();
        angleAxis.gridLength = radius;

        radiusAxis.gridAngles = angles;
        radiusAxis.gridRange = angleAxis.range;
        radiusAxis.range = [radius, radius * innerRadiusRatio];

        [angleAxis, radiusAxis].forEach((axis) => {
            axis.translation.x = cx;
            axis.translation.y = cy;
            axis.calculateLayout();
        });
    }

    private computeSeriesRect(shrinkRect: BBox) {
        const {
            seriesArea: { padding },
        } = this;

        shrinkRect.shrink(padding.left, 'left');
        shrinkRect.shrink(padding.top, 'top');
        shrinkRect.shrink(padding.right, 'right');
        shrinkRect.shrink(padding.bottom, 'bottom');

        this.seriesRect = shrinkRect;
        this.animationRect = shrinkRect;
    }

    private async computeCircle(seriesBox: BBox) {
        const polarSeries = this.series.filter((series): series is PolarSeries<any, any, any> => {
            return series instanceof PolarSeries;
        });
        const polarAxes = this.axes.filter((axis): axis is PolarAxis => {
            return axis instanceof PolarAxis;
        });

        const setSeriesCircle = (cx: number, cy: number, r: number) => {
            this.updateAxes(cx, cy, r);
            polarSeries.forEach((series) => {
                series.centerX = cx;
                series.centerY = cy;
                series.radius = r;
            });

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

        const centerX = seriesBox.x + seriesBox.width / 2;
        const centerY = seriesBox.y + seriesBox.height / 2;
        const initialRadius = Math.max(0, Math.min(seriesBox.width, seriesBox.height) / 2);
        let radius = initialRadius;
        setSeriesCircle(centerX, centerY, radius);

        const shake = async ({ hideWhenNecessary = false } = {}) => {
            const labelBoxes = [];
            for (const series of [...polarAxes, ...polarSeries]) {
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

            if (refined.radius === radius) {
                return;
            }

            radius = refined.radius;
        };

        await shake(); // Initial attempt
        await shake(); // Precise attempt
        await shake(); // Just in case
        await shake({ hideWhenNecessary: true }); // Hide unnecessary labels
        await shake({ hideWhenNecessary: true }); // Final result

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
            centerX: seriesBox.x + (seriesBox.width - newWidth) / 2 + padLeft + newRadius,
            centerY: seriesBox.y + (seriesBox.height - newHeight) / 2 + padTop + newRadius,
            radius: newRadius,
        };
    }
}
