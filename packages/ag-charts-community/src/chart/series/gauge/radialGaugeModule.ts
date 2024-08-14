import type { SeriesModule } from '../../../module/coreModules';
import { singleSeriesPaletteFactory } from '../../../module/theme';
import { RadialGaugeSeries } from './radialGaugeSeries';

export const RadialGaugeSeriesModule: SeriesModule<'radial-gauge'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['gauge'],

    identifier: 'radial-gauge',
    moduleFactory: (ctx) => new RadialGaugeSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    themeTemplate: {
        series: {},
    },
    paletteFactory: singleSeriesPaletteFactory,
};
