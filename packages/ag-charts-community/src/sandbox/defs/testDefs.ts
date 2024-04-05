import type { AgChartCaptionOptions } from '../../options/chart/chartOptions';
import type { PlainObject } from '../../util/types';
import type { CartesianChartOptions } from '../types/agChartsTypes';
import type { BoxPosition } from '../types/commonTypes';
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
