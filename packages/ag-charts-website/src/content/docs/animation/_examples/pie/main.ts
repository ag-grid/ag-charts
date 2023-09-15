import { AgChart, AgChartOptions, AgEnterpriseCharts } from "ag-charts-enterprise"

const data = [
  { label: "Android", value: 56.9 },
  { label: "iOS", value: 22.5 },
  { label: "BlackBerry", value: 6.8 },
  { label: "Symbian", value: 8.5 },
  { label: "Bada", value: 2.6 },
  { label: "Windows", value: 1.9 },
];

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  animation: {
    enabled: true,
  },
  data,
  series: [
    {
      type: "pie",
      angleKey: "value",
      calloutLabelKey: "label",
      sectorLabelKey: "value",
      sectorLabel: {
        color: "white",
        fontWeight: "bold",
        formatter: ({ sectorLabelValue }) => sectorLabelValue ? `${Math.round(parseFloat(sectorLabelValue) * 100) / 100}` : '',
      },
    },
  ],
}

const chart = AgEnterpriseCharts.create(options)

function reset() {
  options.data = [...data];
  AgChart.update(chart, options as any)
}

function randomise() {
  options.data = [...data.map(d => ({
    ...d,
    value: d.value * (Math.random() * 0.2 + 0.5)
  }))]
  AgChart.update(chart, options as any)
}

function remove() {
  options.data = [
    ...data.filter(
      (d: any) =>
        d.label !== 'Android' &&
        d.label !== 'BlackBerry' &&
        d.label !== 'Windows'
    ),
  ]
  AgChart.update(chart, options as any)
}
