import { AgChartOptions, AgEnterpriseCharts } from "ag-charts-enterprise"

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  autoSize: true,
  animation: {
    enabled: true,
  },
  data: [
    { label: "Android", value: 56.9 },
    { label: "iOS", value: 22.5 },
    { label: "BlackBerry", value: 6.8 },
    { label: "Symbian", value: 8.5 },
    { label: "Bada", value: 2.6 },
    { label: "Windows", value: 1.9 },
  ],
  series: [
    {
      type: "pie",
      angleKey: "value",
      calloutLabelKey: "label",
      sectorLabelKey: "value",
      sectorLabel: {
        color: "white",
        fontWeight: "bold",
      },
    },
  ],
}

AgEnterpriseCharts.create(options)
