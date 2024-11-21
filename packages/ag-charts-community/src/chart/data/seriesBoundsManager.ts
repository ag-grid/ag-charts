import type { Scale } from '../../scale/scale';
import { findMinMax } from '../../util/number';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { ISeries } from '../series/seriesTypes';

interface IAxis {
    direction: ChartAxisDirection;
    scale: Scale<any, any>;
    boundSeries: ISeries<any, any>[];
}

export class SeriesBoundsManager {
    private axes: IAxis[] = [];

    public updateAxes(nextAxes: IAxis[]) {
        this.axes = nextAxes;
    }

    public yZoomForXZoom(zoom: [number, number], { padding = 0 } = {}) {
        const [z0, z1] = zoom;
        const seriesXRanges = new Map<any, [any, any]>();
        for (const axis of this.axes) {
            if (axis.direction !== ChartAxisDirection.X) continue;

            const { scale } = axis;
            let [x0, x1] = scale.range;
            const dx = x1 - x0;
            x1 = x0 + dx * z1;
            x0 = x0 + dx * z0;
            const xRange = [x0, x1] as [any, any];

            for (const series of axis.boundSeries) {
                seriesXRanges.set(series, xRange);
            }
        }

        let bounds0 = 1;
        let bounds1 = 0;
        for (const axis of this.axes) {
            if (axis.direction !== ChartAxisDirection.Y) continue;

            const { scale } = axis;
            const [r0, r1] = findMinMax(scale.range);
            const r = r1 - r0;

            for (const series of axis.boundSeries) {
                const xRange = seriesXRanges.get(series);
                if (xRange == null) continue;

                const yRange = series.getRange(ChartAxisDirection.Y, xRange);

                let y0 = scale.convert(yRange[0])?.valueOf();
                let y1 = scale.convert(yRange[1])?.valueOf();

                if (!Number.isFinite(y0) || !Number.isFinite(y1)) continue;

                y0 = (y0 - r0) / r;
                y1 = (y1 - r0) / r;
                bounds0 = Math.min(bounds0, Math.max(y0 - padding, 0), Math.max(y1 - padding, 0));
                bounds1 = Math.max(bounds1, Math.min(y0 + padding, 1), Math.min(y1 + padding, 1));
            }
        }

        if (bounds0 > bounds1) {
            return { min: 0, max: 1 };
        }

        return { min: 1 - bounds1, max: 1 - bounds0 };
    }
}
