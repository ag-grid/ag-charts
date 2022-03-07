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
      labelKey: 'orgHierarchy',
      colorParents: true,
      gradient: false,
      nodePadding: 5,
      sizeKey: undefined, // make all siblings within a parent the same size
      colorKey: undefined, // if undefined, depth will be used an the value, where root has 0 depth
      colorDomain: [0, 2, 4],
      colorRange: ['#d73027', '#fee08b', '#1a9850'],
    },
  ],
  title: {
    text: 'Organizational Chart',
  },
  subtitle: {
    text: 'of a top secret startup',
  },
}

agCharts.AgChart.create(options)
