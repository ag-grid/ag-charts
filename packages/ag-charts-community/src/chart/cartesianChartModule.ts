import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    type CartesianChartDefOptions,
    type ChartModuleDefinition,
    ValidationError,
    cartesianChartOptionsDefs,
    cartesianChartThemeOptionsDefs,
    commonChartThemeTemplate,
    isObject,
    validate,
    without,
} from 'ag-charts-core';

import { communityModule } from '../module/moduleIdentity';
import type { ChartOptions } from '../module/optionsModule';
import { VERSION } from '../version';
import { CartesianChart } from './cartesianChart';
import type { TransferableResources } from './chart';

const histogramAxisTypes = new Set(['number', 'log', 'time']);
const invalidHistogramAxis = (axis: any) => isObject(axis) && axis.type != null && !histogramAxisTypes.has(axis.type);

export const CartesianChartModule: ChartModuleDefinition<CartesianChartDefOptions> = /* #__PURE__ */ communityModule({
    type: 'chart',
    name: 'cartesian',
    version: VERSION,

    options: cartesianChartOptionsDefs,

    themeOptions: cartesianChartThemeOptionsDefs,

    themeTemplate: commonChartThemeTemplate,

    defaultAxes: {
        y: { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
        x: { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
    },

    create(options: ChartOptions, resources?: TransferableResources) {
        return new CartesianChart(options, resources);
    },
    validate(options: any, optionsDefs, path, params) {
        const additionalErrors: ValidationError[] = [];
        if (options?.series?.[0]?.type === 'histogram') {
            if (Object.values(options?.axes ?? {}).some(invalidHistogramAxis)) {
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

        const result = validate(options, optionsDefs, path, params);
        result.invalid.push(...additionalErrors);
        return result;
    },
});
