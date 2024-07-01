import type { AgChartInstance, AgChartOptions, AgFinancialChartOptions } from 'ag-charts-types';
/**
 * Factory for creating and updating instances of AgChartInstance.
 *
 * @docsInterface
 */
export declare abstract class AgCharts {
    private static licenseManager?;
    private static licenseChecked;
    private static licenseKey?;
    private static gridContext;
    private static licenseCheck;
    /** @private - for use by Charts website dark-mode support. */
    static optionsMutationFn?: (opts: AgChartOptions, preset?: string) => AgChartOptions;
    static setLicenseKey(licenseKey: string): void;
    static setGridContext(gridContext: boolean): void;
    static getLicenseDetails(licenseKey: string): {} | undefined;
    /**
     * Returns the `AgChartInstance` for a DOM node, if there is one.
     */
    static getInstance(element: HTMLElement): AgChartInstance | undefined;
    /**
     * Create a new `AgChartInstance` based upon the given configuration options.
     */
    static create<O extends AgChartOptions>(options: O): AgChartInstance<O>;
    static createFinancialChart(options: AgFinancialChartOptions): AgChartInstance<AgFinancialChartOptions>;
}
