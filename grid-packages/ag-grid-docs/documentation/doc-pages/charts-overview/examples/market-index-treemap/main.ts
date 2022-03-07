import { AgChartOptions, AgTreemapSeriesTooltipRendererParams } from 'ag-charts-community'
import * as agCharts from 'ag-charts-community'
declare var data: any;

const options: AgChartOptions = {
  type: 'hierarchy',
  container: document.getElementById('myChart'),
  data,
  series: [
    {
      type: 'treemap',
      labelKey: 'name', // defaults to 'label', but current dataset uses 'name'
      sizeKey: 'size', // default (can be omitted for current dataset)
      colorKey: 'color', // default (can be omitted for current dataset)
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

function tooltipRenderer(params: AgTreemapSeriesTooltipRendererParams) {
  const { datum } = params
  const customRootText = 'Custom Root Text'
  const title = datum.parent
    ? datum.parent.depth
      ? datum.parent.datum[params.labelKey]
      : customRootText
    : customRootText
  let content = '<div>'
  let ellipsis = false

  if (datum.parent) {
    const maxCount = 5
    ellipsis = datum.parent.children!.length > maxCount
    datum.parent.children!.slice(0, maxCount).forEach(child => {
      content += `<div style="font-weight: bold; color: white; background-color: ${child.fill
        }; padding: 5px;"><strong>${child.datum.name || child.label
        }</strong>: ${String(
          isFinite(child.colorValue) ? child.colorValue.toFixed(2) : ''
        )}%</div>`
    })
  }
  if (ellipsis) {
    content += `<div style="text-align: center;">...</div>`
  }
  content += '</div>'
  return {
    title,
    content,
    backgroundColor: 'gray',
  }
}

agCharts.AgChart.create(options)
