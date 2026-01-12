import type { AgChartOptions, AgFinancialChartOptions, AgGaugeOptions } from 'ag-charts-community';

export type ImageFormat = 'png' | 'jpeg';

export interface RenderOptions {
    options: AgChartOptions;
    width: number;
    height: number;
    format?: ImageFormat;
    pixelRatio?: number;
    quality?: number; // 0-100, JPEG only
    timeout?: number; // Milliseconds, default 30000
}

export interface GaugeRenderOptions {
    options: AgGaugeOptions;
    width: number;
    height: number;
    format?: ImageFormat;
    pixelRatio?: number;
    quality?: number;
    timeout?: number;
}

export interface FinancialChartRenderOptions {
    options: AgFinancialChartOptions;
    width: number;
    height: number;
    format?: ImageFormat;
    pixelRatio?: number;
    quality?: number;
    timeout?: number;
}

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
