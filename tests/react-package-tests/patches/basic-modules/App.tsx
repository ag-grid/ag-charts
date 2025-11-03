import { useState } from 'react';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { ModuleRegistry, AllCommunityModules } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import './App.css';

// Register modules before component initialization
ModuleRegistry.registerModules(AllCommunityModules);

function App() {
    const [options] = useState<AgCartesianChartOptions>({
        // Insert options.partial here.
    });

    return <AgCharts options={options} />;
}

export default App;
