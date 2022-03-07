import { AgChartOptions } from 'ag-charts-community'
import * as agCharts from 'ag-charts-community'

const options: AgChartOptions = {
  container: document.getElementById('myChart'),
  title: {
    text: 'Prize money distribution',
  },
  subtitle: {
    text: 'Total winnings by participant age',
  },
  data: getData(),
  series: [
    {
      type: 'histogram',
      xKey: 'age',
      xName: 'Participant Age',
      yKey: 'winnings',
      yName: 'Winnings',
      aggregation: 'sum',
    },
  ],
  legend: {
    enabled: false,
  },
  axes: [
    {
      type: 'number',
      position: 'bottom',
      title: { text: 'Age band (years)' },
    },
    {
      type: 'number',
      position: 'left',
      title: { text: 'Total winnings (USD)' },
    },
  ],
  height: 550,
}

agCharts.AgChart.create(options)
