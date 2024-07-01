import { type CSSProperties } from 'react';
import { type AgChartInstance, type AgChartOptions, AgFinancialChartOptions } from 'ag-charts-community';
export interface AgChartProps {
    options: AgChartOptions;
    style?: CSSProperties;
    className?: string;
}
export declare const AgCharts: import("react").ForwardRefExoticComponent<AgChartProps & import("react").RefAttributes<AgChartInstance<AgChartOptions>>>;
export interface AgFinancialChartProps {
    options: AgFinancialChartOptions;
    style?: CSSProperties;
    className?: string;
}
export declare const AgFinancialCharts: import("react").ForwardRefExoticComponent<AgFinancialChartProps & import("react").RefAttributes<AgChartInstance<AgChartOptions>>>;
