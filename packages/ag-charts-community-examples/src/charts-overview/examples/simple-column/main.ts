import type { AgChartOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-community"
import { getData } from "./data"

function formatNumber(value: number) {
  value /= 1000_000
  return `${Math.floor(value)}M`
}

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  data: getData(),
  title: {
    text: "Total Visitors to Museums and Galleries",
    fontSize: 18,
    spacing: 25,
  },
  footnote: {
    text: "Source: Department for Digital, Culture, Media & Sport",
  },
  series: [
    {
      type: "bar",
      xKey: "year",
      yKey: "visitors",
      fill: "#0084e7",
      strokeWidth: 0,
      shadow: {
        xOffset: 3,
      },
      label: {
        enabled: true,
        color: "#eeeeee",
        formatter: ({ value }) => formatNumber(value),
      },
      tooltip: {
        renderer: ({ datum, xKey, yKey }) => {
          return { title: datum[xKey], content: formatNumber(datum[yKey]) }
        },
      },
    },
  ],
  axes: [
    {
      type: "category",
      position: "bottom",
      title: {
        text: "Year",
      },
    },
    {
      type: "number",
      position: "left",
      title: {
        text: "Total visitors",
      },
      label: {
        formatter: ({ value }) => formatNumber(value),
      },
    },
  ],
}

const chart = AgCharts.create(options)
