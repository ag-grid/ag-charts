import type {
    AgChartInstance,
    AgChartOptions,
    AgFinancialChartOptions,
    AgGaugeOptions,
    AgQuadrantChartOptions,
    AgTypedChartInstance,
} from '../chartBuilderOptions';
import type { AgChartParams } from './chartParams';

export interface AgChartsApi {
    /** Create a new `AgChartInstance` based upon the given configuration options. */
    create<TDatum, TContext, TOptions extends AgChartOptions<TDatum, TContext>>(
        options: TOptions,
        params?: AgChartParams
    ): AgTypedChartInstance<TDatum, TContext, TOptions>;

    /** Create a new `AgChartInstance` based upon the given configuration options. */
    createFinancialChart<TDatum>(
        options: AgFinancialChartOptions<TDatum>,
        params?: AgChartParams
    ): AgTypedChartInstance<TDatum, never, AgFinancialChartOptions<TDatum>>;

    /** Create a new `AgChartInstance` based upon the given configuration options. */
    createGauge<TDatum, TContext>(
        options: AgGaugeOptions<TDatum, TContext>,
        params?: AgChartParams
    ): AgTypedChartInstance<TDatum, TContext, AgGaugeOptions<TDatum, TContext>>;

    /** Create a new `AgChartInstance` based upon the given configuration options. */
    createQuadrantChart<TDatum, TContext>(
        options: AgQuadrantChartOptions<TDatum, TContext>,
        params?: AgChartParams
    ): AgTypedChartInstance<TDatum, TContext, AgQuadrantChartOptions<TDatum, TContext>>;

    /** @private Internal to AG Grid, returns the `AgChartInstance` for a DOM node, if there is one. */
    getInstance(element: HTMLElement): AgChartInstance<AgChartOptions<unknown, unknown>> | undefined;
}
