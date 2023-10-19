import { AgChartOptions, AgChart } from 'ag-charts-community'
import { getData } from "./data";

const options: AgChartOptions = {
  container: document.getElementById('myChart'),
  title: {
    text: 'Annual Fuel Expenditure)',
  },
  data: getData(),
  series: [
    {
      type: 'line',
      xKey: 'quarter',
      yKey: 'petrol',
      yName: 'Petrol',
    },
    {
      type: 'line',
      xKey: 'quarter',
      yKey: 'diesel',
      yName: 'Diesel',
    },
  ],
}

AgChart.create(options)
