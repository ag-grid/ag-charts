import { AgCharts, AgTopologyChartOptions } from 'ag-charts-enterprise';

import { africaData, asiaData, europeData, gdpData, northAmericaData, oceaniaData, southAmericaData } from './data';
import { topology } from './topology';

interface CountryData {
    pop_est: number;
    pop_rank: number;
    gdp_md: number;
    iso2: string;
    iso3: string;
    name: string;
}

const datasets = {
    europe: europeData,
    asia: asiaData,
    africa: africaData,
    northAmerica: northAmericaData,
    southAmerica: southAmericaData,
    oceania: oceaniaData,
};

function convertLowerCamelCaseToTitleCase(str: string) {
    return [...str].reduce((acc, char, index) => {
        if (index === 0) {
            return char.toLocaleUpperCase();
        }
        if (char === char.toLocaleUpperCase()) {
            return acc + ' ' + char;
        }
        return acc + char;
    }, '');
}

const options: AgTopologyChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'World Map',
    },
    subtitle: {
        text: 'Hover over countries to see detailed economic data',
    },
    topology,
    series: [
        {
            type: 'map-shape-background',
            topology,
        },
        ...Object.entries(datasets).map(([key, data]) => ({
            type: 'map-shape' as const,
            topology,
            data,
            title: convertLowerCamelCaseToTitleCase(key),
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            labelKey: 'iso2',
            labelName: 'Country Code',
            label: {},
            // colorKey: 'gdp_md',
            // colorName: 'GDP (Million USD)',
            fillOpacity: 0.85,
            strokeWidth: 0.5,
            highlight: {
                highlightedItem: {
                    fillOpacity: 1,
                    strokeWidth: 2,
                },
            },
            tooltip: {
                renderer: ({ datum }: { datum: CountryData }) => {
                    const gdpPerCapita =
                        datum.gdp_md > 0 && datum.pop_est > 0
                            ? Math.round((datum.gdp_md * 1000000) / datum.pop_est).toLocaleString()
                            : 'N/A';

                    return {
                        // title: datum.name,
                        data: [
                            { label: 'Population', value: datum.pop_est.toLocaleString() },
                            { label: 'GDP', value: `$${datum.gdp_md.toLocaleString()}M` },
                            { label: 'GDP per Capita', value: gdpPerCapita !== 'N/A' ? `$${gdpPerCapita}` : 'N/A' },
                            { label: 'ISO Code', value: datum.iso3 },
                        ],
                    };
                },
            },
        })),
    ],
    zoom: {
        enabled: true,
        buttons: {
            visible: 'zoomed',
        },
    },
    legend: {
        enabled: true,
        position: 'right',
        spacing: 40,
    },
    animation: {
        enabled: true,
    },
};

AgCharts.create(options);
