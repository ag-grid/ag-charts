import { type NormalisedSeriesAreaBackgroundRegion, type Scale, Vec4, createId } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import type { BackgroundRegion } from './backgroundRegion';

export class CartesianBackgroundRegion implements BackgroundRegion {
    static readonly className = 'BackgroundRegion';
    readonly internalId = createId(this);

    xScale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;
    yScale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;

    readonly regionGroup = new Group({ name: this.internalId });
    readonly labelGroup = new Group({ name: this.internalId });

    private readonly regionNode = this.regionGroup.appendChild(new Rect());

    private opts?: NormalisedSeriesAreaBackgroundRegion;

    setOptions(opts: NormalisedSeriesAreaBackgroundRegion) {
        this.opts = opts;
    }

    update(_visible: boolean) {
        const { opts, xScale, yScale } = this;
        if (!opts || !xScale || !yScale) {
            this.regionGroup.visible = false;
            this.labelGroup.visible = false;
            return;
        }

        const bounds = this.getBounds();

        this.regionNode.x = bounds.x1;
        this.regionNode.y = bounds.y1;
        this.regionNode.width = Vec4.width(bounds);
        this.regionNode.height = Vec4.height(bounds);

        this.regionNode.fill = opts.fill;
        this.regionNode.fillOpacity = 1; // TODO
    }

    private getBounds() {
        const { opts, xScale, yScale } = this;
        if (!opts || !xScale || !yScale) return Vec4.origin();

        let x1 = xScale.convert(opts.xRange?.start);
        let y1 = yScale.convert(opts.yRange?.start);
        let x2 = xScale.convert(opts.xRange?.end);
        let y2 = yScale.convert(opts.yRange?.end);

        if (Number.isNaN(x1)) x1 = xScale.range[0];
        if (Number.isNaN(y1)) y1 = yScale.range[0];
        if (Number.isNaN(x2)) x2 = xScale.range[1];
        if (Number.isNaN(y2)) y2 = yScale.range[1];

        return Vec4.normalise(Vec4.from(x1, y1, x2, y2));
    }
}
