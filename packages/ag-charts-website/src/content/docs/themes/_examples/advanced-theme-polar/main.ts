import { AgChart, AgChartOptions, AgChartTheme } from "ag-charts-community"
import { getData } from "./data";

var myTheme: AgChartTheme = {
  baseTheme: "ag-default-dark",
  palette: {
    fills: ["#5C2983", "#0076C5", "#21B372", "#FDDE02", "#F76700", "#D30018"],
    strokes: ["gray"],
  },
  overrides: {
    common: {
      title: {
        fontSize: 24,
      },
      padding: {
        left: 70,
        right: 70,
      },
      axes: {
        category: {
          line: {
            color: "gray",
          },
          tick: {
            color: "gray",
          },
        },
        number: {
          line: {
            color: "gray",
          },
          tick: {
            color: "gray",
          },
        },
      },
    },
    line: {
      series: {
        marker: {
          shape: "circle",
        },
      },
    },
    bar: {
      series: {
        label: {
          enabled: true,
          color: "white",
        },
      },
    },
    pie: {
      padding: {
        top: 40,
        bottom: 40,
      },
      legend: {
        position: "left",
      },
      series: {
        calloutLabel: {
          enabled: true,
        },
        calloutLine: {
          colors: ["gray"],
        },
      },
    },
  },
}

const options: AgChartOptions = {
  theme: myTheme,
  container: document.getElementById("myChart"),
  title: {
    text: "Polar Chart Theming",
  },
  data: getData(),
  series: [
    {
      type: "pie",
      angleKey: "v4",
      calloutLabelKey: "label",
    },
  ],
}

AgChart.create(options);
