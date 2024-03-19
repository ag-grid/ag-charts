import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { africaData, asiaData, europeData, gdpData, northAmericaData, oceaniaData, southAmericaData } from './data';
import { topology } from './topology';

const labelOptions = {
    labelKey: 'iso2',
    labelName: 'Country Code',
    label: {
        fontWeight: 'lighter' as const,
    },
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'World Map',
    },
    topology,
    series: [
        {
            type: 'map-shape-background',
            topology,
        },
        {
            type: 'map-shape',
            topology,
            data: europeData,
            title: 'Europe',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            ...labelOptions,
        },
        {
            type: 'map-shape',
            topology,
            data: asiaData,
            title: 'Asia',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            ...labelOptions,
        },
        {
            type: 'map-shape',
            topology,
            data: africaData,
            title: 'Africa',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            ...labelOptions,
        },
        {
            type: 'map-shape',
            topology,
            data: northAmericaData,
            title: 'North America',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            ...labelOptions,
        },
        {
            type: 'map-shape',
            topology,
            data: southAmericaData,
            title: 'South America',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            ...labelOptions,
        },
        {
            type: 'map-shape',
            topology,
            data: oceaniaData,
            title: 'Oceania',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            ...labelOptions,
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
