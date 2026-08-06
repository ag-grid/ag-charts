import { BaseProperties, Property, type Scale, createId } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit, CssColor } from 'ag-charts-types';

import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import type { BackgroundRegion } from './backgroundRegion';

export class CartesianBackgroundRegion extends BaseProperties implements BackgroundRegion {
    static readonly className = 'BackgroundRegion';
    readonly internalId = createId(this);

    @Property
    fill?: CssColor = undefined;

    // @Property
    // label?: BackgroundRegionLabel;

    // xRange?: BackgroundRegionRange;
    // yRange?: BackgroundRegionRange;

    xScale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;
    yScale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;

    readonly regionGroup = new Group({ name: this.internalId });
    readonly labelGroup = new Group({ name: this.internalId });

    private regionNode = this.regionGroup.appendChild(new Rect());

    update(_visible: boolean) {
        this.regionNode.x = 200;
        this.regionNode.y = 200;
        this.regionNode.width = 400;
        this.regionNode.height = 400;
        this.regionNode.fill = this.fill ?? 'black'; // TODO: transparent
        this.regionNode.fillOpacity = 1;
    }
}
