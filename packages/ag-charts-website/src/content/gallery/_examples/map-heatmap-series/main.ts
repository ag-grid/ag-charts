import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCharts, AgTopologyChartOptions } from 'ag-charts-enterprise';
import { GradientLegendModule, MapShapeSeriesModule } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, MapShapeSeriesModule, NumberAxisModule]);
const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    useGrouping: true,
    maximumFractionDigits: 0,
});

const gdpFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
});

const options: AgTopologyChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'United States GDP by State',
    },
    subtitle: {
        text: '2023 Economic Output in USD',
    },
    data,
    topology,
    series: [
        {
            type: 'map-shape',
            idKey: 'name',
            colorKey: 'gdp',
            colorName: 'GDP',
            labelKey: 'code',
            labelName: 'State Code',
            label: {
                enabled: true,
                fontSize: 9,
            },
            tooltip: {
                renderer: (params) => {
                    const datum = params.datum as any;
                    const gdpValue = datum.gdp * 1000000; // Convert from millions
                    return {
                        heading: gdpFormatter.format(gdpValue),
                        title: `${datum.name} (${datum.code})`,
                        data: [
                            {
                                label: 'Share',
                                value: `${((datum.gdp / 28000000) * 100).toFixed(2)}%`,
                            },
                        ],
                    };
                },
            },
            highlight: {
                highlightedItem: {
                    strokeWidth: 3,
                    fillOpacity: 0.9,
                },
            },
        },
    ],
    gradientLegend: {
        enabled: true,
        position: 'bottom',
        gradient: {
            preferredLength: 400,
            thickness: 12,
        },
        scale: {
            label: {
                formatter: (params) => {
                    const value = params.value as number;
                    if (value >= 1000000) {
                        return `$${(value / 1000000).toFixed(1)}T`;
                    } else if (value >= 1000) {
                        return `$${Math.round(value / 1000)}B`;
                    } else {
                        return `$${Math.round(value)}M`;
                    }
                },
            },
        },
        spacing: 15,
    },
    formatter: {
        color: (params) => {
            const value = params.value as number;
            return params.source === 'tooltip'
                ? `${numberFormatter.format(value)} million`
                : `$${Math.floor(value / 1e6)}T`;
        },
    },
};

AgCharts.create(options);
