import { _ModuleSupport } from 'ag-charts-community';
import type { DeepRequired } from 'ag-charts-core';
import type { AgZoomOnDataChange, AgZoomOnDataChangeStrategy } from 'ag-charts-types';

const { ActionOnSet, Property } = _ModuleSupport;

// `chart.zoom.onDataChange` options
export class ZoomOnDataChangeProperties
    extends _ModuleSupport.BaseProperties
    implements DeepRequired<AgZoomOnDataChange>
{
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
