import { moduleRegistry } from '../modules/moduleRegistry';
import type { AgChartOptions } from '../types/agChartsTypes';
import type { ChartType } from '../types/enums';
import { defaultsDeep, difference, freezeDeep } from '../util/object';

export class ChartOptions<T extends AgChartOptions> {
    public fullOptions: T;
    public optionsDiff: Partial<T> | null = null;

    constructor(
        public userOptions: Partial<T>,
        public prevOptions?: ChartOptions<T>,
        preserveDiff?: boolean
    ) {
        this.userOptions = defaultsDeep(userOptions, prevOptions?.userOptions);

        // should validation only user options
        if (!this.validate()) {
            throw new Error('options bad.');
        }

        const fullOptions = defaultsDeep(userOptions) as T;
        // build fullOptions

        if (prevOptions) {
            const diff = difference(prevOptions.fullOptions, fullOptions);
            this.optionsDiff = defaultsDeep(diff, preserveDiff && prevOptions.optionsDiff);
            this.fullOptions = defaultsDeep(fullOptions, prevOptions.fullOptions);
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

    validate() {
        return true;
    }
}
