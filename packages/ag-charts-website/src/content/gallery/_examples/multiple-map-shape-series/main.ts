import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCharts, AgTopologyChartOptions } from 'ag-charts-enterprise';
import { MapShapeBackgroundSeriesModule, MapShapeSeriesModule, ZoomModule } from 'ag-charts-enterprise';

import { africaData, asiaData, europeData, gdpData, northAmericaData, oceaniaData, southAmericaData } from './data';
import { topology } from './topology';

ModuleRegistry.registerModules([
    CategoryAxisModule,
    LegendModule,
    MapShapeBackgroundSeriesModule,
    MapShapeSeriesModule,
    NumberAxisModule,
    ZoomModule,
]);
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

const numberFormatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short', // Uses M, B, T instead of million, billion, trillion
    maximumFractionDigits: 1,
});

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
            fillOpacity: 0.85,
            strokeWidth: 0.5,
            tooltip: {
                renderer: ({ datum }: { datum: CountryData }) => {
                    const gdpPerCapita =
                        datum.gdp_md > 0 && datum.pop_est > 0
                            ? numberFormatter.format(Math.round((datum.gdp_md * 1000000) / datum.pop_est))
                            : 'N/A';

                    let heading = `${datum.iso3} - ${datum.name}`;
                    if (datum.name.length > 15) {
                        heading = `${datum.iso3}\n${datum.name}`;
                    }
                    return {
                        heading,
                        title: `Population ${numberFormatter.format(datum.pop_est)}`,
                        data: [
                            { label: 'GDP', value: `$${numberFormatter.format(datum.gdp_md)}` },
                            { label: 'per Capita', value: gdpPerCapita !== 'N/A' ? `$${gdpPerCapita}` : 'N/A' },
                        ],
                    };
                },
            },
        })),
    ],
    zoom: {
        enabled: true,
    },
    legend: {
        enabled: true,
        position: 'right',
        item: { marker: { shape: 'circle' } },
    },
};

AgCharts.create(options);
