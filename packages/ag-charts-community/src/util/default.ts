import { isFunction } from 'ag-charts-core';

import { addTransformToInstanceProperty } from './decorator';

export function Default(defaultValue: any, replaces: (undefined | null | '' | number)[] = [undefined]) {
    return addTransformToInstanceProperty((_, __, v: any) => {
        if (replaces.includes(v)) {
            return isFunction(defaultValue) ? defaultValue(v) : defaultValue;
        }
        return v;
    });
}
