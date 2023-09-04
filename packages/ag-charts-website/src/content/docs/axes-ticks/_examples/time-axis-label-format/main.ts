import { AgCartesianChartOptions, AgChart, AgTimeAxisThemeOptions, time } from 'ag-charts-community'

const options: AgCartesianChartOptions & { axes: AgTimeAxisThemeOptions[] } = {
  container: document.getElementById('myChart'),
  title: {
    text: 'Monthly average daily temperatures in the UK',
  },
  series: [
    {
      type: 'line',
      xKey: 'date',
      yKey: 'temp',
    },
  ],
  axes: [
    {
      type: 'time',
      nice: false,
      position: 'bottom',
      tick: {
        interval: time.month,
      },
      label: {
        format: '%b %Y',
      },
    },
    {
      type: 'number',
      position: 'left',
      label: {
        formatter: (params) => {
          return params.value + ' °C'
        },
      },
    },
  ],
  padding: {
    top: 20,
    right: 40,
    bottom: 20,
    left: 20,
  },
  data: [
    {
      date: new Date('01 Jan 2019 00:00:00 GMT'),
      temp: 4.2,
    },
    {
      date: new Date('01 Feb 2019 00:00:00 GMT'),
      temp: 6.9,
    },
    {
      date: new Date('01 Mar 2019 00:00:00 GMT'),
      temp: 7.9,
    },
    {
      date: new Date('01 Apr 2019 00:00:00 GMT'),
      temp: 9.1,
    },
    {
      date: new Date('01 May 2019 00:00:00 GMT'),
      temp: 11.2,
    },
  ],
}

var chart = AgChart.create(options)

function useOneMonthInterval() {
  options.axes![0].tick!.interval = time.month
  AgChart.update(chart, options)
}

function useTwoMonthInterval() {
  options.axes![0].tick!.interval = time.month.every(2)
  AgChart.update(chart, options)
}
