import type { PluginModuleDefinition } from 'ag-charts-core';

import { AxisInteractionModule as InternalAxisInteractionModule } from '../features/axis-interaction/axisInteractionModule';

/** @deprecated v14.3.0 Enterprise axis modules bring this in; it only needs registering alongside community axes. */
export const AxisInteractionModule: PluginModuleDefinition<never> = InternalAxisInteractionModule;
