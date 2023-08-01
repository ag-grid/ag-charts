import { AgChartOptions, AgEnterpriseCharts } from "ag-charts-enterprise"
import { getData } from "./data"

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  data: getData(),
  title: {
    text: "Range Column",
  },
  series: [
    {
      type: "range-column",
      xKey: "date",
      xName: "Date",
      yMinKey: "low",
      yMaxKey: "high",
    } as any,
  ],
}

AgEnterpriseCharts.create(options)
