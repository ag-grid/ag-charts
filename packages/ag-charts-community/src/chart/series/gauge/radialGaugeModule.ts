import type { SeriesModule } from '../../../module/coreModules';
import { singleSeriesPaletteFactory } from '../../../module/theme';
import { FONT_WEIGHT } from '../../themes/constants';
import {
    DEFAULT_FONT_FAMILY,
    DEFAULT_HIERARCHY_FILLS,
    DEFAULT_LABEL_COLOUR,
    DEFAULT_MUTED_LABEL_COLOUR,
} from '../../themes/symbols';
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
        series: {
            strokeWidth: 0,
            label: {
                enabled: true,
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: 14,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_LABEL_COLOUR,
            },
            secondaryLabel: {
                enabled: false,
                fontWeight: FONT_WEIGHT.NORMAL,
                fontSize: 12,
                fontFamily: DEFAULT_FONT_FAMILY,
                color: DEFAULT_MUTED_LABEL_COLOUR,
            },
        },
    },
    paletteFactory(params) {
        const { fill, stroke } = singleSeriesPaletteFactory(params);
        const hierarchyFills = params.themeTemplateParameters.get(DEFAULT_HIERARCHY_FILLS);
        return {
            fill,
            stroke,
            background: {
                fill: hierarchyFills?.[1],
                stroke: hierarchyFills?.[2],
            },
        };
    },
};
