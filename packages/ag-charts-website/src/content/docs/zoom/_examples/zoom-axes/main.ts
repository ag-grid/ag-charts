import {
  AgCartesianChartOptions,
  AgEnterpriseCharts,
} from "ag-charts-enterprise"
import { getData } from "./data"

const options: AgCartesianChartOptions = {
  container: document.getElementById("myChart"),
  title: {
    text: "Average expenditure on coffee",
  },
  subtitle: {
    text: "per person per week in Krakozhia",
  },
  zoom: {
    enabled: true,
    axes: "y",
  },
  tooltip: {
    enabled: false,
  },
  axes: [
    {
      type: "number",
      position: "left",
    },
    {
      type: "number",
      position: "bottom",
      nice: false,
      label: {
        autoRotate: false,
      },
    },
  ],
  data: getData(),
  series: [
    {
      type: "line",
      xKey: "year",
      yKey: "spending",
    },
  ],
}

AgEnterpriseCharts.create(options)
