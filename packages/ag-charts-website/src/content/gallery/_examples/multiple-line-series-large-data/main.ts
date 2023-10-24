import { AgChart, AgChartOptions } from 'ag-charts-community';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
      text: 'Trigonometric Functions',
    },
    subtitle: {
      text: 'From -2π to 2π, one cycle within 2π',
    },
    data: getData(),
    series: [
      {
        type: 'line',
        xKey: 'x',
        yKey: 'sinX',
        yName: 'Sine',
        strokeWidth: 4,
        marker: {
          enabled: false,
        },
      },
      {
        type: 'line',
        xKey: 'x',
        yKey: 'cosX',
        yName: 'Cosine',
        strokeWidth: 4,
        marker: {
          enabled: false,
        },
      },
      {
        type: 'line',
        xKey: 'x',
        yKey: 'tanX',
        yName: 'Tangent',
        strokeWidth: 4,
        marker: {
          enabled: false,
        },
      },
      {
        type: 'line',
        xKey: 'x',
        yKey: 'cscX',
        yName: 'Cosecant',
        lineDash: [4, 1, 4],
        strokeWidth: 3,
        marker: {
          enabled: false,
        },
      },
      {
        type: 'line',
        xKey: 'x',
        yKey: 'secX',
        yName: 'Secant',
        lineDash: [4, 1, 4],
        strokeWidth: 3,
        marker: {
          enabled: false,
        },
      },
      {
        type: 'line',
        xKey: 'x',
        yKey: 'cotX',
        yName: 'Cotangent',
        lineDash: [4, 1, 4],
        strokeWidth: 3,
        marker: {
          enabled: false,
        },
      },
    ],
    axes: [
      {
        position: 'left',
        type: 'number',
        min: -3,
        max: 3,
        crossLines: [
          {
            type: 'line',
            value: 0,
            label: {
              text: '► X',
              fontSize: 15,
              position: 'right',
              padding: 0,
            },
          },
          {
            type: 'range',
            range: [-1, 1],
            strokeWidth: 0
          },
        ],
      },
      {
        position: 'bottom',
        type: 'number',
        nice: false,
        label: {
          formatter: ({ value }) => `${value / Math.PI}π`,
        },
        tick: {
          interval: Math.PI,
        },
        crossLines: [
          {
            type: 'line',
            value: 0,
            label: {
              text: 'Y\n▲',
              fontSize: 15,
              position: 'top',
              padding: 0,
            },
          },
        ],
      },
    ],
  };

AgChart.create(options);
