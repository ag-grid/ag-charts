import type { AgChartThemeName } from 'ag-charts-types';
import { ChartTheme } from '../themes/chartTheme';
type SpecialThemeName = 'ag-financial' | 'ag-financial-dark';
export type ThemeMap = {
    [key in AgChartThemeName | SpecialThemeName | 'undefined' | 'null']?: () => ChartTheme;
};
export declare const themes: ThemeMap;
export declare function getChartTheme(unvalidatedValue: unknown): ChartTheme;
export {};
