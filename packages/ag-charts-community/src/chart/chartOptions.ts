import { DropShadow } from '../scene/dropShadow';
import type { JsonApplyParams } from '../util/json';
import { AxisTitle } from './axis/axisTitle';
import { Caption } from './caption';
import { DoughnutInnerCircle, DoughnutInnerLabel } from './series/polar/pieSeries';

export const JSON_APPLY_PLUGINS: JsonApplyParams = {
    constructors: {},
    constructedArrays: new WeakMap(),
};

export function assignJsonApplyConstructedArray(array: any[], ctor: new () => any) {
    JSON_APPLY_PLUGINS.constructedArrays?.set(array, ctor);
}

const JSON_APPLY_OPTIONS: JsonApplyParams = {
    constructors: {
        title: Caption,
        subtitle: Caption,
        footnote: Caption,
        shadow: DropShadow,
        innerCircle: DoughnutInnerCircle,
        'axes[].title': AxisTitle,
        'series[].innerLabels[]': DoughnutInnerLabel,
    },
    allowedTypes: {
        'legend.pagination.marker.shape': ['primitive', 'function'],
        'series[].marker.shape': ['primitive', 'function'],
        'axis[].tick.count': ['primitive', 'class-instance'],
    },
};

export function getJsonApplyOptions() {
    return {
        constructors: {
            ...JSON_APPLY_OPTIONS.constructors,
            ...JSON_APPLY_PLUGINS.constructors,
        },
        constructedArrays: JSON_APPLY_PLUGINS.constructedArrays,
        allowedTypes: {
            ...JSON_APPLY_OPTIONS.allowedTypes,
        },
    };
}
