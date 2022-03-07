import { AgChartOptions } from 'ag-charts-community'
import * as agCharts from 'ag-charts-community'

const options: AgChartOptions = {
  container: document.getElementById('myChart'),
  autoSize: true,
  data: getData(),
  title: {
    text: 'Engine size distribution (USA 1987)',
    fontSize: 18,
  },
  subtitle: {
    text: 'Source: UCI',
  },
  series: [
    {
      type: 'histogram',
      xKey: 'engine-size',
      xName: 'Engine Size',
      fillOpacity: 0.5,
    },
  ],
  axes: [
    {
      position: 'bottom',
      type: 'number',
      title: {
        enabled: true,
        text: 'Engine Size (Cubic inches)',
      },
    },
    {
      position: 'left',
      type: 'number',
      title: {
        enabled: true,
        text: 'Frequency',
      },
    },
  ],
  legend: {
    enabled: false,
  },
}

var chart = agCharts.AgChart.create(options)
