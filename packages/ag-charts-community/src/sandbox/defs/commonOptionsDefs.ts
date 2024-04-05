import type { CommonSeriesOptions } from '../types/seriesTypes';
import { type OptionsDefs, boolean, callback, string } from '../util/validation';

export const commonSeriesOptionsDefs: OptionsDefs<CommonSeriesOptions> = {
    visible: boolean,
    showInLegend: boolean,
    cursor: string,
    onNodeClick: callback,
    onNodeDoubleClick: callback,
};
