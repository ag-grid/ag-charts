import type { AgSeriesSegmentation } from 'ag-charts-types';

import { BBox } from '../../../scene/bbox';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';

export function calculateSegments(
    segmentation: AgSeriesSegmentation,
    xAxis: ChartAxis,
    yAxis: ChartAxis,
    seriesRect: BBox,
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
    const domainStart = scale.domain[0];
    const domainEnd = scale.domain.at(-1);

    return segmentation.segments.map(({ stop, start, ...style }) => {
        const margin = (style.strokeWidth ?? 0) / 2;

        const startVal = start == null ? scale.convert(domainStart) - margin : scale.convert(start);
        const stopVal = stop == null ? scale.convert(domainEnd) - margin : scale.convert(stop);

        let x = isXDirection ? startVal - offset : -margin;
        let y = isXDirection ? -margin : startVal - offset;
        let width = isXDirection ? stopVal + 2 * offset + bandwidth - x : seriesRect.width + 2 * margin;
        let height = isXDirection ? seriesRect.height + 2 * margin : stopVal + 2 * offset + bandwidth - y;

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
