import type { AgLinearGaugeThemeableOptions } from '../presets/gauge/linearGaugeOptions';
import type { AgRadialGaugeThemeableOptions } from '../presets/gauge/radialGaugeOptions';
import type { SeriesType } from '../series/seriesTypes';
import type { WithThemeParams } from './operationOptions';
import type { AgBaseGaugePresetThemeOptions, AgChartThemeOverrides } from './themeOptions';
import type { ContextDefault, DatumDefault } from './types';

type ThemesMap<TDatum = DatumDefault, TContext = ContextDefault> = AgChartThemeOverrides<TDatum, TContext> & {
    'linear-gauge'?: AgBaseGaugePresetThemeOptions<TDatum, TContext> & {
        series: AgLinearGaugeThemeableOptions<TContext>;
    };
    'radial-gauge'?: AgBaseGaugePresetThemeOptions<TDatum, TContext> & {
        series: AgRadialGaugeThemeableOptions<TContext>;
    };
};

export type ExtensibleTheme<
    SType extends SeriesType,
    TDatum = DatumDefault,
    TContext = ContextDefault,
> = WithThemeParams<NonNullable<ThemesMap<TDatum, TContext>[SType]>>;
