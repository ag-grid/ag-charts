import type { AgCartesianSeriesTooltipRendererParams, AgChartOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-community"
import { getData } from "./data"

function tooltipRenderer(params: AgCartesianSeriesTooltipRendererParams) {
  const formatThousands = function (value: number) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const tooltipHtml = [
    '<div class="my-tooltip">',
    '<span class="my-tooltip__title" style="color: ' +
      params.color +
      '">' +
      params.yName,
    "(" +
      params.datum[params.xKey] +
      "):</span> " +
      formatThousands(params.datum[params.yKey]) +
      " tonnes",
    "</div>",
  ]

  return tooltipHtml.join("\n")
}

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
    overrides: {
      bar: {
        series: {
          strokeWidth: 0,
          tooltip: {
            renderer: tooltipRenderer,
          },
        },
      },
    },
  },
  title: {
    text: "WEEE Collected in UK",
    fontSize: 18,
    spacing: 25,
  },
  footnote: {
    text: "Source: Environmental Agency",
  },
  tooltip: {
    class: "my-tooltip",
  },
  series: [
    {
      type: "bar",
      xKey: "quarter",
      yKey: "largeHousehold",
      yName: "Large household appliances",
      stacked: true,
    },
    {
      type: "bar",
      xKey: "quarter",
      yKey: "smallHousehold",
      yName: "Small household appliances",
      stacked: true,
    },
    {
      type: "bar",
      xKey: "quarter",
      yKey: "itTelecomms",
      yName: "IT and telecomms equipment",
      stacked: true,
    },
    {
      type: "bar",
      xKey: "quarter",
      yKey: "consumer",
      yName: "Consumer equipment",
      stacked: true,
    },
    {
      type: "bar",
      xKey: "quarter",
      yKey: "tools",
      yName: "Electrical and electronic tools",
      stacked: true,
    },
    {
      type: "bar",
      xKey: "quarter",
      yKey: "displays",
      yName: "Display equipment",
      stacked: true,
    },
    {
      type: "bar",
      xKey: "quarter",
      yKey: "cooling",
      yName: "Cooling appliances containing refrigerants",
      stacked: true,
    },
    {
      type: "bar",
      xKey: "quarter",
      yKey: "gasLampsLed",
      yName: "Gas discharge lamps and LED light sources",
      stacked: true,
    },
  ],
  axes: [
    {
      type: "category",
      position: "bottom",
    },
    {
      type: "number",
      position: "left",
      title: {
        text: "Waste collected (tonnes)",
      },
      label: {
        formatter: params => {
          return params.value / 1000 + "k"
        },
      },
    },
  ],
}

const chart = AgCharts.create(options)
