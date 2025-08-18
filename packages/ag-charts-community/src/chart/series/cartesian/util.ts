import type { AgSeriesSegmentation } from 'ag-charts-types';

import { BBox } from '../../../scene/bbox';
import { findRangeExtent } from '../../../util/number';
import type { ChartAxisDirection } from '../../chartAxisDirection';
import { type Scaling } from './scaling';

export function calculateSegments(
    segmentation: AgSeriesSegmentation,
    scales: { [key in ChartAxisDirection]?: Scaling }
) {
    const { key } = segmentation;

    const yScale = scales['y'];
    const xScale = scales['x'];

    if (!yScale || !xScale) {
        return;
    }

    const seriesHeight = findRangeExtent(yScale.range);
    const seriesWidth = findRangeExtent(xScale.range);

    const isXDirection = key === 'x';
    const scale = isXDirection ? xScale : yScale;

    return calculateStopStart(segmentation, scale).map(({ stop, start, ...style }) => {
        let x = isXDirection ? scale.convert(start) : 0;
        let y = isXDirection ? 0 : scale.convert(start);
        let width = isXDirection ? scale.convert(stop) - x : seriesWidth;
        let height = isXDirection ? seriesHeight : scale.convert(stop) - y;

        if (width < 0) {
            x += width;
            width = -width;
        }
        if (height < 0) {
            y += height;
            height = -height;
        }

        return { clipRect: new BBox(x, y, width, height), ...style };
    });
}

function calculateStopStart(segmentation: AgSeriesSegmentation, scale: Scaling) {
    const domainStart = scale.domain[0];
    const domainEnd = scale.domain.at(-1);

    return segmentation.segments.map((segment) => {
        const { start = domainStart, stop = domainEnd, ...styles } = segment;

        return { ...styles, stop, start };
    });
}
