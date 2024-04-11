import type { AgChartOptions } from '../types/agChartsTypes';
import {
    type OptionsDefs,
    arrayOf,
    boolean,
    instanceOf,
    object,
    optionsDefs,
    or,
    positiveNumber,
    required,
    string,
} from '../util/isValid';
import { captionOptionsDef, directionMetricsOptionsDef } from './commonOptionsDefs';
import { themeOptionsDef } from './testDefs';

export const chartOptionsDef: OptionsDefs<AgChartOptions> = {
    container: required(instanceOf(HTMLElement)),
    data: required(arrayOf(object)),

    theme: or(string, optionsDefs(themeOptionsDef, 'a theme object')),

    width: positiveNumber,
    height: positiveNumber,

    padding: directionMetricsOptionsDef,

    seriesArea: {
        clip: boolean,
        padding: directionMetricsOptionsDef,
    },

    title: captionOptionsDef,
    subtitle: captionOptionsDef,
    footnote: captionOptionsDef,

    axes: arrayOf(object),
    series: required(arrayOf(object)),

    // dynamically generated
    // axes: [{ type: constant('number'), position: union(Direction) }],
    // series: required([{ ...commonSeriesOptionsDefs, type: constant('line'), visible: boolean }]),
    // ...modules...
};
