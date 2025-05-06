import { useState } from 'react';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import './App.css';

function App() {
    const [options] = useState<AgCartesianChartOptions>({
        // Insert options.partial here.
    });

    return <AgCharts options={options} />;
}

export default App;
