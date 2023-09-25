import { AgChart, AgChartOptions } from 'ag-charts-community';
import { getData } from "./data";

const options: AgChartOptions = {
  container: document.getElementById('myChart'),
  title: {
    text: "Apple's revenue by product category",
  },
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
      stackGroup: 'Devices',
    },
    {
      type: 'bar',
      xKey: 'quarter',
      yKey: 'mac',
      yName: 'Mac',
      stackGroup: 'Devices',
    },
    {
      type: 'bar',
      xKey: 'quarter',
      yKey: 'ipad',
      yName: 'iPad',
      stackGroup: 'Devices',
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

AgChart.create(options)
