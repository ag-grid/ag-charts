import { Chart } from "./chart";
import { Node } from "../scene/node";
import { PolarSeries } from "./series/polar/polarSeries";
import { Padding } from "../util/padding";
import { BBox } from "../scene/bbox";

export class PolarChart extends Chart {
    static className = 'PolarChart';
    static type = 'polar' as const;

    padding = new Padding(40);

    constructor(document = window.document) {
        super(document);

        this.scene.root!.append(this.legend.group);
        this.padding.addEventListener('layoutChange', this.scheduleLayout, this);
    }

    get seriesRoot(): Node {
        return this.scene.root!;
    }

    performLayout(): void {
        const shrinkRect = new BBox(0, 0, this.width, this.height);

        this.positionCaptions();
        this.positionLegend();

        const captionAutoPadding = this.captionAutoPadding;
        shrinkRect.y += captionAutoPadding;
        shrinkRect.height -= captionAutoPadding;

        if (this.legend.enabled && this.legend.data.length) {
            const legendAutoPadding = this.legendAutoPadding;
            shrinkRect.x += legendAutoPadding.left;
            shrinkRect.y += legendAutoPadding.top;
            shrinkRect.width -= legendAutoPadding.left + legendAutoPadding.right;
            shrinkRect.height -= legendAutoPadding.top + legendAutoPadding.bottom;

            const legendPadding = this.legend.spacing;
            switch (this.legend.position) {
                case 'right':
                    shrinkRect.width -= legendPadding;
                    break;
                case 'bottom':
                    shrinkRect.height -= legendPadding;
                    break;
                case 'left':
                    shrinkRect.x += legendPadding;
                    shrinkRect.width -= legendPadding;
                    break;
                case 'top':
                    shrinkRect.y += legendPadding;
                    shrinkRect.height -= legendPadding;
                    break;
            }
        }

        const padding = this.padding;
        shrinkRect.x += padding.left;
        shrinkRect.y += padding.top;
        shrinkRect.width -= padding.left + padding.right;
        shrinkRect.height -= padding.top + padding.bottom;
        this.seriesRect = shrinkRect;

        const centerX = shrinkRect.x + shrinkRect.width / 2;
        const centerY = shrinkRect.y + shrinkRect.height / 2;
        const radius = Math.max(0, Math.min(shrinkRect.width, shrinkRect.height) / 2); // radius shouldn't be negative

        this.series.forEach(series => {
            if (series instanceof PolarSeries) {
                series.centerX = centerX;
                series.centerY = centerY;
                series.radius = radius;
                series.update();
            }
        });
    }
}
