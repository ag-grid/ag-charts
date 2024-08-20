import type { LegendModule } from '../module/coreModules';
import { Legend } from './legend';

export const CommunityLegendModule: LegendModule = {
    type: 'legend',
    optionsKey: 'legend',
    identifier: 'category',
    chartTypes: ['cartesian', 'polar', 'hierarchy', 'topology', 'flow-proportion', 'gauge'],
    moduleFactory: (ctx) => new Legend(ctx),
    packageType: 'community',
};
