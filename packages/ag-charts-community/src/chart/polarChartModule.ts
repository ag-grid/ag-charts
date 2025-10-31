import { type ChartModuleDefinition, UnknownError, ValidationError, validate } from 'ag-charts-core';
import type { AgPolarChartOptions } from 'ag-charts-types';

import type { ChartOptions } from '../module/optionsModule';
import { without } from '../util/object';
import { VERSION } from '../version';
import type { TransferableResources } from './chart';
import { polarChartOptionsDefs } from './chartOptionsDefs';
import { PolarChart } from './polarChart';

export const PolarChartModule: ChartModuleDefinition<AgPolarChartOptions> = {
    type: 'chart',
    name: 'polar',
    version: VERSION,

    options: polarChartOptionsDefs,

    create(options: ChartOptions, resources?: TransferableResources) {
        return new PolarChart(options, resources);
    },
    validate(options: any, optionsDefs, path) {
        const additionalErrors: ValidationError[] = [];
        const baseType = options?.series?.[0]?.type;
        if (baseType === 'pie' || baseType === 'donut') {
            if (options?.axes) {
                additionalErrors.push(new UnknownError([], options.axes, path, 'axes'));
                options = without(options, ['axes']);
            }
        }

        const result = validate(options, optionsDefs, path);
        result.invalid.push(...additionalErrors);
        return result;
    },
};
