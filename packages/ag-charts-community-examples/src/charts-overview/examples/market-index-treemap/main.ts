import type { AgChartOptions, AgTreemapSeriesTooltipRendererParams} from 'ag-charts-community';
import { AgChart } from 'ag-charts-community'
import { data } from './data'

const options: AgChartOptions = {
  container: document.getElementById('myChart'),
  data,
  series: [
    {
      type: 'treemap',
      labelKey: 'name',
      secondaryLabelKey: 'change',
      sizeKey: 'valuation',
      colorKey: 'change',
      group: {
        label: {
          color: 'white',
          formatter({ value }) {
            return value.toUpperCase();
          },
        },
        textAlign: 'left',
        fill: '#333',
        stroke: '#333',
        strokeWidth: 1,
        padding: 2,
      },
      tile: {
        label: {
          color: '#333',
        },
        secondaryLabel: {
          color: '#333',
          formatter(params) {
            return params.value.toFixed(2) + '%';
          },
        },
        strokeWidth: 0,
      },
      tileSpacing: 1,
      highlightStyle: {
        group: {
          fill: '#888',
          stroke: '#888',
        },
        tile: {
          label: {
            color: '#333',
          },
          secondaryLabel: {
            color: '#333',
          },
        },
      },
      tooltip: {
        renderer: tooltipRenderer,
      },
    },
  ],
  title: {
    text: 'S&P 500 index stocks categorized by sectors and industries.',
  },
  subtitle: {
    text:
      'Area represents market cap. Color represents change from the day before.',
  },
}

function tooltipRenderer(params: AgTreemapSeriesTooltipRendererParams<any>) {
  return {
    content: `<b>Change</b>: ${(params.datum[params.colorKey!]).toFixed(2)}%`,
  };
}

AgChart.create(options)
