import type { ModuleDefinition } from 'ag-charts-core';

import { LinearGaugeModule } from '../series/linear-gauge/linearGaugeModule';
import { RadialGaugeModule } from '../series/radial-gauge/radialGaugeModule';

export const AllGaugeModule: ModuleDefinition[] = [LinearGaugeModule, RadialGaugeModule];
