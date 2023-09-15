import { AgChartOptions, AgChartTheme, AgChart } from 'ag-charts-community'
import { getData } from './data';

const options: AgChartOptions = {
  container: document.getElementById('myChart'),
  theme: 'ag-default-dark',
  title: {
    text: 'Chart Theme Example',
  },
  data: getData(),
  series: [
    {
      type: 'pie',
      angleKey: 'value',
      calloutLabelKey: 'label',
    },
  ],
}

var chart = AgChart.create(options)

function applyTheme(theme: AgChartTheme) {
  options.theme = theme
  AgChart.update(chart, options)
}
