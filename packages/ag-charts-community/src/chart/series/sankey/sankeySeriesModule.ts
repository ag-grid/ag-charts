import type { SeriesModule } from '../../../module/coreModules';
import { EXTENDS_SERIES_DEFAULTS } from '../../themes/symbols';
import { SankeySeries } from './sankeySeries';

export const SankeySeriesModule: SeriesModule<'sankey'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['sankey'],

    identifier: 'sankey',
    instanceConstructor: SankeySeries,

    themeTemplate: {
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
        },
    },
};
