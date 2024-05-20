import type { AgChartOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-community"
import { getData } from "./data"

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  data: getData(),
  theme: {
    overrides: {
      bar: {
        series: {
          strokeWidth: 0,
          highlightStyle: {
            item: {
              strokeWidth: 1,
            },
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
    text: "Regular Internet Users",
    fontSize: 18,
    spacing: 25,
  },
  footnote: {
    text: "Source: Office for National Statistics",
  },
  series: [
    { type: "bar", xKey: "year", yKey: "16-24" },
    { type: "bar", xKey: "year", yKey: "25-34" },
    { type: "bar", xKey: "year", yKey: "35-44" },
    { type: "bar", xKey: "year", yKey: "45-54" },
    { type: "bar", xKey: "year", yKey: "55-64" },
    { type: "bar", xKey: "year", yKey: "65-74" },
    { type: "bar", xKey: "year", yKey: "75+" },
  ],
  axes: [
    {
      type: "category",
      position: "bottom",
    },
    {
      type: "number",
      position: "left",
      label: {
        formatter: ({ value }) => `${value / 1000}M`,
      },
    },
  ],
}

const chart = AgCharts.create(options)
