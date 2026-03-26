export type {
    AgBaseRenderOptions,
    AgChartRenderOptions,
    AgFinancialChartRenderOptions,
    AgFontDefinition,
    AgGaugeRenderOptions,
    AgImageFormat,
    AgRenderOptions,
} from 'ag-charts-community';

export interface IsolatedEnvironment {
    window: Window & typeof globalThis;
    document: Document;
    dispose: () => void;
}
