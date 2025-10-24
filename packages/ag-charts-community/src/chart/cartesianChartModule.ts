import { type ChartModuleDefinition, ValidationError, isObject, validate } from 'ag-charts-core';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import type { ChartOptions } from '../module/optionsModule';
import { without } from '../util/object';
import { CartesianChart } from './cartesianChart';
import type { TransferableResources } from './chart';
import { cartesianChartOptionsDefs } from './chartOptionsDefs';

const histogramAxisTypes = new Set(['number', 'log', 'time']);
const validHistogramAxis = (axis: any) => isObject(axis) && !histogramAxisTypes.has(axis.type);

export const CartesianChartModule: ChartModuleDefinition<AgCartesianChartOptions> = {
    type: 'chart',
    name: 'cartesian',

    options: cartesianChartOptionsDefs,

    create(options: ChartOptions, resources?: TransferableResources) {
        return new CartesianChart(options, resources);
    },
    validate(options: any, optionsDefs, path) {
        const additionalErrors: ValidationError[] = [];
        if (options?.series?.[0]?.type === 'histogram') {
            if (options?.axes?.some(validHistogramAxis)) {
                additionalErrors.push(
                    new ValidationError(
                        'invalid',
                        'only continuous axis types when histogram series is used',
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
