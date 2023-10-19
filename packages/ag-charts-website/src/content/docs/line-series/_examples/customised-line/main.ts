import { AgChart, AgChartOptions } from 'ag-charts-community';
import { getData } from "./data";

const options: AgChartOptions = {
  container: document.getElementById('myChart'),
  title: {
    text: 'Annual Fuel Expenditure',
  },
  data: getData(),
  series: [
    {
      xKey: 'quarter',
      yKey: 'petrol',
      yName: 'Petrol',
      strokeWidth: 4,
      marker: {
        enabled: false,
      },
    },
    {
      xKey: 'quarter',
      yKey: 'diesel',
      yName: 'Diesel',
      stroke: 'black',
      label: {
        fontWeight: 'bold',
        formatter: ({ value }) => value.toFixed(0),
      },
      marker: {
        fill: 'orange',
        size: 10,
        stroke: 'black',
        strokeWidth: 3,
        shape: 'diamond',
      },
    },
  ],
}

AgChart.create(options)
