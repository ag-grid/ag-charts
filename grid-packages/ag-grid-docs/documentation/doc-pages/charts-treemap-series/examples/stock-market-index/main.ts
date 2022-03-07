import { AgChartOptions } from 'ag-charts-community'
import * as agCharts from 'ag-charts-community'
declare var data: any;

const options: AgChartOptions = {
  type: 'hierarchy',
  container: document.getElementById('myChart'),
  data,
  series: [
    {
      type: 'treemap',
      labelKey: 'name', // defaults to 'label', but current dataset uses 'name'
      sizeKey: 'size', // default (can be omitted for current dataset)
      colorKey: 'color', // default (can be omitted for current dataset)
      tooltip: {
        renderer: params => {
          return {
            content: `<b>Change</b>: ${params.datum.colorValue.toFixed(2)}%`,
          }
        },
      },
    },
  ],
  title: {
    text: 'S&P 500 index stocks categorized by sectors and industries.',
  },
  subtitle: {
    text:
      'Area represents market cap. Color represents change from the day before.',
  },
}

agCharts.AgChart.create(options)
