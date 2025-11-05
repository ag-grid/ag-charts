import type { ChartOptions } from '../module/optionsModule';
import { BBox } from '../scene/bbox';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
import type { LayoutContext } from './layout/layoutManager';
import type { SeriesArea } from './series-area/seriesArea';
import type { PolarSeries } from './series/polar/polarSeries';

export class StandaloneChart extends Chart {
    static readonly className = 'StandaloneChart';
    static readonly type = 'standalone' as const;

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);
    }

    override getChartType() {
        return 'standalone' as const;
    }

    protected async performLayout(ctx: LayoutContext) {
        const { seriesRoot, annotationRoot } = this;
        const seriesArea = this.modulesManager.getModule('seriesArea') as SeriesArea;
        const seriesRect = ctx.layoutBox.clone().shrink(seriesArea.getPadding());

        this.seriesRect = seriesRect;
        this.animationRect = seriesRect;

        for (const group of [seriesRoot, annotationRoot]) {
            group.translationX = Math.floor(seriesRect.x);
            group.translationY = Math.floor(seriesRect.y);
        }

        seriesRoot.visible = this.series[0]?.visible ?? true;

        // Handle pie/donut series layout
        await this.layoutPieSeries(seriesRect);

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: true, rect: seriesRect, paddedRect: ctx.layoutBox },
        });
    }

    private async layoutPieSeries(seriesRect: BBox) {
        // Check if we have pie/donut series
        const pieSeries = this.series.filter(
            (s): s is PolarSeries<any, any, any, any> => s.type === 'pie' || s.type === 'donut'
        );

        if (pieSeries.length === 0) return;

        const centerX = seriesRect.width / 2;
        const centerY = seriesRect.height / 2;
        const initialRadius = Math.max(0, Math.min(seriesRect.width, seriesRect.height) / 2);
        let radius = initialRadius;

        const setSeriesCircle = (cx: number, cy: number, r: number) => {
            for (const series of pieSeries) {
                series.centerX = cx;
                series.centerY = cy;
                series.radius = r;
            }

            // Handle multi-series concentric layout
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

        setSeriesCircle(centerX, centerY, radius);

        // Compute labels and adjust circle to fit
        const shake = async ({ hideWhenNecessary = false } = {}) => {
            const labelBoxes = [];
            for (const series of pieSeries) {
                const box = await series.computeLabelsBBox({ hideWhenNecessary }, seriesRect);
                if (box) {
                    labelBoxes.push(box);
                }
            }

            if (labelBoxes.length === 0) {
                setSeriesCircle(centerX, centerY, initialRadius);
                return;
            }

            const labelBox = BBox.merge(labelBoxes);
            const refined = this.refineCircle(labelBox, radius, seriesRect);
            setSeriesCircle(refined.centerX, refined.centerY, refined.radius);

            radius = refined.radius;
        };

        await shake(); // Initial attempt
        await shake(); // Precise attempt
        await shake(); // Just in case
        await shake({ hideWhenNecessary: true }); // Hide unnecessary labels
        await shake({ hideWhenNecessary: true }); // Final result

        // Must compute labels again in case last shake changed parameters
        for (const series of pieSeries) {
            await series.computeLabelsBBox({ hideWhenNecessary: true }, seriesRect);
        }
    }

    private refineCircle(labelsBox: BBox, radius: number, seriesBox: BBox) {
        const minCircleRatio = 0.5; // Prevents reduced circle from being too small

        const centerX = seriesBox.width / 2;
        const centerY = seriesBox.height / 2;

        const labelsX = labelsBox.x;
        const labelsY = labelsBox.y;
        const labelsWidth = labelsBox.width;
        const labelsHeight = labelsBox.height;

        const availableWidth = seriesBox.width;
        const availableHeight = seriesBox.height;

        const outerCircleWidth = labelsWidth;
        const outerCircleHeight = labelsHeight;

        const circleLeft = labelsX;
        const circleTop = labelsY;
        const circleRight = labelsX + labelsWidth;
        const circleBottom = labelsY + labelsHeight;

        const refinedCenterX = (circleLeft + circleRight) / 2;
        const refinedCenterY = (circleTop + circleBottom) / 2;

        const dx = refinedCenterX - centerX;
        const dy = refinedCenterY - centerY;
        const maxShift = radius / 2;
        const shiftX = Math.max(-maxShift, Math.min(maxShift, dx));
        const shiftY = Math.max(-maxShift, Math.min(maxShift, dy));

        const finalCenterX = centerX + shiftX;
        const finalCenterY = centerY + shiftY;

        const leftMargin = finalCenterX - circleLeft;
        const rightMargin = availableWidth - (circleRight - finalCenterX);
        const topMargin = finalCenterY - circleTop;
        const bottomMargin = availableHeight - (circleBottom - finalCenterY);

        const minMargin = Math.min(leftMargin, rightMargin, topMargin, bottomMargin);
        const minRadius = radius * minCircleRatio;
        const refinedRadius = Math.max(minRadius, radius + minMargin);

        return {
            centerX: finalCenterX,
            centerY: finalCenterY,
            radius: refinedRadius,
        };
    }

    protected override getAriaLabel(): string {
        const caption = this.getCaptionText();
        return this.ctx.localeManager.t('ariaAnnounceStandaloneChart', { caption });
    }
}
