import type { AxisContext } from './axisContext';
import type { BaseModule, ModuleInstance } from './baseModule';
import type { ModuleContextWithParent } from './moduleContext';

type AxisType = 'category' | 'number' | 'log' | 'time' | 'ordinal-time';

export interface AxisOptionModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'axis-option';
    axisTypes: AxisType[];
    moduleFactory: (ctx: ModuleContextWithParent<AxisContext>) => M;
    themeTemplate: object;
}
