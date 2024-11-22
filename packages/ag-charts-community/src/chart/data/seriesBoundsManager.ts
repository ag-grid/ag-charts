import type { Scale } from '../../scale/scale';
import { findMinMax } from '../../util/number';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { ISeries } from '../series/seriesTypes';

interface IAxis {
    direction: ChartAxisDirection;
    scale: Scale<any, any>;
    range: [number, number];
    boundSeries: ISeries<any, any>[];
}

export class SeriesBoundsManager {
    private axes: IAxis[] = [];

    public updateAxes(nextAxes: IAxis[]) {
        this.axes = nextAxes;
    }

    private zoomBounds(xAxis: IAxis, yAxis: IAxis, { min, max }: { min: number; max: number }, padding: number) {
        const xScale = xAxis.scale;
        let [x0, x1] = xScale.range;
        const dx = x1 - x0;
        x1 = x0 + dx * max;
        x0 = x0 + dx * min;
        const xRange = [x0, x1] as [any, any];

        const yScale = yAxis.scale;
        const [r0, r1] = findMinMax(yScale.range);
        const r = r1 - r0;

        const height = Math.max(...yAxis.range);
        const zoomPadding = (height * padding) / r;

        let bounds0 = 1;
        let bounds1 = 0;
        for (const series of yAxis.boundSeries) {
            const yRange = series.getRange(ChartAxisDirection.Y, xRange);

            let y0 = yScale.convert(yRange[0])?.valueOf();
            let y1 = yScale.convert(yRange[1])?.valueOf();
            if (!Number.isFinite(y0) || !Number.isFinite(y1)) continue;

            [y0, y1] = findMinMax([y0, y1]);
            y0 = (y0 - r0) / r;
            y1 = (y1 - r0) / r;

            const { connectsToYAxis } = series;
            if (!connectsToYAxis || yRange[1] > 0) y0 = Math.max(y0 - zoomPadding, 0);
            if (!connectsToYAxis || yRange[0] < 0) y1 = Math.min(y1 + zoomPadding, 1);

            bounds0 = Math.min(bounds0, y0);
            bounds1 = Math.max(bounds1, y1);
        }

        return [bounds0, bounds1];
    }

    private boundsZoom(bounds0: number, bounds1: number) {
        if (bounds0 > bounds1) {
            return { min: 0, max: 1 };
        }

        return { min: 1 - bounds1, max: 1 - bounds0 };
    }

    public primaryAxisZoom(direction: ChartAxisDirection, zoom: { min: number; max: number }, { padding = 0 } = {}) {
        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;

        const xAxis = this.axes.find((axis) => axis.direction === crossDirection);
        const yAxis = this.axes.find((axis) => axis.direction === direction);

        if (xAxis == null || yAxis == null) return { min: 0, max: 1 };

        const [y0, y1] = this.zoomBounds(xAxis, yAxis, zoom, padding);
        return this.boundsZoom(y0, y1);
    }

    public combinedAxisZoom(direction: ChartAxisDirection, zoom: { min: number; max: number }, { padding = 0 } = {}) {
        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;

        const seriesXAxes = new Map<any, IAxis>();
        for (const xAxis of this.axes) {
            if (xAxis.direction !== crossDirection) continue;

            for (const series of xAxis.boundSeries) {
                seriesXAxes.set(series, xAxis);
            }
        }

        let bounds0 = 1;
        let bounds1 = 0;
        for (const yAxis of this.axes) {
            if (yAxis.direction !== direction) continue;

            for (const series of yAxis.boundSeries) {
                const xAxis = seriesXAxes.get(series);
                if (xAxis == null) continue;

                const [y0, y1] = this.zoomBounds(xAxis, yAxis, zoom, padding);
                bounds0 = Math.min(bounds0, y0);
                bounds1 = Math.max(bounds1, y1);
            }
        }

        return this.boundsZoom(bounds0, bounds1);
    }
}
