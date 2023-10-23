import { AgChart, AgChartOptions } from "ag-charts-community";
import { getData } from "./data";

const options: AgChartOptions = {
  container: document.getElementById('myChart'),
  title: {
    text: 'Sales by Month',
  },
  data: getData(),
  series: [
    {
      type: 'area',
      xKey: 'month',
      yKey: 'subscriptions',
      yName: 'Subscriptions',
      stroke: 'blue',
      strokeWidth: 3,
      lineDash: [3,4],
      fill: 'lightBlue',
    },
    {
      type: 'area',
      xKey: 'month',
      yKey: 'services',
      yName: 'Services',
      stroke: 'red',
      strokeWidth: 3,
      fill: 'pink',
      marker: {
        enabled: true,
        fill: 'red'
      }
    },
    {
      type: 'area',
      xKey: 'month',
      yKey: 'products',
      yName: 'Products',
      stroke: 'green',
      strokeWidth: 3,
      fill: 'lightGreen',
      label: {
        enabled: true,
        fontWeight: 'bold',
        formatter: ({value}) => value.toFixed(0),
      }
      
    },
  ],
}

AgChart.create(options)
