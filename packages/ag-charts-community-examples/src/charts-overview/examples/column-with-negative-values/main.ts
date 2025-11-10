import type { AgChartOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-community"
import { getData } from "./data"

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  data: getData(),
  theme: {
    palette: {
      fills: ["#19A0AA", "#F15F36"],
      strokes: ["#19A0AA", "#F15F36"],
    },
    overrides: {
      bar: {
        series: {
          highlight: {
            unhighlightedSeries: {
              opacity: 0.3,
            },
          },
        },
      },
    },
  },
  title: {
    text: "Changes in Prison Population",
    fontSize: 18,
    spacing: 25,
  },
  footnote: {
    text:
      "Source: Ministry of Justice, HM Prison Service, and Her Majesty’s Prison and Probation Service",
  },
  series: [
    {
      type: "bar",
      xKey: "month",
      yKey: "menDelta",
      yName: "Male",
    },
    {
      type: "bar",
      xKey: "month",
      yKey: "womenDelta",
      yName: "Female",
    },
  ],
  axes: {
    x: {
      type: "category",
      position: "bottom",
    },
    y: {
      type: "number",
      position: "left",
    },
  },
}

AgCharts.create(options)
