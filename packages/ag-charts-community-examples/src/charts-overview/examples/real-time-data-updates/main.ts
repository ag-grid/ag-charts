import type { AgCartesianChartOptions} from "ag-charts-community";
import { AgCharts, time } from "ag-charts-community"

let systemLoad = 0
let userLoad = 0
const data: any[] = []
const refreshRateInMilliseconds = 50
const millisecondsOfData = 30 * 1000
const now = Date.now();

function calculateRandomDelta(maxChange: number) {
  return maxChange / 2 - Math.floor(Math.random() * Math.floor(maxChange + 1))
}

function ensureBounds(load: number, max: number) {
  if (load > max) {
    return max
  } else if (load < 0) {
    return 0
  }

  return load
}

function calculateCpuUsage() {
  systemLoad = ensureBounds(systemLoad + calculateRandomDelta(2), 30)
  userLoad = ensureBounds(userLoad + calculateRandomDelta(4), 70)
}

function getData() {
  const dataCount = millisecondsOfData / refreshRateInMilliseconds
  data.shift()

  let timeDelta = (dataCount - data.length - 1) * refreshRateInMilliseconds
  const now = Date.now()

  while (data.length < dataCount) {
    calculateCpuUsage()
    data.push({ time: now - timeDelta, system: systemLoad, user: userLoad })
    timeDelta -= refreshRateInMilliseconds
  }

  return data
}

const options: AgCartesianChartOptions = {
  container: document.getElementById("myChart"),
  data: getData(),
  theme: {
    palette: {
      fills: ["#ec4d3d", "#4facf2"],
      strokes: ["#ec4d3d", "#4facf2"],
    },
    overrides: { area: { series: { fillOpacity: 0.5 } } },
  },
  title: {
    text: "Simulated CPU Usage",
    fontSize: 18,
  },
  series: [
    { type: "area", xKey: "time", yKey: "system", stacked: true, yName: "System" },
    { type: "area", xKey: "time", yKey: "user", stacked: true, yName: "User" },
  ],
  axes: [
    {
      type: "time",
      position: "bottom",
      nice: false,
      tick: {
        interval: time.second.every(5, { snapTo: now }),
      },
    },
    {
      type: "number",
      position: "left",
      title: {
        text: "Load (%)",
      },
      min: 0,
      max: 100,
    },
  ],
}

const chart = AgCharts.create(options)

/** inScope */
function updateData() {
  const now = Date.now()
  options.data = getData()
  chart.update(options)
}
//@ts-ignore
setInterval(this.updateData, refreshRateInMilliseconds)
