import { NgModule } from '@angular/core';

import { AgCharts } from './ag-charts.component';
import { AgFinancialCharts } from './ag-financial-charts.component';
import { AgGauge } from './ag-gauge.component';
import { AgQuadrantChart } from './ag-quadrant-chart.component';

@NgModule({
    declarations: [],
    imports: [AgCharts, AgFinancialCharts, AgGauge, AgQuadrantChart],
    exports: [AgCharts, AgFinancialCharts, AgGauge, AgQuadrantChart],
})
export class AgChartsModule {}
