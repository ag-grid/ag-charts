import { type AgFunnelSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, constant, required, string, without} from 'ag-charts-core';

const { commonSeriesOptionsDefs, funnelSeriesThemeableOptionsDef } = _ModuleSupport;

export const funnelSeriesOptionsDef: OptionsDefs<AgFunnelSeriesOptions> = {
    ...funnelSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['showInLegend']),
    type: required(constant('funnel')),
    stageKey: required(string),
    valueKey: required(string),
};
