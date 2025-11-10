import { _ModuleSupport } from 'ag-charts-community';
import { ActionOnSet, BaseProperties, type DeepRequired, Property } from 'ag-charts-core';
import type { AgZoomOnDataChange, AgZoomOnDataChangeStrategy } from 'ag-charts-types';

// `chart.zoom.onDataChange` options
export class ZoomOnDataChangeProperties extends BaseProperties implements DeepRequired<AgZoomOnDataChange> {
    public onChange?: () => void;

    @Property
    @ActionOnSet<ZoomOnDataChangeProperties>({
        changeValue() {
            this.onChange?.();
        },
    })
    strategy: AgZoomOnDataChangeStrategy = 'preserveDomain';
}

export class ZoomOnDataChange {
    constructor(private readonly properties: ZoomOnDataChangeProperties) {
        properties.onChange = () => this.onPropertiesChange();
    }

    onPropertiesChange(): void {}
}
