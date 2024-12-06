'use client';

import { useState } from 'react';

import { AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

export default function Home() {
    const [options] = useState<AgCartesianChartOptions>({
        // Insert options.partial here.
    });

    return <AgCharts options={options} />;
}
