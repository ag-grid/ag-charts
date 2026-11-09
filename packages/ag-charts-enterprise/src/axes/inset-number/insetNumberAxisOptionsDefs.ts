import type { AgInsetNumberAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    type WithoutCrossLineOptions,
    constant,
    numberAxisOptionsDefs,
    ratio,
    required,
} from 'ag-charts-core';

export const insetNumberAxisOptionsDefs: OptionsDefs<WithoutCrossLineOptions<AgInsetNumberAxisOptions>> = {
    ...numberAxisOptionsDefs,
    type: constant('inset-number'),
    lengthRatio: required(ratio),
};
