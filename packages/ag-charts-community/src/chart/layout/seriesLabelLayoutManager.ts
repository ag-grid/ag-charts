import type { BBox } from '../../scene/bbox';
import { type LabelBounds, type PlacedLabel, type PointLabelDatum, placeLabels } from '../../scene/util/labelPlacement';
import type { Padding } from '../../util/padding';

type LayoutResult = Map<string, PlacedLabel<PointLabelDatum>[]>;

export class SeriesLabelLayoutManager {
    private readonly labelData: Map<string, PointLabelDatum[]> = new Map();
    private readonly expectedSeriesId: Set<string> = new Set();
    private nextResult?: Promise<LayoutResult>;
    private nextResolve?: (r: LayoutResult) => void;
    private nextBounds?: LabelBounds;

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
        this.nextResult = new Promise((resolve) => {
            this.nextResolve = resolve;
        });
        this.nextBounds = {
            x: -padding.left,
            y: -padding.top,
            width: seriesRect.width + padding.left + padding.right,
            height: seriesRect.height + padding.top + padding.bottom,
        };
    }

    public placeLabels(seriesId: string, labelData: PointLabelDatum[]) {
        if (!this.expectedSeriesId.has(seriesId) || !this.nextResult) {
            throw new Error('AG Charts - unexpected state in placeLabels().');
        }

        this.labelData.set(seriesId, labelData);
        return this.nextResult;
    }

    public resolveLabels() {
        if (!this.nextResult || !this.nextResolve) {
            throw new Error('AG Charts - reset() not called before label placement started.');
        }

        this.nextResolve(this.performLabelLayout());
        this.nextResolve = undefined;

        return this.nextResult;
    }

    private performLabelLayout(padding = 5) {
        return placeLabels(this.labelData, this.nextBounds, padding);
    }
}
