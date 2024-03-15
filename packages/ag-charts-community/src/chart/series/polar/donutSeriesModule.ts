import type { SeriesModule } from '../../../module/coreModules';
import { DonutSeries } from './donutSeries';
import { piePaletteFactory, pieTheme } from './pieTheme';

export const DonutSeriesModule: SeriesModule<'donut'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['polar'],

    identifier: 'donut',
    instanceConstructor: DonutSeries,
    tooltipDefaults: { range: 'exact' },
    themeTemplate: pieTheme,
    paletteFactory: piePaletteFactory,
};
