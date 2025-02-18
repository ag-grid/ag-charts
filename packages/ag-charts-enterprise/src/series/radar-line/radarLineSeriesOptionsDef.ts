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

const { commonSeriesOptionsDef, seriesLabelOptionsDef, markerOptionsDef, tooltipOptionsDef } = _ModuleSupport;

export const radarLineSeriesOptionsDef: OptionsDefs<AgRadarLineSeriesOptions> = {
    type: required(constant('radar-line')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    connectMissingData: boolean,
    marker: markerOptionsDef,
    label: seriesLabelOptionsDef,
    tooltip: tooltipOptionsDef,
    ...commonSeriesOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
