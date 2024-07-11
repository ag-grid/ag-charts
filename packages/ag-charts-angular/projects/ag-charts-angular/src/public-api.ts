import { AgCharts } from 'ag-charts-community';

export * from './lib/ag-charts.component';
export * from './lib/ag-financial-charts.component';
export * from './lib/ag-charts.module';

export const setLicenseKey = AgCharts.setLicenseKey.bind(AgCharts);
