import type { AgChartOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-community"
import { getData } from "./data"

function getTotal(datum: any) {
  return (
    datum.ownerOccupied +
    datum.privateRented +
    datum.localAuthority +
    datum.housingAssociation
  )
}

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  data: getData().sort(function (a: any, b: any) {
    return getTotal(b) - getTotal(a)
  }),
  theme: {
    overrides: {
      bar: {
        series: {
          highlightStyle: {
            series: {
              strokeWidth: 1,
              dimOpacity: 0.3,
            },
          },
        },
      },
    },
  },
  title: {
    text: "UK Housing Stock",
  },
  footnote: {
    text: "Source: Ministry of Housing, Communities & Local Government",
  },
  series: [
    {
      type: "bar",
      direction: "horizontal",
      xKey: "type",
      yKey: "ownerOccupied",
      yName: "Owner occupied",
      stacked: true,
    },
    {
      type: "bar",
      direction: "horizontal",
      xKey: "type",
      yKey: "privateRented",
      yName: "Private rented",
      stacked: true,
    },
    {
      type: "bar",
      direction: "horizontal",
      xKey: "type",
      yKey: "localAuthority",
      yName: "Local authority",
      stacked: true,
    },
    {
      type: "bar",
      direction: "horizontal",
      xKey: "type",
      yKey: "housingAssociation",
      yName: "Housing association",
      stacked: true,
    },
  ],
  axes: [
    {
      type: "category",
      position: "left",
    },
    {
      type: "number",
      position: "top",
      nice: false,
    },
  ],
}

AgCharts.create(options)
