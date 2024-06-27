import type { SeriesModule } from '../../../module/coreModules';
import { PieSeries } from './pieSeries';
import { piePaletteFactory, pieTheme } from './pieTheme';

export const PieSeriesModule: SeriesModule<'pie'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['polar'],

    identifier: 'pie',
    instanceConstructor: PieSeries,
    tooltipDefaults: { range: 'exact' },
    themeTemplate: pieTheme,
    paletteFactory: piePaletteFactory,
};
