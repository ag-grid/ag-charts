import { defaultsDeep, difference, freezeDeep } from '../util/object';
import { type OptionsDefs, boolean, instanceOf, number, optional, positiveNumber } from '../util/validation';
import { ChartType } from './types';

export const chartOptionsDef: OptionsDefs<string> = {
    container: instanceOf(HTMLElement),
    width: optional(positiveNumber),
    height: optional(positiveNumber),

    padding: optional({
        top: optional(number),
        right: optional(number),
        bottom: optional(number),
        left: optional(number),
    }),

    // modules - dynamically added, optional
    animation: optional({ enabled: optional(boolean) }),
    background: optional({ enabled: optional(boolean) }),
    contextMenu: optional({ enabled: optional(boolean) }),
    legend: optional({ enabled: optional(boolean) }),
    navigator: optional({ enabled: optional(boolean) }),
    sync: optional({ enabled: optional(boolean) }),
    zoom: optional({ enabled: optional(boolean) }),
};

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

        const fullOptions = {} as T;
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
