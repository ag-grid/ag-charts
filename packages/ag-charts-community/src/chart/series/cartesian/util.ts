import type { Size } from 'ag-charts-core';
import type { AgSeriesSegmentation } from 'ag-charts-types';

import { BBox } from '../../../scene/bbox';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';

export function calculateSegments(
    segmentation: AgSeriesSegmentation,
    xAxis: ChartAxis,
    yAxis: ChartAxis,
    seriesRect: BBox,
    chartSize: Size,
    applyOffset: boolean = true
) {
    if (segmentation.segments.length === 0) {
        return;
    }

    const axis = segmentation.key === ChartAxisDirection.X ? xAxis : yAxis;
    const { scale, direction } = axis;

    const isXDirection = direction === ChartAxisDirection.X;
    const bandwidth = scale.bandwidth ?? 0;
    const offset = applyOffset ? ((scale.step ?? 0) - bandwidth) / 2 : 0;
    const isReversed = axis.isReversed() || axis.range[1] < axis.range[0];

    const getDefaultStart = () => {
        if (isReversed) {
            return isXDirection ? chartSize.width : chartSize.height;
        }
        return isXDirection ? -seriesRect.x : -seriesRect.y;
    };

    const getDefaultStop = () => {
        if (isReversed) {
            return isXDirection ? -seriesRect.x : -seriesRect.y;
        }
        return isXDirection ? chartSize.width : chartSize.height;
    };

    return segmentation.segments.map(({ stop, start, ...style }) => {
        const startPos = start == null ? getDefaultStart() : scale.convert(start) - offset;
        const stopPos = stop == null ? getDefaultStop() : scale.convert(stop) + 2 * offset;

        const x = isXDirection ? startPos : -seriesRect.x;
        const y = isXDirection ? -seriesRect.y : startPos;
        const width = isXDirection ? stopPos + bandwidth - startPos : chartSize.width;
        const height = isXDirection ? chartSize.height : stopPos + bandwidth - startPos;

        const finalX = width < 0 ? x + width : x;
        const finalY = height < 0 ? y + height : y;
        const finalWidth = Math.abs(width);
        const finalHeight = Math.abs(height);

        return { clipRect: new BBox(finalX, finalY, finalWidth, finalHeight), ...style };
    });
}
