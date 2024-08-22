import { PolarAxis } from '../module-support';
import type { LayoutContext } from '../module/baseModule';
import type { BBox } from '../scene/bbox';
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
        const seriesRectX0 = seriesRect.x;
        const seriesRectX1 = seriesRectX0 + seriesRect.width;
        const seriesRectY0 = seriesRect.y;
        const seriesRectY1 = seriesRectY0 + seriesRect.height;

        const centerX = seriesRect.x + seriesRect.width / 2;
        const centerY = seriesRect.y + seriesRect.height / 2;
        const angleAxis = this.axes.find((axis) => axis.direction === ChartAxisDirection.X);
        if (!(angleAxis instanceof PolarAxis)) return;

        angleAxis.computeRange();
        angleAxis.translation.x = centerX;
        angleAxis.translation.y = centerY;

        let radius = Math.min(seriesRect.width, seriesRect.height) / 2;
        angleAxis.gridLength = radius;
        angleAxis.calculateLayout();

        let MAX_ITERATIONS = 8;
        for (let i = 0; i < MAX_ITERATIONS; i += 1) {
            const bbox: BBox | null | undefined = angleAxis.computeLabelsBBox({ hideWhenNecessary: true }, seriesRect);

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
                radius -= shrinkDelta;
                angleAxis.gridLength = radius;
                angleAxis.calculateLayout();
            } else {
                break;
            }
        }

        series.radius = radius;
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
