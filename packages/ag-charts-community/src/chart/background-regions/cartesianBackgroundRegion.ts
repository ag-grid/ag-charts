import { BaseProperties, Property, createId } from 'ag-charts-core';
import type { CssColor } from 'ag-charts-types';

import { Group } from '../../scene/group';
import type { BackgroundRegion } from './backgroundRegion';

export class CartesianBackgroundRegion extends BaseProperties implements BackgroundRegion {
    static readonly className = 'BackgroundRegion';
    readonly internalId = createId(this);

    @Property
    fill?: CssColor = undefined;

    readonly regionGroup = new Group({ name: this.internalId });
    readonly labelGroup = new Group({ name: this.internalId });
}
