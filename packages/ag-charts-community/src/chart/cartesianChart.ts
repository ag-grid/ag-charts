import type { AgBaseAxisOptions, AgCartesianAxisPosition } from 'ag-charts-types';

import type { LayoutContext } from '../module/baseModule';
import { staticFromToMotion } from '../motion/fromToMotion';
import type { BBox } from '../scene/bbox';
import { CartesianAxis } from './axis/cartesianAxis';
import { CartesianAxesManager } from './cartesianAxesManager';
import { Chart } from './chart';
import type { ChartAxis } from './chartAxis';
import { CartesianSeries } from './series/cartesian/cartesianSeries';
import type { Series } from './series/series';

export class CartesianChart extends Chart {
    static readonly className = 'CartesianChart';
    static readonly type = 'cartesian';

    /** Integrated Charts feature state - not used in Standalone Charts. */
    public readonly paired: boolean = true;

    private lastUpdateClipRect?: BBox;
    private firstSeriesTranslation = true;

    protected axesManager = new CartesianAxesManager(this.ctx);

    override destroySeries(series: Series<any, any>[]) {
        this.firstSeriesTranslation = true;
        super.destroySeries(series);
    }

    override getChartType() {
        return 'cartesian' as const;
    }

    protected override createAxis(options: AgBaseAxisOptions[], skip: string[]) {
        const newAxes = super.createAxis(options, skip);
        const guesses: AgCartesianAxisPosition[] = ['top', 'right', 'bottom', 'left'];
        const usedPositions = new Set<AgCartesianAxisPosition>();
        const invalidAxes: ChartAxis[] = [];

        for (const axis of newAxes) {
            if (axis instanceof CartesianAxis) {
                if (guesses.includes(axis.position)) {
                    usedPositions.add(axis.position);
                } else {
                    invalidAxes.push(axis);
                }
            }
        }

        for (const axis of invalidAxes) {
            let nextGuess: AgCartesianAxisPosition | undefined;
            do {
                nextGuess = guesses.pop();
            } while (nextGuess && usedPositions.has(nextGuess));
            if (nextGuess == null) break;
            axis.position = nextGuess;
        }

        return newAxes;
    }

    protected performLayout(ctx: LayoutContext) {
        const { firstSeriesTranslation, seriesRoot, annotationRoot } = this;
        const { seriesRect, visibility, clipSeries } = this.axesManager.updateAxes(
            this.axes,
            ctx.layoutBox,
            this.seriesArea.padding,
            this.seriesRect?.clone()
        );

        for (const axis of this.axes) {
            // update visibility of crossLines
            axis.setCrossLinesVisible(visibility);
        }

        this.seriesRoot.visible = visibility;
        this.seriesRect = seriesRect;
        this.animationRect = ctx.layoutBox;

        const { x, y } = seriesRect;
        if (firstSeriesTranslation) {
            // For initial rendering, don't animate.
            for (const group of [seriesRoot, annotationRoot]) {
                group.translationX = Math.floor(x);
                group.translationY = Math.floor(y);
            }
            this.firstSeriesTranslation = false;
        } else {
            // Animate seriesRect movements - typically caused by axis size changes.
            const { translationX, translationY } = seriesRoot;
            staticFromToMotion(
                this.id,
                'seriesRect',
                this.ctx.animationManager,
                [seriesRoot, annotationRoot],
                { translationX, translationY },
                { translationX: Math.floor(x), translationY: Math.floor(y) },
                { phase: 'update' }
            );
        }

        // Recreate padding object to prevent issues with getters in `BBox.shrink()`
        const seriesPaddedRect = seriesRect.clone().grow(this.seriesArea.padding);

        const clipRect = this.seriesArea.clip || clipSeries ? seriesPaddedRect : undefined;
        const { lastUpdateClipRect } = this;
        this.lastUpdateClipRect = clipRect;

        if (this.ctx.animationManager.isActive() && lastUpdateClipRect != null) {
            this.ctx.animationManager.animate({
                id: this.id,
                groupId: 'clip-rect',
                phase: 'update',
                from: lastUpdateClipRect,
                to: seriesPaddedRect,
                onUpdate: (interpolatedClipRect) => this.setRootClipRects(interpolatedClipRect),
                onComplete: () => this.setRootClipRects(clipRect),
            });
        } else {
            this.setRootClipRects(clipRect);
        }

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            axes: this.axes.map((axis) => axis.getLayoutState()),
            series: {
                rect: seriesRect,
                paddedRect: seriesPaddedRect,
                visible: visibility,
                shouldFlipXY: this.shouldFlipXY(),
            },
            clipSeries,
        });
    }

    private setRootClipRects(clipRect?: BBox) {
        this.seriesRoot.setClipRect(clipRect);
        this.annotationRoot.setClipRect(clipRect);
    }

    private shouldFlipXY() {
        // Only flip the xy axes if all the series agree on flipping
        return this.series.every((series) => series instanceof CartesianSeries && series.shouldFlipXY());
    }
}
