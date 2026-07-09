import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';

import { type AgChartOptions, AllCommunityModule, ModuleRegistry } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { getData } from './data';

ModuleRegistry.registerModules([AllCommunityModule]);

export const StarterExample = () => {
    const options = useMemo<AgChartOptions>(
        () => ({
            title: { text: 'Monthly revenue' },
            data: getData(),
            series: [{ type: 'bar', xKey: 'month', yKey: 'revenue', yName: 'Revenue' }],
        }),
        []
    );

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    Starter demo
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    A minimal AG Charts React chart rendered inside a Material UI shell.
                </Typography>
                <AgCharts options={options} style={{ height: 400 }} />
            </Paper>
        </Box>
    );
};
