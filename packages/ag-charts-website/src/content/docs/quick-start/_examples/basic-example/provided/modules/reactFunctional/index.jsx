import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { AgChartsReact } from 'ag-charts-react';

// Chart Component
const ChartExample = () => {
    // Chart Options: Control & configure the chart
    const [chartOptions, setChartOptions] = useState({
        // Data: Data to be displayed in the chart
        data: [
            { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162 },
            { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302 },
            { month: 'May', avgTemp: 16.2, iceCreamSales: 800 },
            { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254 },
            { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950 },
            { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200 },
        ],
        // Series: Defines which chart type and data to use
        series: [{ type: 'bar', xKey: 'month', yKey: 'iceCreamSales' }],
    });

    return (
        // AgCharsReact component with options passed as prop
        <AgChartsReact options={chartOptions} />
    );
};

// Render ChartExample
const root = createRoot(document.getElementById('root'));
root.render(<ChartExample />);
