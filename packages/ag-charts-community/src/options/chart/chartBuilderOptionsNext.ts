import type { AgBaseTopologyChartOptions } from '../series/topology/topologyOptions';
import type { AgChartOptions } from './chartBuilderOptions';
import type { AgBaseChartOptions } from './chartOptions';
import type { AgChartTheme, AgChartThemeName } from './themeOptions';

export interface AgTopologyChartOptions extends AgBaseTopologyChartOptions, AgBaseChartOptions {
    theme?: AgChartTheme | AgChartThemeName;
}

export type AgChartOptionsNext = AgChartOptions | AgTopologyChartOptions;
