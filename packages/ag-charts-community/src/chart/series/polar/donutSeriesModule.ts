import type { SeriesModule } from '../../../module/coreModules';
import { DonutSeries } from './donutSeries';
import { donutTheme } from './donutTheme';
import { piePaletteFactory } from './pieTheme';

export const DonutSeriesModule: SeriesModule<'donut'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['polar'],

    identifier: 'donut',
    instanceConstructor: DonutSeries,
    tooltipDefaults: { range: 'exact' },
    themeTemplate: donutTheme,
    paletteFactory: piePaletteFactory,
};
