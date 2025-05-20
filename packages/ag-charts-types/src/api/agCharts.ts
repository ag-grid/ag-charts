import type { AgChartInstance, AgChartOptions, AgFinancialChartOptions, AgGaugeOptions } from '../chartBuilderOptions';

export interface AgChartsApi {
    /** Create a new `AgChartInstance` based upon the given configuration options. */
    create<TDatum, TContext, TOptions extends AgChartOptions<TDatum, TContext>>(
        options: TOptions
    ): AgChartInstance<TDatum, TContext, TOptions>;

    /** Create a new `AgChartInstance` based upon the given configuration options. */
    createFinancialChart<TDatum>(
        options: AgFinancialChartOptions<TDatum>
    ): AgChartInstance<TDatum, AgFinancialChartOptions<TDatum>>;

    /** Create a new `AgChartInstance` based upon the given configuration options. */
    createGauge(options: AgGaugeOptions): AgChartInstance<never, never, AgGaugeOptions>;

    /** @private Internal to AG Grid, returns the `AgChartInstance` for a DOM node, if there is one. */
    getInstance(element: HTMLElement): AgChartInstance<unknown, unknown, AgChartOptions<unknown, unknown>> | undefined;
}
