import type { AgChartCaptionOptions } from 'ag-charts-types';

import {
    type OptionsDefs,
    boolean,
    callback,
    minOneNumber,
    number,
    numberRange,
    or,
    positiveNumber,
    required,
    string,
    union,
} from '../../util/validate';
import type { CommonSeriesOptions } from '../series/seriesTypes';
import type { DirectionMetrics, FontOptions } from '../types/commonTypes';

export const directionMetricsOptionsDef: OptionsDefs<DirectionMetrics> = {
    top: number,
    right: number,
    bottom: number,
    left: number,
};

export const fontOptionsDef: OptionsDefs<FontOptions> = {
    fontFamily: string,
    fontSize: minOneNumber,
    fontStyle: string,
    fontWeight: or(
        union('normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'),
        numberRange(1, 1000)
    ),
};

export const captionOptionsDef: OptionsDefs<AgChartCaptionOptions> = {
    enabled: boolean,
    text: required(string),

    maxWidth: positiveNumber,
    maxHeight: positiveNumber,

    color: string,
    ...fontOptionsDef,
    textAlign: union('center', 'left', 'right'),
    wrapping: union('always', 'hyphenate', 'never', 'on-space'),
    spacing: number,
};

export const commonSeriesOptionsDefs: OptionsDefs<CommonSeriesOptions> = {
    visible: boolean,
    showInLegend: boolean,
    cursor: string,

    onNodeClick: callback,
    onNodeDoubleClick: callback,
};
