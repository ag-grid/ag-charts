import type { AgChartOptions } from '../chart/chartTypes';
import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callback,
    instanceOf,
    object,
    optionsDefs,
    or,
    positiveNumber,
    required,
    string,
} from '../util/validation';
import { captionOptionsDef, directionMetricsOptionsDef } from './commonOptionsDefs';
import { themeOptionsDef } from './testDefs';

export const chartOptionsDef: OptionsDefs<AgChartOptions> = {
    container: required(instanceOf(HTMLElement)),
    data: required(or(arrayOf(object), callback)),

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

    // basic type validation, should also be validated by the module
    axes: arrayOf(object),
    series: required(arrayOf(object)),

    // overlays: {
    //     isEmpty: or(string, callback),
    //     isLoading: or(string, callback),
    //     noData: or(string, callback),
    // },
    //
    // background: {
    //     enabled: boolean,
    //     fill: or(string, instanceOf(CanvasGradient), instanceOf(CanvasPattern)),
    // },

    // dynamically generated
    // axes: [{ type: constant('number'), position: union(Direction) }],
    // series: required([{ ...commonSeriesOptionsDefs, type: constant('line'), visible: boolean }]),
    // ...modules...
};
