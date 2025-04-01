import { type AgRadarAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    required,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, markerOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

export const radarAreaSeriesOptionsDef: OptionsDefs<AgRadarAreaSeriesOptions<never>> = {
    type: required(constant('radar-area')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    connectMissingData: boolean,
    marker: markerOptionsDefs,
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
