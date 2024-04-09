import type { AgChartCaptionOptions } from '../../options/chart/chartOptions';
import type { DirectionMetrics } from '../types/commonTypes';
import type { CommonSeriesOptions } from '../types/seriesTypes';
import { type OptionsDefs, boolean, callback, number, or, required, string, union } from '../util/validation';

export const directionMetricsOptionsDef: OptionsDefs<DirectionMetrics> = {
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

export const commonSeriesOptionsDefs: OptionsDefs<CommonSeriesOptions> = {
    visible: boolean,
    showInLegend: boolean,
    cursor: string,
    onNodeClick: callback,
    onNodeDoubleClick: callback,
};
