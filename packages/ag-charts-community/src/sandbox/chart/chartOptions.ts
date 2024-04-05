import type { AgChartCaptionOptions } from '../../options/chart/chartOptions';
import type { PlainObject } from '../../util/types';
import type { BoxPosition, CartesianChartOptions } from '../defs/commonOptions';
import { ChartType } from '../types';
import { defaultsDeep, difference, freezeDeep } from '../util/object';
import {
    type OptionsDefs,
    arrayOf,
    boolean,
    constant,
    instanceOf,
    number,
    object,
    optionsDefs,
    or,
    positiveNumber,
    required,
    string,
    union,
} from '../util/validation';

export const themeOptionsDef: OptionsDefs<PlainObject> = {};

export const boxOptionsDef: OptionsDefs<BoxPosition> = {
    top: number,
    right: number,
    bottom: number,
    left: number,
};

export const captionOptionsDef: OptionsDefs<AgChartCaptionOptions> = {
    enabled: boolean,
    text: required(string),

    maxWidth: number,
    maxHeight: number,

    color: string,
    fontFamily: string,
    fontSize: number,
    fontStyle: string,
    fontWeight: or(string, number),
    textAlign: union('center', 'left', 'right'),
    wrapping: union('always', 'hyphenate', 'never', 'on-space'),
    spacing: number,
};

export const chartOptionsDef: OptionsDefs<CartesianChartOptions> = {
    container: required(instanceOf(HTMLElement)),
    data: required(arrayOf(object)),

    theme: or(string, optionsDefs(themeOptionsDef, 'a theme object')),

    width: positiveNumber,
    height: positiveNumber,

    padding: boxOptionsDef,

    seriesArea: {
        clip: boolean,
        padding: boxOptionsDef,
    },

    title: captionOptionsDef,
    subtitle: captionOptionsDef,
    footnote: captionOptionsDef,

    // dynamically generated
    axes: [{ type: constant('number') }],
    series: required([{ type: constant('line'), visible: boolean }]),

    // refactor?

    // modules - dynamically added, optional
    // animation: { enabled: boolean },
    // background: { enabled: boolean },
    // contextMenu: { enabled: boolean },
    // legend: { enabled: boolean },
    // navigator: { enabled: boolean },
    // sync: { enabled: boolean },
    // zoom: { enabled: boolean },
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

const test = required([{ type: constant('number'), visible: boolean }, { visible: boolean }]);
console.log(test);
