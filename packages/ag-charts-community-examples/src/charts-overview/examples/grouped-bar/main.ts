import type { AgChartOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-community"
import { getData } from "./data"

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  data: getData(),
  theme: {
    palette: {
      fills: ["rgba(0, 117, 163, 0.9)", "rgba(226, 188, 34, 0.9)"],
      strokes: ["rgba(0, 117, 163, 0.9)", "rgba(226, 188, 34, 0.9)"],
    },
    overrides: {
      bar: {
        series: {
          strokeWidth: 0,
          highlight: {
            highlightedSeries: {
              strokeWidth: 1,
            },
            unhighlightedSeries: {
              opacity: 0.2,
            },
          },
        },
      },
    },
  },
  title: {
    text: "Annual Growth in Pay",
    fontSize: 18,
    spacing: 25,
  },
  footnote: {
    text: "Source: Office for National Statistics",
  },
  series: [
    {
      type: "bar",
      direction: "horizontal",
      xKey: "type",
      yKey: "total",
      yName: "Annual growth in total pay",
    },
    {
      type: "bar",
      direction: "horizontal",
      xKey: "type",
      yKey: "regular",
      yName: "Annual growth in regular pay",
    },
  ],
  axes: {
    y: {
      type: "category",
      position: "left",
    },
    x: {
      type: "number",
      position: "bottom",
      title: {
        enabled: true,
        text: "%",
      },
    },
  },
}

AgCharts.create(options)
