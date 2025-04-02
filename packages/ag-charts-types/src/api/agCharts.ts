import type { AgChartInstance, AgChartOptions, AgFinancialChartOptions, AgGaugeOptions } from '../chartBuilderOptions';
import type { GaugeDatum } from '../presets/gauge/commonOptions';

export interface AgChartsApi {
    /** Create a new `AgChartInstance` based upon the given configuration options. */
    create<TDatum, TOptions extends AgChartOptions<TDatum>>(options: TOptions): AgChartInstance<TDatum, TOptions>;

    /** Create a new `AgChartInstance` based upon the given configuration options. */
    createFinancialChart<TDatum>(
        options: AgFinancialChartOptions<TDatum>
    ): AgChartInstance<TDatum, AgFinancialChartOptions<TDatum>>;

    /** Create a new `AgChartInstance` based upon the given configuration options. */
    createGauge(options: AgGaugeOptions): AgChartInstance<GaugeDatum, AgGaugeOptions>;

    /** @private Internal to AG Grid, returns the `AgChartInstance` for a DOM node, if there is one. */
    getInstance(element: HTMLElement): AgChartInstance | undefined;
}
