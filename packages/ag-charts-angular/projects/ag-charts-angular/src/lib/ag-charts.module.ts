import { NgModule } from '@angular/core';

import { AgCharts } from './ag-charts.component';
import { AgFinancialCharts } from './ag-financial-charts.component';

@NgModule({
    declarations: [],
    imports: [AgCharts, AgFinancialCharts],
    exports: [AgCharts, AgFinancialCharts],
})
export class AgChartsModule {}
