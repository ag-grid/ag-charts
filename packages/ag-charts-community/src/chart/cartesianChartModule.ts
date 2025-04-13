import { type ChartModuleDefinition, ValidationError, isObject, validate } from 'ag-charts-core';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import type { ChartOptions } from '../module/optionsModule';
import { without } from '../util/object';
import { CartesianChart } from './cartesianChart';
import type { TransferableResources } from './chart';
import { cartesianChartOptionsDefs } from './chartOptionsDefs';
import { isAgCartesianChartOptions } from './mapping/types';

const isNumericAxis = (axis: any) => isObject(axis) && axis.type !== 'number' && axis.type !== 'log';

export const CartesianChartModule: ChartModuleDefinition<AgCartesianChartOptions> = {
    type: 'chart',
    name: 'cartesian',

    options: cartesianChartOptionsDefs,

    detect: isAgCartesianChartOptions,
    create(options: ChartOptions, resources?: TransferableResources) {
        return new CartesianChart(options, resources);
    },
    validate(options: any, optionsDefs, path) {
        const additionalErrors: ValidationError[] = [];
        if (options?.series?.[0]?.type === 'histogram') {
            if (options?.axes?.some(isNumericAxis)) {
                additionalErrors.push(
                    new ValidationError(
                        'invalid',
                        'only numeric axis types when histogram series is used',
                        options.axes,
                        path,
                        'axes'
                    )
                );
                options = without(options, ['axes']);
            }
        }

        const result = validate(options, optionsDefs, path);
        result.invalid.push(...additionalErrors);
        return result;
    },
};
