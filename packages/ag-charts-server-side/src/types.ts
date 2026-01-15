import type { AgChartOptions, AgFinancialChartOptions, AgGaugeOptions } from 'ag-charts-community';

export type ImageFormat = 'png' | 'jpeg';

/** Base render options shared by all chart types */
export interface BaseRenderOptions {
    width: number;
    height: number;
    format?: ImageFormat;
    pixelRatio?: number;
    /** JPEG quality 0-100 (only applies when format is 'jpeg') */
    quality?: number;
    /** Render timeout in milliseconds (default: 30000) */
    timeout?: number;
}

/** Generic render options parameterized by chart options type */
export interface ChartRenderOptions<T> extends BaseRenderOptions {
    options: Omit<T, 'width' | 'height' | 'container'>;
}

/** Render options for standard charts */
export type RenderOptions = ChartRenderOptions<AgChartOptions>;

/** Render options for gauge charts */
export type GaugeRenderOptions = ChartRenderOptions<AgGaugeOptions>;

/** Render options for financial charts */
export type FinancialChartRenderOptions = ChartRenderOptions<AgFinancialChartOptions>;

export interface FontDefinition {
    family: string;
    path: string;
    weight?: string;
    style?: string;
}

export interface IsolatedEnvironment {
    window: Window & typeof globalThis;
    document: Document;
    dispose: () => void;
}
