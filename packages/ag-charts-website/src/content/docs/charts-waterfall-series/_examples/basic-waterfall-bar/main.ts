import { AgChartOptions, AgEnterpriseCharts } from "ag-charts-enterprise"
import { getData } from "./data"

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  data: getData(),
  title: {
    text: "Waterfall Bar",
  },
  series: [
    {
      type: "waterfall-bar",
      xKey: "date",
      xName: "Date",
      yKey: "amount",
      yName: "Amount",
    },
  ],
}

AgEnterpriseCharts.create(options)
