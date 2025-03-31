import type { AgChartInstance, AgChartOptions, AgFinancialChartOptions, AgGaugeOptions } from '../chartBuilderOptions';

export interface AgChartsApi {
    /** Create a new `AgChartInstance` based upon the given configuration options. */
    create<TDatum, T extends AgChartOptions<TDatum>>(options: AgChartOptions<TDatum>): AgChartInstance<T>;

    /** Create a new `AgChartInstance` based upon the given configuration options. */
    createFinancialChart<TDatum>(
        options: AgFinancialChartOptions<TDatum>
    ): AgChartInstance<AgFinancialChartOptions<TDatum>>;

    /** Create a new `AgChartInstance` based upon the given configuration options. */
    createGauge(options: AgGaugeOptions): AgChartInstance<AgGaugeOptions>;

    /** @private Internal to AG Grid, returns the `AgChartInstance` for a DOM node, if there is one. */
    getInstance(element: HTMLElement): AgChartInstance | undefined;
}
