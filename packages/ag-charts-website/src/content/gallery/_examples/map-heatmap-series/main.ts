import { AgCharts, AgTopologyChartOptions } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

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
    // FIXME: Reinstate series labels.
    container: document.getElementById('myChart'),
    title: {
        text: 'United States GDP by State',
    },
    subtitle: {
        text: '2023 Economic Output in USD',
        spacing: 8,
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
            },
            tooltip: {
                renderer: (params) => {
                    const datum = params.datum as any;
                    const gdpValue = datum.gdp * 1000000; // Convert from millions
                    return {
                        heading: datum.name,
                        title: 'Economic Data',
                        data: [
                            {
                                label: 'State Code',
                                value: datum.code,
                            },
                            {
                                label: 'GDP',
                                value: gdpFormatter.format(gdpValue),
                            },
                            {
                                label: 'Share of US Economy',
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
