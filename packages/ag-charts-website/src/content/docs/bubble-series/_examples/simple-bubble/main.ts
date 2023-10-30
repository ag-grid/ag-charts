import { AgChartOptions, AgChart } from 'ag-charts-community'
import { maleHeightWeight, femaleHeightWeight } from './height-weight-data'

const options: AgChartOptions = {
  container: document.getElementById('myChart'),
  title: {
    text: 'Weight vs Height',
  },
  subtitle: {
    text: 'by gender',
  },
  series: [
    {
      type: 'bubble',
      title: 'Male',
      data: maleHeightWeight,
      xKey: 'height',
      xName: 'Height',
      yKey: 'weight',
      yName: 'Weight',
      sizeKey: 'age',
      sizeName: 'Age',
    },
    {
      type: 'bubble',
      title: 'Female',
      data: femaleHeightWeight,
      xKey: 'height',
      xName: 'Height',
      yKey: 'weight',
      yName: 'Weight',
      sizeKey: 'age',
      sizeName: 'Age',
    },
  ],
  axes: [
    {
      type: 'number',
      position: 'bottom',
      title: {
        text: 'Height',
      },
      label: {
        formatter: (params) => {
          return params.value + 'cm'
        },
      },
    },
    {
      type: 'number',
      position: 'left',
      title: {
        text: 'Weight',
      },
      label: {
        formatter: (params) => {
          return params.value + 'kg'
        },
      },
    },
  ],
}

AgChart.create(options)
