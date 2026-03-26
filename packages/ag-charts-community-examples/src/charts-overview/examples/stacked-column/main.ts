import type { AgChartOptions } from "ag-charts-community";
import {
  AgCharts
} from "ag-charts-community"
import { getData } from "./data"

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  data: getData(),
  theme: {
    palette: {
      fills: ["#5BC0EB", "#FDE74C", "#9BC53D", "#E55934", "#FA7921"],
      strokes: ["#4086a4", "#b1a235", "#6c8a2b", "#a03e24", "#af5517"],
    },
    overrides: {
      bar: {
        series: {
          strokeWidth: 0,
          highlight: {
            highlightedItem: {
              strokeWidth: 1,
            },
            unhighlightedSeries: {
              opacity: 0.3,
            },
          },
        },
      },
    },
  },
  title: {
    text: "Average Station Entries",
    fontSize: 18,
  },
  subtitle: {
    text: "Victoria Line (2010)",
  },
  footnote: {
    text: "Source: Transport for London",
  },
  series: [
    {
      type: "bar",
      xKey: "station",
      yKey: "early",
      stacked: true,
      yName: "Early",
    },
    {
      type: "bar",
      xKey: "station",
      yKey: "morningPeak",
      yName: "Morning peak",
      stacked: true,
    },
    {
      type: "bar",
      xKey: "station",
      yKey: "interPeak",
      yName: "Between peak",
      stacked: true,
    },
    {
      type: "bar",
      xKey: "station",
      yKey: "afternoonPeak",
      yName: "Afternoon peak",
      stacked: true,
    },
    {
      type: "bar",
      xKey: "station",
      yKey: "evening",
      yName: "Evening",
      stacked: true,
    },
  ],
  axes: {
    x: {
      type: "category",
      position: "bottom",
      label: {
        rotation: 30,
        wrapping: "never"
      },
    },
    y: {
      type: "number",
      position: "left",
      label: {
        formatter: params => {
          return params.value / 1000 + "k"
        },
      },
    },
  },
  padding: {
    bottom: 40,
  },
}

AgCharts.create(options)
