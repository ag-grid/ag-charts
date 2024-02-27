import type { LegendModule } from '../module/coreModules';
import { Legend } from './legend';

export const CategoryLegendModule: LegendModule = {
    type: 'legend',
    optionsKey: 'legend',
    identifier: 'category',
    chartTypes: ['cartesian', 'polar'],
    instanceConstructor: Legend,
    packageType: 'community',
};
