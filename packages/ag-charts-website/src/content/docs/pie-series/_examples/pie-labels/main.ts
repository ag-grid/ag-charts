import { AgChartOptions, AgChart } from 'ag-charts-community';
import { getData } from './data';
const options: AgChartOptions = {
  container: document.getElementById('myChart'),
  data: [
      { label: 'Android', value: 56.9 },
      { label: 'iOS', value: 22.5 },
      { label: 'BlackBerry', value: 6.8 },
      { label: 'Symbian', value: 8.5 },
      { label: 'Windows', value: 2.6 },
  ],
  series: [
      {
          type: 'pie',
          angleKey: 'value',
          calloutLabelKey: 'label',
          sectorLabelKey: 'value',
      },
  ],
};

AgChart.create(options);
