import { AgChart, AgChartOptions } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart') as HTMLElement,
    title: { text: "Ice Cream Sales and Avg Temp" },
    subtitle: { text: "UK Data from 2022" },
    theme: 'ag-material-dark',
    data: [
      { month: "Jan", avgTemp: 2.3, iceCreamSales: 162 },
      { month: "Mar", avgTemp: 6.3, iceCreamSales: 302 },
      { month: "May", avgTemp: 16.2, iceCreamSales: 800 },
      { month: "Jul", avgTemp: 22.8, iceCreamSales: 1254 },
      { month: "Sep", avgTemp: 14.5, iceCreamSales: 950 },
      { month: "Nov", avgTemp: 8.9, iceCreamSales: 200 }
    ],
    series: [
      { type: 'bar', xKey: "month", yKey: "iceCreamSales" }
    ]
};

AgChart.create(options);