import { AgChart, AgChartOptions } from "ag-charts-community"
import { getData } from "./data"

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  data: getData(),
  title: {
    text: "Change in Number of Jobs in UK\n(June to September)",
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
      xKey: "job",
      yKey: "change",
      fill: "rgba(0, 117, 163, 0.9)",
      stroke: "rgba(0, 117, 163, 0.9)",
      highlightStyle: {
        item: {
          fill: "#0ab9ff",
        },
      },
      label: {
        fontWeight: "bold",
        color: "white",
        formatter: params => {
          return (params.defaultValue > 0 ? "+" : "") + params.defaultValue
        },
      },
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
        text: "Change in number of jobs (thousands)",
      },
    },
  ],
}

var chart = AgChart.create(options)
