import { AgChart, AgChartOptions } from 'ag-charts-community';

// Chart Options
const options: AgChartOptions = {
    // Data to be displayed
    data: [
      { beverage: 'Coffee', Q1: 700 },
      { beverage: 'Tea', Q1: 520 },
      { beverage: 'Milk', Q1: 200 }
    ],
    // Container element
    container: document.getElementById('myChart'),
    // Series Info
    series: [
        {
            type: 'bar', // Type of Chart 
            xKey: 'beverage', // Data for X axis
            yKey: 'Q1', // Data for Y axis
        },
    ],
};


// Create the Chart
AgChart.create(options);