import { ChartType } from '../types';
import { defaultsDeep, difference, freezeDeep } from '../util/object';

export class ChartOptions<T extends object> {
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
        // determine by this.options
        if (Math.random() > 0.5) {
            return ChartType.Cartesian;
        }
        return ChartType.Topology;
    }

    validate() {
        return true;
    }
}
