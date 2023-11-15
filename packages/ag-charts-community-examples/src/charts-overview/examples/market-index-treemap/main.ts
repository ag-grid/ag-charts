import type { AgChartOptions, AgTreemapSeriesTooltipRendererParams} from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community'
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
          formatter({value}) {
            return value.toUpperCase()
          }
        },
        textAlign: 'left',
      },
      tile: {
        secondaryLabel: {
          formatter(params) {
            return params.value.toFixed(2) + '%';
          }
        }
      },
      highlightStyle: {
        tile: {
          label: {
            color: 'black'
          },
          secondaryLabel: {
            color: 'black'
          }
        }
      },
      tooltip: {
        renderer: tooltipRenderer,
      },
      formatter: params => ({
        fill: !params.datum.children ? undefined : params.highlighted ? '#aaa' : '#333',
        stroke: params.depth < 1 ? 'white' : 'black'
      }),
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

AgCharts.create(options)
