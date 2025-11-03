'use client';

import { useState } from 'react';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { ModuleRegistry, AllCommunityModules } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

// Register modules before component initialization
ModuleRegistry.registerModules(AllCommunityModules);

export default function Home() {
    const [options] = useState<AgCartesianChartOptions>({
        // Insert options.partial here.
    });

    return <AgCharts options={options} />;
}
