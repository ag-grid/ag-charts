import type { JsonApplyParams } from '../util/json';

export const JSON_APPLY_PLUGINS: JsonApplyParams = {
    constructedArrays: new WeakMap(),
};

export function assignJsonApplyConstructedArray(array: any[], ctor: new () => any) {
    JSON_APPLY_PLUGINS.constructedArrays?.set(array, ctor);
}
