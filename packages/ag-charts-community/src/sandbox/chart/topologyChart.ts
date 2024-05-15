import { BaseChart } from './baseChart';
import type { ChartOptions } from './chartOptions';
import type { TopologyChartOptions } from './chartTypes';

export class TopologyChart extends BaseChart<TopologyChartOptions> {
    protected override onOptionsChange(options: ChartOptions<TopologyChartOptions>) {
        super.onOptionsChange(options);

        // handle unique options such as `topology`
    }
}
