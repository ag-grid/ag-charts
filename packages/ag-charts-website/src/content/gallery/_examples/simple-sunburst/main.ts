import { ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts, SunburstSeriesModule } from 'ag-charts-enterprise';

import { data } from './data';

// Calculate total capacity for each country for better context

ModuleRegistry.registerModules([SunburstSeriesModule]);
const dataWithTotals = data.map((country) => ({
    ...country,
    totalCapacity: country.children?.reduce((sum, farm) => sum + (farm.capacity || 0), 0) || 0,
}));

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: dataWithTotals,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            sizeKey: 'capacity',
            sizeName: 'Capacity',
            secondaryLabelKey: 'capacity',
            label: {
                minimumFontSize: 8,
            },
            secondaryLabel: {
                minimumFontSize: 6,
                formatter: ({ value }) => {
                    if (value == null) return undefined;
                    // Format large numbers with appropriate units
                    if (value >= 1000) {
                        return `${(value / 1000).toFixed(1)} GW`;
                    }
                    return `${value.toFixed(0)} MW`;
                },
            },
            tooltip: {
                renderer: (params) => {
                    const { datum } = params;
                    const capacity = datum.capacity;
                    const parent = datum.parent;

                    // Calculate country's total capacity if this is a wind farm
                    let countryTotal = 0;
                    let countryName = '';

                    if (parent && parent.children) {
                        // This is a wind farm node
                        countryTotal = parent.children.reduce(
                            (sum: number, child: any) => sum + (child.capacity || 0),
                            0
                        );
                        countryName = parent.name;
                    } else if (datum.children) {
                        // This is a country node
                        countryTotal = datum.totalCapacity || 0;
                        countryName = datum.name;
                    }

                    const dataItems: { label: string; value: string }[] = [];

                    // Add capacity info
                    if (capacity != null) {
                        dataItems.push({
                            label: 'Capacity',
                            value: capacity >= 1000 ? `${(capacity / 1000).toFixed(2)} GW` : `${capacity} MW`,
                        });
                    }

                    // Add share info for wind farms
                    if (parent && countryTotal > 0 && capacity != null) {
                        dataItems.push({
                            label: 'Share of ' + countryName,
                            value: `${((capacity / countryTotal) * 100).toFixed(1)}%`,
                        });
                    }

                    // Add total info for countries
                    if (datum.children && countryTotal > 0) {
                        dataItems.push({
                            label: 'Total Capacity',
                            value:
                                countryTotal >= 1000 ? `${(countryTotal / 1000).toFixed(2)} GW` : `${countryTotal} MW`,
                        });
                        dataItems.push({
                            label: 'Number of Farms',
                            value: datum.children.length.toString(),
                        });
                    }

                    return {
                        title: datum.name,
                        data: dataItems,
                    };
                },
            },
        },
    ],
    title: {
        text: 'Global Offshore Wind Capacity Leaders',
    },
    subtitle: {
        text: 'Major wind farms (≥500 MW) grouped by country – segment sizes reflect generation capacity',
    },
};

AgCharts.create(options);
