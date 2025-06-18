import type {
  AgPieSeriesOptions,
  AgPolarChartOptions,
} from "ag-charts-community";
import {
  AgCharts
} from "ag-charts-community"
import { getData2020, getData2022 } from "./data"

const numFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
})

const sharedSeriesOptions: AgPieSeriesOptions = {
  type: 'pie',
  sectorLabelKey: "share",
  angleKey: "share",
  sectorLabel: {
    color: "white",
    fontWeight: "bold",
    formatter: ({ datum, sectorLabelKey }) => {
      return numFormatter.format(datum[sectorLabelKey!])
    },
  },
  fills: ["#49afda", "#57cc8b", "#f4b944", "#fb7451", "#b7b5ba"],
  strokeWidth: 0,
  legendItemKey: "browser",
  highlight: {
    highlightedItem: {
      fillOpacity: 0,
      stroke: "#535455",
      strokeWidth: 1,
    },
  },
}

const options: AgPolarChartOptions = {
  container: document.getElementById("myChart"),
  title: {
    text: "Desktop Browser Market Share 2020 vs 2022",
    fontSize: 18,
    spacing: 25,
  },
  padding: {
    top: 32,
    right: 20,
    bottom: 20,
    left: 20,
  },
  series: [
    {
      ...sharedSeriesOptions,
      data: getData2020(),
      outerRadiusRatio: 0.5,
      showInLegend: false,
      title: {
        text: "January 2020",
        fontWeight: "bold",
      },
    },
    {
      ...sharedSeriesOptions,
      type: 'donut',
      data: getData2022(),
      title: {
        text: "September 2022",
        fontWeight: "bold",
      },
      calloutLabelKey: "browser",
      calloutLabel: {
        minAngle: 25,
      },
      calloutLine: {
        strokeWidth: 1,
      },
      strokes: ["black"],
    },
  ],
}

const chart = AgCharts.create(options)
