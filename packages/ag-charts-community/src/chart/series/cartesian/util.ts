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
    const flag = isReversed ? -1 : 1;

    return segmentation.segments.map(({ stop, start, ...style }) => {
        if (start == null) {
            start = isXDirection ? -seriesRect.x : -seriesRect.y;
        } else {
            start = scale.convert(start) - offset;
        }

        if (stop == null) {
            stop = (isXDirection ? chartSize.width : chartSize.height) * flag;
        } else {
            stop = scale.convert(stop) + 2 * offset;
        }

        let x = isXDirection ? start : -seriesRect.x;
        let y = isXDirection ? -seriesRect.y : start;
        let width = isXDirection ? stop + bandwidth - x : chartSize.width;
        let height = isXDirection ? chartSize.height : stop + bandwidth - y;

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
