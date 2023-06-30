import { AgChartOptions, AgChart } from 'ag-charts-community'

const data = [
  {
    beverage: 'Coffee',
    Q1: 450,
    Q2: 560,
    Q3: 600,
    Q4: 700,
  },
  {
    beverage: 'Tea',
    Q1: 270,
    Q2: 380,
    Q3: 450,
    Q4: 520,
  },
  {
    beverage: 'Milk',
    Q1: 180,
    Q2: 170,
    Q3: 190,
    Q4: 200,
  },
]

const highlightStyle = {
  item: {
    fill: 'red',
    stroke: 'maroon',
    strokeWidth: 4,
  },
  series: {
    dimOpacity: 0.2,
    strokeWidth: 2,
  },
}

const options: AgChartOptions = {
  data: data,
  container: document.body,
  title: {
    text: 'Beverage Expenses',
  },
  subtitle: {
    text: 'per quarter',
  },
  footnote: {
    text: 'Based on a sample size of 200 respondents',
  },
  legend: {
    position: 'right'
  },
  series: [
    {
      type: 'pie',
      title: {
        text: 'Q1',
        showInLegend: true,
        spacing: 0,
      },
      calloutLabel: {
        enabled: false,
      },
      angleKey: 'Q1',
      calloutLabelKey: 'beverage',
      showInLegend: true,
      outerRadiusOffset: 0,
      innerRadiusOffset: -20,
      highlightStyle,
    },
    {
      type: 'pie',
      title: {
        text: 'Q2',
        showInLegend: true,
        spacing: 0,
      },
      calloutLabel: {
        enabled: false,
      },
      angleKey: 'Q2',
      calloutLabelKey: 'beverage',
      outerRadiusOffset: -40,
      innerRadiusOffset: -60,
      highlightStyle,
    },
    {
      type: 'pie',
      title: {
        text: 'Q3',
        showInLegend: true,
        spacing: 0,
      },
      calloutLabel: {
        enabled: false,
      },
      angleKey: 'Q3',
      calloutLabelKey: 'beverage',
      outerRadiusOffset: -80,
      innerRadiusOffset: -100,
      highlightStyle,
    },
    {
      type: 'pie',
      title: {
        text: 'Q4',
        showInLegend: true,
        spacing: 0,
      },
      calloutLabel: {
        enabled: false,
      },
      angleKey: 'Q4',
      calloutLabelKey: 'beverage',
      outerRadiusOffset: -120,
      innerRadiusOffset: -140,
      highlightStyle,
    },
  ],
}

AgChart.create(options)
