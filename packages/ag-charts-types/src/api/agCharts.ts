import type { AgChartInstance, AgChartOptions, AgFinancialChartOptions, AgGaugeOptions } from '../chartBuilderOptions';

export interface AgChartsApi {
    /** Create a new `AgChartInstance` based upon the given configuration options. */
    create<T extends AgChartOptions>(options: AgChartOptions): AgChartInstance<T>;
    /** Create a new `AgChartInstance` based upon the given configuration options. */
    createFinancialChart(options: AgFinancialChartOptions): AgChartInstance<AgFinancialChartOptions>;
    /** Create a new `AgChartInstance` based upon the given configuration options. */
    createGauge(options: AgGaugeOptions): AgChartInstance<AgGaugeOptions>;

    setLicenseKey(licenseKey: string): void;

    /** @private Internal to AG Grid, returns the `AgChartInstance` for a DOM node, if there is one. */
    getInstance(element: HTMLElement): AgChartInstance | undefined;
    /** @private Internal to AG Grid, not for end-user consumption. */
    setGridContext(enabled: boolean): void;
}
