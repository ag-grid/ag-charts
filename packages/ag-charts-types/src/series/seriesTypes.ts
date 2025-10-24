import type { WithThemeParams } from '../chart/operationOptions';
import type { AgPolarSeriesOptions } from '../chart/polarOptions';
import type { ContextDefault, DatumDefault } from '../chart/types';
import type { AgCartesianChartOptions, AgGaugeOptions, AgPolarChartOptions } from '../chartBuilderOptions';
import type { AgCartesianSeriesOptions } from './cartesian/cartesianSeriesTypes';
import type { AgFlowProportionSeriesOptions } from './standalone/flowProportionOptions';
import type { AgHierarchySeriesOptions } from './standalone/hierarchyOptions';
import type { AgStandaloneSeriesOptions } from './standalone/standaloneOptions';
import type { AgTopologySeriesOptions } from './topology/topologyOptions';

export type SeriesOptionsTypes<TDatum = DatumDefault, TContext = ContextDefault> =
    | AgCartesianSeriesOptions<TDatum, TContext>
    | AgPolarSeriesOptions<TDatum, TContext>
    | AgTopologySeriesOptions<TDatum, TContext>
    | AgStandaloneSeriesOptions<TDatum, TContext>
    | AgGaugeOptions<TDatum, TContext>;

type SeriesToAxesType<TDatum = DatumDefault, TContext = ContextDefault> = Record<
    AgCartesianSeriesOptions<TDatum, TContext>['type'],
    AgCartesianChartOptions<TDatum, TContext>['axes']
> &
    Record<AgPolarSeriesOptions<TDatum, TContext>['type'], AgPolarChartOptions<TDatum, TContext>['axes']> &
    Record<AgHierarchySeriesOptions<TDatum, TContext>['type'], never> &
    Record<AgTopologySeriesOptions<TDatum, TContext>['type'], never> &
    Record<AgFlowProportionSeriesOptions<TDatum, TContext>['type'], never> &
    Record<AgStandaloneSeriesOptions<TDatum, TContext>['type'], never> &
    Record<'radial-gauge' | 'linear-gauge', never>;

export type SeriesType = SeriesOptionsTypes<DatumDefault, ContextDefault>['type'];

export type SeriesDefaultAxes<TSeries extends SeriesType> = WithThemeParams<
    SeriesToAxesType<DatumDefault, ContextDefault>[TSeries]
>;
export type SeriesPredictAxis<TSeries extends SeriesType> = NonNullable<
    SeriesToAxesType<DatumDefault, ContextDefault>[TSeries]
>[number];
