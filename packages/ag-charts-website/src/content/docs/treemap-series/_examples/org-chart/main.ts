import { AgChartOptions, AgChart } from 'ag-charts-community'
import { data } from './data'

const options: AgChartOptions = {
  container: document.getElementById('myChart'),
  data,
  series: [
    {
      type: 'treemap',
      labelKey: 'orgHierarchy',
      gradient: false,
      nodePadding: 10,
      nodeGap: 10,
      sizeKey: undefined, // make all siblings within a parent the same size
      colorKey: undefined, // if undefined, depth will be used an the value, where root has 0 depth
      colorDomain: [0, 2, 4, 5],
      colorRange: ['#d73027', '#fee08b', '#1a9850', 'rgb(0, 116, 52)'],
      groupFill: undefined,
      formatter: ({ datum, labelKey, highlighted }) => {
        if (datum[labelKey] === 'Joel Cooper') {
          return { fill: highlighted ? 'white' : 'orchid' };
        }
        return {};
      },
      title: {
        padding: 10,
      },
      subtitle: {
        padding: 10,
      },
    },
  ],
  title: {
    text: 'Organizational Chart',
  },
  subtitle: {
    text: 'of a top secret startup',
  },
}

AgChart.create(options)
