import * as agCharts from "ag-charts-community";
import { AgChartOptions } from "ag-charts-community";
import { getData } from "./data";

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  autoSize: true,
  data: getData(),
  theme: {
    palette: {
      fills: ['#330066', '#99CCFF'],
      strokes: ['#330066', '#99CCFF'],
    },
    overrides: {
      column: {
        axes: {
          category: {
            gridStyle: [],
          },
          number: {
            tick: {
              count: 5,
            },
          },
        },
        series: {
          highlightStyle: {
            item: {
              fill: 'rgb(40,40,40)',
              strokeWidth: 0
            },
            series: {
              dimOpacity: 0.3,
            },
          },
        },
      },
    },
  },
  title: {
    text: "Changes in Prison Population (2019)",
    fontSize: 18,
  },
  subtitle: {
    text:
      "Source: Ministry of Justice, HM Prison Service, and Her Majesty’s Prison and Probation Service",
  },
  series: [
    {
      type: "column",
      xKey: "month",
      yKey: "menDelta",
      yName: "Male",
    },
    {
      type: "column",
      xKey: "month",
      yKey: "womenDelta",
      yName: "Female",
    },
  ],
  axes: [
    {
      type: "category",
      position: "bottom",
      crossLines: [
        {
          type: 'range',
          range: ['Jan', 'Mar'],
          fill: 'rgb(223,223,223, 0.3)',
          strokeWidth: 0,
          label: {
            text: 'Q1',
            position: 'insideTop',
          },
        },
        {
          type: 'range',
          range: ['Apr', 'Jun'],
          fill: undefined,
          strokeWidth: 0,
          label: {
            text: 'Q2',
            position: 'insideTop',
          },
        },
        {
          type: 'range',
          range: ['Jul', 'Sep'],
          fill: 'rgb(223,223,223, 0.3)',
          strokeWidth: 0,
          label: {
            text: 'Q3',
            position: 'insideTop',
          },
        },
        {
          type: 'range',
          range: ['Oct', 'Dec'],
          fill: undefined,
          strokeWidth: 0,
          label: {
            text: 'Q4',
            position: 'insideTop',
          },
        },
      ],
    },
    {
      type: "number",
      position: "left",
      crossLines: [
        {
          type: 'line',
          value: -321,
          fill: 'rgb(51,0,102, 0.1)',
          stroke: 'rgb(51,0,102, 0.3)',
          lineDash: [10, 2],
          label: {
            text: 'Peak Male Release',
            padding: 10,
            position: 'bottomRight',
          },
        },
        {
          type: 'range',
          range: [-90, 65],
          fill: 'rgb(51,0,102, 0.1)',
          stroke: 'rgb(51,0,102, 0.2)',
          strokeWidth: 0,
          label: {
            text: 'Female Range',
            padding: 10,
            position: 'insideTopRight',
          },
        },
      ],
    },
  ],
}

var chart = agCharts.AgChart.create(options)
