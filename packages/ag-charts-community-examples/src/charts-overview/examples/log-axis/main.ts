import type { AgCartesianAxisOptions, AgCartesianChartOptions} from "ag-charts-community";
import { AgCharts } from "ag-charts-community"
import { getData } from "./data"

const logAxes: Record<string, AgCartesianAxisOptions> = {
  y: {
    type: "log",
    position: "left",
    title: {
      text: "Population",
    },
    label: {
      format: ",.0f",
      fontSize: 10,
    },
  },
  x: {
    type: "number",
    position: "bottom",
    title: {
      text: "Year",
    },
    label: {
      fontSize: 10,
    },
  },
}

const linearAxes: Record<string, AgCartesianAxisOptions> = {
  y: {
    type: "number",
    position: "left",
    title: {
      text: "Population",
    },
    label: {
      format: ",.0f",
      fontSize: 10,
    },
  },
  x: {
    type: "number",
    position: "bottom",
    title: {
      text: "Year",
    },
    label: {
      fontSize: 10,
    },
  },
}

const options: AgCartesianChartOptions = {
  container: document.getElementById("myChart"),
  data: getData(),
  title: {
    text: "World Population Over Time",
  },
  subtitle: {
    text: "log scale",
  },
  series: [
    {
      type: "line",
      xKey: "year",
      yKey: "population",
    },
  ],
  axes: logAxes
}

const chart = AgCharts.create(options)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function setNumberAxis() {
  options.subtitle = {
    text: "linear scale",
  }
  options.axes = linearAxes
  await chart.update(options)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function setLogAxis() {
  options.subtitle = {
    text: "log scale",
  }
  options.axes = logAxes
  await chart.update(options)
}
