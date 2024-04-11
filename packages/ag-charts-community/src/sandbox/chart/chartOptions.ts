import { chartOptionsDef } from '../defs/chartOptionsDef';
import { moduleRegistry } from '../modules/moduleRegistry';
import type { IChartOptions } from '../types';
import type { AgChartOptions } from '../types/agChartsTypes';
import type { ChartType } from '../types/enums';
import { isValid } from '../util/isValid';
import { defaultsDeep, difference, freezeDeep } from '../util/object';

export class ChartOptions<T extends AgChartOptions> implements IChartOptions<T> {
    fullOptions: T;
    optionsDiff: Partial<T> | null = null;

    constructor(
        public userOptions: Partial<T>,
        public lastOptions?: ChartOptions<T>,
        keepDiff?: boolean
    ) {
        this.userOptions = defaultsDeep(userOptions, lastOptions?.userOptions);

        // should validate only user options
        if (!this.validate(this.userOptions)) {
            throw new Error('options bad.');
        }

        const fullOptions = defaultsDeep(userOptions) as T;
        // build fullOptions

        if (lastOptions) {
            const diff = difference(lastOptions.fullOptions, fullOptions);
            this.optionsDiff = defaultsDeep(diff, keepDiff && lastOptions.optionsDiff);
            this.fullOptions = defaultsDeep(fullOptions, lastOptions.fullOptions);
        } else {
            this.fullOptions = fullOptions;
        }

        freezeDeep(this.fullOptions, this.userOptions, this.optionsDiff);
    }

    get chartType(): ChartType {
        const { series } = this.fullOptions;
        const mainSeriesModule = moduleRegistry.getModule(series[0]?.type);
        if (!series.length || !mainSeriesModule) {
            throw new ReferenceError('AG Charts - Cannot determine chart type, missing series configuration.');
        }
        return mainSeriesModule.chartTypes?.[0]!;
    }

    validate(options: Partial<T>) {
        return isValid(options as T, chartOptionsDef);
    }
}
