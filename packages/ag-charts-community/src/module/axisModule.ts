import type { ChartAxis } from '../chart/chartAxis';
import type { BaseModule } from './baseModule';
import type { ModuleContext } from './moduleContext';

export type AxisFactory = (moduleContext: ModuleContext) => ChartAxis;

export interface AxisModule extends BaseModule {
    type: 'axis';

    identifier: string;
    moduleFactory: AxisFactory;
    hidden?: boolean;

    themeTemplate?: {};
}
