import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, type DeepRequired, Property } from 'ag-charts-core';
import type { AgZoomOnDataChange, AgZoomOnDataChangeStrategy } from 'ag-charts-types';

// `chart.zoom.onDataChange` options
export class ZoomOnDataChangeProperties extends BaseProperties implements DeepRequired<AgZoomOnDataChange> {
    @Property
    strategy: AgZoomOnDataChangeStrategy = 'preserveDomain';
}

export class ZoomOnDataChange {
    constructor(private readonly properties: ZoomOnDataChangeProperties) {
    }
}
