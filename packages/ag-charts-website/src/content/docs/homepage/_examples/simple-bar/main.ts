import { AgChart, AgChartOptions } from 'ag-charts-community';
import { getData } from "./data";

const simpleBarOptions: AgChartOptions = {
  container: document.getElementById('simpleBarMyChart'),
  title: {
    text: "TODO: Find better hero chart",
  },
  background: { fill: '#ddd' },
  subtitle: {
    text: 'in billion U.S. dollars',
  },
  data: getData(),
  series: [
    {
      type: 'bar',
      xKey: 'quarter',
      yKey: 'iphone',
      yName: 'iPhone',
    },
    {
      type: 'bar',
      xKey: 'quarter',
      yKey: 'mac',
      yName: 'Mac',
    },
    {
      type: 'bar',
      xKey: 'quarter',
      yKey: 'ipad',
      yName: 'iPad',
    },
    {
      type: 'bar',
      xKey: 'quarter',
      yKey: 'wearables',
      yName: 'Wearables',
    },
    {
      type: 'bar',
      xKey: 'quarter',
      yKey: 'services',
      yName: 'Services',
    },
  ],
}

AgChart.create(simpleBarOptions)
