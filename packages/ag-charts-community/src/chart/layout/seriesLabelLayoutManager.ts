import type { BBox } from '../../scene/bbox';
import { type LabelBounds, type PointLabelDatum, placeLabels } from '../../scene/util/labelPlacement';
import type { Padding } from '../../util/padding';

export class SeriesLabelLayoutManager {
    private readonly labelData: Map<string, PointLabelDatum[]> = new Map();
    private readonly expectedSeriesId: Set<string> = new Set();
    private bounds?: LabelBounds;

    public reset(expectedSeriesId: string[], seriesRect: BBox, padding: Padding) {
        this.expectedSeriesId.clear();
        for (const seriesId of expectedSeriesId) {
            this.expectedSeriesId.add(seriesId);
        }
        for (const seriesId of this.labelData.keys()) {
            if (!this.expectedSeriesId.has(seriesId)) {
                this.labelData.delete(seriesId);
            }
        }
        this.bounds = {
            x: -padding.left,
            y: -padding.top,
            width: seriesRect.width + padding.left + padding.right,
            height: seriesRect.height + padding.top + padding.bottom,
        };
    }

    public placeLabels(seriesId: string, labelData: PointLabelDatum[]) {
        if (!this.expectedSeriesId.has(seriesId)) {
            throw new Error('Unexpected state in placeLabels(), seriesId not recognized: ' + seriesId);
        }

        this.labelData.set(seriesId, labelData);
    }

    public resolveLabels(padding = 5) {
        return placeLabels(this.labelData, this.bounds, padding);
    }
}
