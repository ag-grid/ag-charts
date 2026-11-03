import type { ModuleDefinition } from 'ag-charts-core';

import { LinearGaugeModule } from '../series/linear-gauge/linearGaugeModule';
import { RadialGaugeModule } from '../series/radial-gauge/radialGaugeModule';

/** @deprecated v14.3.0 Register `AllEnterpriseModule`, or the individual modules you need. */
export const AllGaugeModule: ModuleDefinition[] = [LinearGaugeModule, RadialGaugeModule];
