import type { AgLinearGaugeOptions, AgRadialGaugeOptions } from '../chartBuilderOptions';
import type { SeriesType } from '../series/seriesTypes';
import type { WithThemeParams } from './operationOptions';
import type { AgChartThemeOverrides } from './themeOptions';
import type { ContextDefault, DatumDefault } from './types';

type ThemesMap<TDatum = DatumDefault, TContext = ContextDefault> = AgChartThemeOverrides<TDatum, TContext> & {
    'linear-gauge'?: { series: AgLinearGaugeOptions<TDatum, TContext> };
    'radial-gauge'?: { series: AgRadialGaugeOptions<TDatum, TContext> };
};

export type ExtensibleTheme<
    SType extends SeriesType,
    TDatum = DatumDefault,
    TContext = ContextDefault,
> = WithThemeParams<NonNullable<ThemesMap<TDatum, TContext>[SType]>>;
