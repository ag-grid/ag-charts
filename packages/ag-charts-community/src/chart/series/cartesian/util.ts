import type { Size } from 'ag-charts-core';
import type { AgSeriesSegmentation } from 'ag-charts-types';

import { BBox } from '../../../scene/bbox';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';

function isAxisReversed(axis: ChartAxis) {
    return axis.isReversed() !== axis.range[1] < axis.range[0];
}

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

    // The margin to use to ensure a clip path touches one side of the canvas,
    // and either exceeds or touches the other side.
    // It's required to use a margin here so a reverse-axis animation animates with the same center
    const horizontalMargin = Math.max(seriesRect.x, chartSize.width - (seriesRect.x + seriesRect.width));
    const verticalMargin = Math.max(seriesRect.y, chartSize.height - (seriesRect.y + seriesRect.height));

    // Helper function to get default bounds
    const getDefaultStart = () => {
        if (isAxisReversed(isXDirection ? xAxis : yAxis)) {
            return isXDirection ? seriesRect.width + horizontalMargin : seriesRect.height + verticalMargin;
        }
        return isXDirection ? -horizontalMargin : -verticalMargin;
    };

    const getDefaultStop = () => {
        if (isAxisReversed(isXDirection ? xAxis : yAxis)) {
            return isXDirection ? -horizontalMargin : -verticalMargin;
        }
        return isXDirection ? seriesRect.width + horizontalMargin : seriesRect.height + verticalMargin;
    };

    return segmentation.segments.map(({ stop, start, ...style }) => {
        // Calculate start and stop positions
        const startPos = start == null ? getDefaultStart() : scale.convert(start) - offset;
        const stopPos = stop == null ? getDefaultStop() : scale.convert(stop) + 2 * offset;

        // Calculate dimensions based on direction
        const x0 = isXDirection ? startPos : -horizontalMargin;
        const y0 = isXDirection ? -verticalMargin : startPos;
        const x1 = isXDirection ? stopPos + bandwidth : seriesRect.width + horizontalMargin;
        const y1 = isXDirection ? seriesRect.height + verticalMargin : stopPos + bandwidth;

        return { clipRect: { x0, y0, x1, y1 }, ...style };
    });
}
