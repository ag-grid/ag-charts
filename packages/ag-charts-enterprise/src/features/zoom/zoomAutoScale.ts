import type { AgZoomAutoScaling } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import type { DeepRequired } from 'ag-charts-core';

const { ActionOnSet, BaseProperties, Property } = _ModuleSupport;

type ZoomAutoScalingOpts = DeepRequired<AgZoomAutoScaling>;
type ZoomAutoScaleChangeCb = (opts: ZoomAutoScalingOpts) => void;
type ZoomAutoScaleChangeListener = { onChange: ZoomAutoScaleChangeCb };

export class ZoomAutoScalingProperties extends BaseProperties implements ZoomAutoScalingOpts {
    constructor(protected onChange: ZoomAutoScaleChangeCb) {
        super();
    }

    @Property
    @ActionOnSet<ZoomAutoScalingProperties>({
        changeValue(enabled) {
            this.onChange({ enabled, padding: this.padding });
        },
    })
    enabled = false;

    @Property
    @ActionOnSet<ZoomAutoScalingProperties>({
        changeValue(padding) {
            this.onChange({ enabled: this.enabled, padding });
        },
    })
    padding = 0;
}

export class ZoomAutoScaler implements ZoomAutoScaleChangeListener {
    constructor(private properties: ZoomAutoScalingProperties) {}

    onChange(opts: ZoomAutoScalingOpts): void {
        // TODO
    }
}
