import { PropType } from 'vue';
import { AgChartInstance, AgChartOptions, AgFinancialChartOptions } from 'ag-charts-community';
export declare const AgCharts: import("vue").DefineComponent<{
    options: {
        type: PropType<AgChartOptions>;
        default: () => AgChartOptions;
    };
}, {
    chart: AgChartInstance | undefined;
}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    options: {
        type: PropType<AgChartOptions>;
        default: () => AgChartOptions;
    };
}>>, {
    options: AgChartOptions;
}, {}>;
export declare const AgFinancialCharts: import("vue").DefineComponent<{
    options: {
        type: PropType<AgFinancialChartOptions>;
        default: () => AgFinancialChartOptions;
    };
}, unknown, {
    chart: AgChartInstance<AgFinancialChartOptions> | undefined;
}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    options: {
        type: PropType<AgFinancialChartOptions>;
        default: () => AgFinancialChartOptions;
    };
}>>, {
    options: AgFinancialChartOptions;
}, {}>;
