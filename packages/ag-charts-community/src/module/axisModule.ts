import type { ChartAxis } from '../chart/chartAxis';
import type { BaseOptionsModule } from './baseModule';
import type { ModuleContext } from './moduleContext';

export interface AxisModule extends BaseOptionsModule {
    type: 'axis';

    identifier: string;
    moduleFactory(moduleContext: ModuleContext): ChartAxis;

    themeTemplate?: object;
}
