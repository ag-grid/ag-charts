import * as agCharts from 'ag-charts-community';
export declare function transformPlainEntryFile(entryFile: string, dataFile?: string): {
    code: string;
    optionsById: Map<string, agCharts.AgChartOptions>;
};
