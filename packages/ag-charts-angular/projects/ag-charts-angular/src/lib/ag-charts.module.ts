import { NgModule } from '@angular/core';

import { AgCharts } from './ag-charts.component';
import { AgFinancialCharts } from './ag-financial-charts.component';
import { AgGauge } from './ag-gauge.component';
import { AgQuadrantChart } from './ag-quadrant-chart.component';
import { AgVolumeProfileChart } from './ag-volume-profile-chart.component';

@NgModule({
    declarations: [],
    imports: [AgCharts, AgFinancialCharts, AgGauge, AgQuadrantChart, AgVolumeProfileChart],
    exports: [AgCharts, AgFinancialCharts, AgGauge, AgQuadrantChart, AgVolumeProfileChart],
})
export class AgChartsModule {}
