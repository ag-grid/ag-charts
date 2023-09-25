import { AgChart, AgChartOptions } from 'ag-charts-community';
import { getData } from "./data";

const options: AgChartOptions = {
  container: document.getElementById('myChart'),
  title: {
    text: "Apple's Revenue by Product Category",
  },
  subtitle: {
    text: 'in billion U.S. dollars',
  },
  data: getData(),
  series: [
    {
      type: 'bar',
      direction: 'horizontal',
      xKey: 'quarter',
      yKey: 'iphone',
      yName: 'iPhone',
    },
    {
      type: 'bar',
      direction: 'horizontal',
      xKey: 'quarter',
      yKey: 'mac',
      yName: 'Mac',
    },
    {
      type: 'bar',
      direction: 'horizontal',
      xKey: 'quarter',
      yKey: 'ipad',
      yName: 'iPad',
    },
    {
      type: 'bar',
      direction: 'horizontal',
      xKey: 'quarter',
      yKey: 'wearables',
      yName: 'Wearables',
    },
    {
      type: 'bar',
      direction: 'horizontal',
      xKey: 'quarter',
      yKey: 'services',
      yName: 'Services',
    },
  ],
}

AgChart.create(options)
