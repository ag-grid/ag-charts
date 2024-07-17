const financialChartsReact = `\`\`\`js
const [options, setOptions] = useState({
    data: getData(),
});\n
return (
    <AgFinancialCharts options={options} />
);
\`\`\``;

const financialChartsAngular = `\`\`\`js
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [AgFinancialCharts],
    template: \`<ag-financial-charts [options]="options"></ag-financial-charts>\`,
})\n
export class AppComponent {
    public options: AgFinancialChartOptions;
    constructor() {
        this.options = {
            data: getData(),
        };
    }
\`\`\``;

const financialChartsVue3 = `\`\`\`js
template: \`<ag-financial-charts :options="options"/>\`,
components: {
    'ag-financial-charts': AgFinancialCharts,
},
data() {
    return {
        options: {
            data: getData(),
        },
    };
}
\`\`\``;

const quickStartReact = `
1. Import the React Chart

\`\`\`js
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

// React Chart Component
import { AgCharts } from 'ag-charts-react';
\`\`\`

2. Define Chart Data and Series

\`\`\`js
const ChartExample = () => {
    // Chart Options: Control & configure the chart
    const [chartOptions, setChartOptions] = useState({
        // Data: Data to be displayed in the chart
        data: [
            { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
            { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
            { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
            { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
            { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
            { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
        ],
        // Series: Defines which chart type and data to use
        series: [{ type: 'bar', xKey: 'month', yKey: 'iceCreamSales' }],
    });

    // ...
};
\`\`\`

3. React Chart Component
   
Replace your index.js file (or root component) with the following code:

\`\`\`js
// React Chart Component
  return (
    // AgCharts component with options passed as prop
    <AgCharts options={chartOptions} />
  );
}

// Render component inside root element
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ChartExample />);
\`\`\`
`;
const quickStartAngular = `
1. Import the Angular Chart

\`\`\`js
import { Component } from '@angular/core';

// Angular Chart Component
import { AgCharts } from 'ag-charts-angular';
// Chart Options Type Interface
import { AgChartOptions } from 'ag-charts-community';
\`\`\`

2. Define Chart Data and Series

\`\`\`js
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AgCharts],
  template: \`\`,
})
export class AppComponent {
  // Chart Options
  public chartOptions: AgChartOptions;
  constructor() {
    this.chartOptions = {
      // Data: Data to be displayed in the chart
      data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
      ],
      // Series: Defines which chart type and data to use
      series: [{ type: 'bar', xKey: 'month', yKey: 'iceCreamSales' }]
    };
  }
}
\`\`\`

3. Angular Charts Component

\`\`\`js
template:
  \`<ag-charts
    style="height: 100%"
    [options]="chartOptions">
   </ag-charts>\`,
})
\`\`\`
`;

const quickStartVue3 = `
1. Import the Vue Chart

\`\`\`html
<template>
    <!-- The AG Charts component with chartsOptions as an attribute -->
    <ag-charts :options="options"> </ag-charts>
</template>

<script>
    import { ref } from 'vue';

    // Vue Chart Component
    import { AgCharts } from 'ag-charts-vue3';

    export default {
        name: 'App',
        components: {
            'ag-charts': AgCharts,
        },
        setup() {},
    };
</script>
\`\`\`

2. Instantiate the Vue3 Chart

\`\`\`js
// Chart Options
const options = {};

// Create Chart
const chart = agCharts.AgCharts.create(options);
\`\`\`

2. Define Chart Data and Series

\`\`\`html
<template>
    <!-- The AG Charts component with chartsOptions as an attribute -->
    <ag-charts :options="options"> </ag-charts>
</template>

<script>
    setup() {
      // Chart Options
        const options = ref({
         // Data: Data to be displayed in the chart
         data: [
          { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
          { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
          { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
          { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
          { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
          { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
        ],
        // Series: Defines which chart type and data to use
        series: [{ type: 'bar', xKey: 'month', yKey: 'iceCreamSales' }],
        });
      return {
        options,
      };
    },
</script>
\`\`\`

3. Vue Chart Component

\`\`\`html
<template>
    <!-- The AG Charts component with chartsOptions as an attribute -->
    <ag-charts :options="options"> </ag-charts>
</template>
\`\`\`
`;

module.exports = {
    financialChartsReact,
    financialChartsAngular,
    financialChartsVue3,
    quickStartReact,
    quickStartAngular,
    quickStartVue3,
};
