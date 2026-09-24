import { type ChartModuleDefinition, UnknownError, ValidationError, validate, without } from 'ag-charts-core';
import type { AgPolarChartOptions } from 'ag-charts-types';

import { communityModule } from '../module/moduleIdentity';
import type { ChartOptions } from '../module/optionsModule';
import { VERSION } from '../version';
import type { TransferableResources } from './chart';
import { type ModuleOwnedChartOptions, polarChartOptionsDefs } from './chartOptionsDefs';
import { PolarChart } from './polarChart';
import { SeriesAreaModule } from './series-area/seriesAreaModule';
import { commonChartThemeTemplate } from './themes/chartThemeTemplate';

export const PolarChartModule: ChartModuleDefinition<Omit<AgPolarChartOptions, ModuleOwnedChartOptions>> =
    /* #__PURE__ */ communityModule({
        type: 'chart',
        name: 'polar',
        version: VERSION,
        dependencies: [SeriesAreaModule],

        options: polarChartOptionsDefs,

        themeTemplate: commonChartThemeTemplate,

        create(options: ChartOptions, resources?: TransferableResources) {
            return new PolarChart(options, resources);
        },
        validate(options: any, optionsDefs, path, params) {
            const additionalErrors: ValidationError[] = [];
            const baseType = options?.series?.[0]?.type;
            if (baseType === 'pie' || baseType === 'donut') {
                if (options?.axes) {
                    additionalErrors.push(new UnknownError([], options.axes, path, 'axes'));
                    options = without(options, ['axes']);
                }
            }

            const result = validate(options, optionsDefs, path, params);
            result.invalid.push(...additionalErrors);
            return result;
        },
    });
