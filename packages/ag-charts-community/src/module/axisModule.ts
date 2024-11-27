import type { ChartAxis } from '../chart/chartAxis';
import type { BaseOptionsModule } from './baseModule';
import type { ModuleContext } from './moduleContext';

export type AxisFactory = (moduleContext: ModuleContext) => ChartAxis;

export interface AxisModule extends BaseOptionsModule {
    type: 'axis';

    identifier: string;
    moduleFactory: AxisFactory;
    hidden?: boolean;

    themeTemplate?: object;
}
