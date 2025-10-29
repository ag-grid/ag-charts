import type { AgZoomAutoScaling } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { DeepRequired } from 'ag-charts-core';

const { Property, BaseProperties } = _ModuleSupport;

export class ZoomAutoScalingProperties extends BaseProperties implements DeepRequired<AgZoomAutoScaling> {
    @Property
    enabled = false;

    @Property
    padding = 0;
}

export class ZoomAutoScaler {
    constructor(private properties: ZoomAutoScalingProperties) {}
}
