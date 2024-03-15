import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { africaData, asiaData, europeData, gdpData, northAmericaData, oceaniaData, southAmericaData } from './data';
import {
    africaTopology,
    asiaTopology,
    europeTopology,
    northAmericaTopology,
    oceaniaTopology,
    southAmericaTopology,
} from './topology';

const labelOptions = {
    labelKey: 'iso2',
    labelName: 'Country Code',
    label: {
        fontWeight: 'lighter' as const,
    },
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    subtitle: {
        text: 'World Population and Largest Economies',
    },
    series: [
        {
            type: 'map-shape',
            topology: europeTopology,
            data: europeData,
            title: 'Europe',
            idKey: 'name',
            ...labelOptions,
        },
        {
            type: 'map-shape',
            topology: asiaTopology,
            data: asiaData,
            title: 'Asia',
            idKey: 'name',
            ...labelOptions,
        },
        {
            type: 'map-shape',
            topology: africaTopology,
            data: africaData,
            title: 'Africa',
            idKey: 'name',
            ...labelOptions,
        },
        {
            type: 'map-shape',
            topology: northAmericaTopology,
            data: northAmericaData,
            title: 'North America',
            idKey: 'name',
            ...labelOptions,
        },
        {
            type: 'map-shape',
            topology: southAmericaTopology,
            data: southAmericaData,
            title: 'South America',
            idKey: 'name',
            ...labelOptions,
        },
        {
            type: 'map-shape',
            topology: oceaniaTopology,
            data: oceaniaData,
            title: 'Oceania',
            idKey: 'name',
            ...labelOptions,
        },
        {
            type: 'map-marker',
            topology: {
                type: 'FeatureCollection',
                features: [
                    ...europeTopology.features,
                    ...asiaTopology.features,
                    ...africaTopology.features,
                    ...northAmericaTopology.features,
                    ...southAmericaTopology.features,
                    ...oceaniaTopology.features,
                ],
            },
            data: [...europeData, ...asiaData, ...africaData, ...northAmericaData, ...southAmericaData, ...oceaniaData],
            title: 'Population',
            idKey: 'name',
            idName: 'Country',
            sizeKey: 'pop_est',
            sizeName: 'Population Estimate',
            size: 5,
            maxSize: 60,
        },
        {
            type: 'map-line',
            topology: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [-97.0, 38.0],
                                [105.0, 35.0],
                                [138.0, 36.0],
                                [9.0, 51.0],
                                [77.0, 20.0],
                                [-2.0, 54.0],
                                [2.0, 46.0],
                                [12.8333, 42.8333],
                                [-55.0, -10.0],
                                [-95.0, 60.0],
                                [-97.0, 38.0],
                            ],
                        },
                        properties: { name: 'largest_economies' },
                    },
                ],
            },
            data: [{ name: 'largest_economies' }],
            idKey: 'name',
            showInLegend: false,
        },
        {
            type: 'map-marker',
            data: gdpData,
            title: 'Countries With Largest Economies',
            latitudeKey: 'lat',
            longitudeKey: 'lon',
            shape: 'pin',
            fillOpacity: 1,
            fill: '#EA4335',
            stroke: '#960A0A',
            size: 7,
            maxSize: 25,
            idKey: 'gdp_usd_billion',
            idName: 'GDP (USD Billion)',
            sizeKey: 'gdp_per_capita_usd_thousand',
            sizeName: 'GDP Per Capita (USD thousand)',
            legendItemName: 'Largest Economies',
        },
    ],
    legend: {
        enabled: true,
        item: {
            marker: {
                shape: 'circle',
            },
        },
    },
};

AgCharts.create(options);
