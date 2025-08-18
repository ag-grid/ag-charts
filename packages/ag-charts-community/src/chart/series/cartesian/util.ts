import type { AgSeriesSegmentation } from 'ag-charts-types';

import type { Scale } from '../../../scale/scale';
import { BBox } from '../../../scene/bbox';
import { findRangeExtent } from '../../../util/number';
import type { ChartAxisDirection } from '../../chartAxisDirection';

export function calculateSegments(
    segmentation: AgSeriesSegmentation,
    scales: { [key in ChartAxisDirection.X | ChartAxisDirection.Y]: Scale<unknown, number> },
    applyOffset: boolean = true
) {
    const { key } = segmentation;

    const yScale = scales['y'];
    const xScale = scales['x'];

    if (!yScale || !xScale || segmentation.segments.length === 0) {
        return;
    }

    const seriesHeight = findRangeExtent(yScale.range);
    const seriesWidth = findRangeExtent(xScale.range);

    const isXDirection = key === 'x';
    const scale = isXDirection ? xScale : yScale;
    const bandwidth = scale.bandwidth ?? 0;
    const offset = applyOffset ? ((scale.step ?? 0) - bandwidth) / 2 : 0;

    return calculateStopStart(segmentation, scale).map(({ stop, start, ...style }) => {
        let x = isXDirection ? scale.convert(start) - offset : 0;
        let y = isXDirection ? 0 : scale.convert(start) - offset;
        let width = isXDirection ? scale.convert(stop) + 2 * offset + bandwidth - x : seriesWidth;
        let height = isXDirection ? seriesHeight : scale.convert(stop) + 2 * offset + bandwidth - y;

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

function calculateStopStart(segmentation: AgSeriesSegmentation, scale: Scale<unknown, number>) {
    const domainStart = scale.domain[0];
    const domainEnd = scale.domain.at(-1);

    return segmentation.segments.map((segment) => {
        const { start = domainStart, stop = domainEnd, ...styles } = segment;

        return { ...styles, stop, start };
    });
}
