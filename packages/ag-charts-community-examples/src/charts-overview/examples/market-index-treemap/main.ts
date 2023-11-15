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
          formatter({value}) {
            return value.toUpperCase()
          }
        },
        textAlign: 'left',
      },
      tile: {
        label: {
          color: '#333',
        },
        secondaryLabel: {
          color: '#333',
          formatter(params) {
            return params.value.toFixed(2) + '%';
          }
        }
      },
      tileSpacing: 1,
      highlightStyle: {
        tile: {
          label: {
            color: '#333'
          },
          secondaryLabel: {
            color: '#333'
          }
        }
      },
      tooltip: {
        renderer: tooltipRenderer,
      },
      formatter: ({ datum, depth, highlighted }) => {
        if (!datum.children) {
          return {
            stroke: 'rgba(0, 0, 0, 0.4)',
            strokeWidth: highlighted ? 2 : 0,
          };
        } else if (depth < 1) {
          return {
            fill: highlighted ? '#888' : '#333',
            stroke: 'white',
          };
        } else {
          return {
            fill: highlighted ? '#888' : '#333',
            stroke: highlighted ? '#888' : 'black',
          };
        }
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
