import type { JsonApplyParams } from '../util/json';
import { AxisTitle } from './axis/axisTitle';

export const JSON_APPLY_PLUGINS: JsonApplyParams = {
    constructedArrays: new WeakMap(),
};

export function assignJsonApplyConstructedArray(array: any[], ctor: new () => any) {
    JSON_APPLY_PLUGINS.constructedArrays?.set(array, ctor);
}

export const JSON_APPLY_OPTIONS: JsonApplyParams = {
    constructors: {
        'axes[].title': AxisTitle,
    },
    allowedTypes: {
        'axis[].tick.count': ['primitive', 'class-instance'],
    },
};
