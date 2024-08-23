import { NgModule } from '@angular/core';

import { AgCharts } from './ag-charts.component';
import { AgFinancialCharts } from './ag-financial-charts.component';
import { AgGauge } from './ag-gauge.component';

@NgModule({
    declarations: [],
    imports: [AgCharts, AgFinancialCharts, AgGauge],
    exports: [AgCharts, AgFinancialCharts, AgGauge],
})
export class AgChartsModule {}
