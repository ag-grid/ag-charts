import { _ModuleSupport } from 'ag-charts-community';
import { type NormalisedSeriesAreaBackgroundRegion, type Scale, ScaleAlignment, Vec4, createId } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

export class CartesianBackgroundRegion implements _ModuleSupport.BackgroundRegion {
    static readonly className = 'BackgroundRegion';
    readonly internalId = createId(this);

    xScale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;
    yScale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;

    readonly regionGroup = new _ModuleSupport.Group({ name: this.internalId });
    readonly labelGroup = new _ModuleSupport.Group({ name: this.internalId });

    private readonly regionNode = this.regionGroup.appendChild(new _ModuleSupport.Rect());

    private opts?: NormalisedSeriesAreaBackgroundRegion;

    setOptions(opts: NormalisedSeriesAreaBackgroundRegion) {
        this.opts = opts;
    }

    update(visible: boolean) {
        const { opts, xScale, yScale } = this;
        if (!opts || !xScale || !yScale || !visible) {
            this.regionGroup.visible = false;
            this.labelGroup.visible = false;
            return;
        }

        this.regionGroup.visible = true;
        this.labelGroup.visible = true;

        const bounds = this.getBounds();

        this.regionNode.x = bounds.x1;
        this.regionNode.y = bounds.y1;
        this.regionNode.width = Vec4.width(bounds);
        this.regionNode.height = Vec4.height(bounds);

        this.regionNode.fill = opts.fill;
        this.regionNode.fillOpacity = opts.fillOpacity ?? 1;
        this.regionNode.stroke = opts.stroke;
        this.regionNode.strokeOpacity = opts.strokeOpacity ?? 1;
        this.regionNode.strokeWidth = opts.strokeWidth ?? 1;
    }

    private getBounds() {
        const { opts, xScale, yScale } = this;
        if (!opts || !xScale || !yScale) return Vec4.origin();

        let x1 = xScale.convert(opts.xRange?.start, { alignment: ScaleAlignment.Leading });
        let y1 = yScale.convert(opts.yRange?.start, { alignment: ScaleAlignment.Leading });
        let x2 = xScale.convert(opts.xRange?.end, { alignment: ScaleAlignment.Trailing });
        let y2 = yScale.convert(opts.yRange?.end, { alignment: ScaleAlignment.Trailing });

        if (Number.isNaN(x1)) x1 = xScale.range[0];
        if (Number.isNaN(y1)) y1 = yScale.range[0];
        if (Number.isNaN(x2)) x2 = xScale.range[1];
        if (Number.isNaN(y2)) y2 = yScale.range[1];

        return Vec4.normalise(Vec4.from(x1, y1, x2, y2));
    }
}
