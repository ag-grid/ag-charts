import { type AgRadarLineSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    constant,
    lineDashOptionsDef,
    required,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, markerOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

export const radarLineSeriesOptionsDef: OptionsDefs<AgRadarLineSeriesOptions<never>> = {
    type: required(constant('radar-line')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    connectMissingData: boolean,
    marker: markerOptionsDefs,
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
