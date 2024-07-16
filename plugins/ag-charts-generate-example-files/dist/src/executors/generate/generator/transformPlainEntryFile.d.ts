import * as agCharts from 'ag-charts-community';
export declare function transformPlainEntryFile(entryFile: string, preamble?: string[]): {
    code: string;
    optionsById: Map<string, agCharts.AgChartOptions>;
};
