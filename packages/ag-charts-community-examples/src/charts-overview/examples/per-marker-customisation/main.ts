import type { AgChartOptions } from "ag-charts-community";
import { AgCharts } from "ag-charts-community"
import { getData } from "./data"

const minSize = 5
const maxSize = 100

function find(arr: any[], predicate: any) {
  for (let i = 0, ln = arr.length; i < ln; i++) {
    const value = arr[i]
    if (predicate(value, i, arr)) {
      return value
    }
  }
}

function calculateColour(size: number) {
  const colours: Record<number, string> = {
    0.1: "#33CC00",
    0.2: "#5CC200",
    0.3: "#85B800",
    0.4: "#ADAD00",
    0.5: "#D6A300",
    0.6: "#FF9900",
    0.7: "#FF7300",
    0.8: "#FF4D00",
    0.9: "#FF2600",
    1: "#FF0000",
  }

  const position = (size - minSize) / (maxSize - minSize)

  const keys = Object.keys(colours)
    .map(function (key) {
      return parseFloat(key)
    })
    .sort()
  const matchingKey = find(keys, function (key: number) {
    return key > position
  })

  return colours[matchingKey]
}

const options: AgChartOptions = {
  container: document.getElementById("myChart"),
  autoSize: true,
  data: getData().filter(function (d) {
    return d.magnitude > 4
  }),
  title: {
    text: "Worldwide Earthquakes",
    fontSize: 18,
    spacing: 25,
  },
  footnote: {
    text: "Source: US Geological Survey",
  },
  series: [
    {
      type: "bubble",
      xKey: "depth",
      xName: "Depth",
      yKey: "minDistance",
      yName: "Minimum Distance",
      sizeKey: "magnitude",
      sizeName: "Magnitude",
      marker: {
        size: minSize,
        maxSize: maxSize,
        formatter: params => {
          return {
            fill: params.highlighted
              ? params.fill
              : calculateColour(params.size),
          }
        },
        strokeWidth: 0,
        fillOpacity: 0.7,
        strokeOpacity: 0.7,
      },
    },
  ],
  axes: [
    {
      position: "bottom",
      type: "number",
      title: {
        text: "Depth (m)",
      },
    },
    {
      position: "left",
      type: "number",
      title: {
        text: "Minimum distance (km)",
      },
    },
  ],
  seriesArea: {
    padding: {
      left: 20,
      bottom: 15,
    },
  },
}

const chart = AgCharts.create(options)
