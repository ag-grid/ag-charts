import type { AxisContext } from './axisContext';
import type { BaseOptionsModule, ModuleInstance } from './baseModule';
import type { ModuleContextWithParent } from './moduleContext';

type AxisType = 'category' | 'number' | 'log' | 'time' | 'unit-time' | 'ordinal-time' | 'grouped-category';

export interface AxisOptionModule<M extends ModuleInstance = ModuleInstance> extends BaseOptionsModule {
    type: 'axis-option';
    axisTypes: AxisType[];
    moduleFactory: (ctx: ModuleContextWithParent<AxisContext>) => M;
    themeTemplate: object;
}
