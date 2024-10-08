import type { AgChartsApi } from 'ag-charts-types';

import { AgCharts } from './api/agCharts';
import { registerInbuiltModules } from './chart/factory/registerInbuiltModules';
import { VERSION } from './version';

export function setupCommunityModules(): { AgCharts: AgChartsApi; version: string } {
    registerInbuiltModules();
    return { AgCharts: AgCharts as AgChartsApi, version: VERSION };
}

export { AgCharts };
