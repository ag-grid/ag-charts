import { AgChart, AgChartOptions } from "ag-charts-community"
import { getData } from "./data"

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  autoSize: true,
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
          highlightStyle: {
            series: {
              strokeWidth: 1,
              dimOpacity: 0.2,
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
      xKey: "type",
      yKey: "total",
      yName: "Annual growth in total pay",
    },
    {
      type: "bar",
      xKey: "type",
      yKey: "regular",
      yName: "Annual growth in regular pay",
    },
  ],
  axes: [
    {
      type: "category",
      position: "left",
    },
    {
      type: "number",
      position: "bottom",
      title: {
        enabled: true,
        text: "%",
      },
    },
  ],
}

var chart = AgChart.create(options)
