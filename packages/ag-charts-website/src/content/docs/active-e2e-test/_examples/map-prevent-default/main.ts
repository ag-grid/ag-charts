// @ag-skip-fws
import {
    AgActiveChangeEvent,
    AgCharts,
    AgTopologyChartOptions,
    AllEnterpriseModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import {
    EEASingleMarketStates,
    EUCandidateCountries,
    EUEurozoneMembers,
    EUNonEurozoneMembers,
    EuroUsingMicrostates,
    FormerEUMembers,
    OtherEuropeanStates,
} from './data';
import { topology } from './topology';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgTopologyChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'European Union & Associated States',
    },
    topology,
    series: [
        {
            type: 'map-shape-background',
            topology,
            fill: '#f5f5f5',
            stroke: '#cccccc',
        },
        {
            type: 'map-shape',
            topology,
            data: EUEurozoneMembers,
            title: 'EU Member (Eurozone)',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            labelKey: 'iso2',
            labelName: 'Country Code',
            fill: '#0b3d91', // navy
            stroke: '#ffffff',
            strokeWidth: 0.8,
            fillOpacity: 0.95,
        },
        {
            type: 'map-shape',
            topology,
            data: EUNonEurozoneMembers,
            title: 'EU Member (Non-Eurozone)',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            labelKey: 'iso2',
            labelName: 'Country Code',
            fill: '#4f81d4', // lighter EU blue
            stroke: '#ffffff',
            strokeWidth: 0.8,
            fillOpacity: 0.95,
        },
        {
            type: 'map-shape',
            topology,
            data: FormerEUMembers,
            title: 'Former EU Member',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            labelKey: 'iso2',
            labelName: 'Country Code',
            fill: '#d7263d', // strong red
            stroke: '#ffffff',
            strokeWidth: 0.8,
            fillOpacity: 0.95,
        },
        {
            type: 'map-shape',
            topology,
            data: EUCandidateCountries,
            title: 'EU Candidate Country',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            labelKey: 'iso2',
            labelName: 'Country Code',
            fill: '#f4a261', // warm orange
            stroke: '#ffffff',
            strokeWidth: 0.8,
            fillOpacity: 0.95,
        },
        {
            type: 'map-shape',
            topology,
            data: EEASingleMarketStates,
            title: 'EEA / Single Market State',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            labelKey: 'iso2',
            labelName: 'Country Code',
            fill: '#2a9d8f', // teal-green
            stroke: '#ffffff',
            strokeWidth: 0.8,
            fillOpacity: 0.95,
        },
        {
            type: 'map-shape',
            topology,
            data: EuroUsingMicrostates,
            title: 'Euro-Using Microstate',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            labelKey: 'iso2',
            labelName: 'Country Code',
            fill: '#9b5de5', // vivid purple
            stroke: '#ffffff',
            strokeWidth: 0.8,
            fillOpacity: 0.95,
        },
        {
            type: 'map-shape',
            topology,
            data: OtherEuropeanStates,
            title: 'Other European State',
            idKey: 'name',
            topologyIdKey: 'NAME_ENGL',
            labelKey: 'iso2',
            labelName: 'Country Code',
            fill: '#6c757d', // neutral grey
            stroke: '#ffffff',
            strokeWidth: 0.8,
            fillOpacity: 0.9,
        },
    ],
    zoom: {
        enabled: true,
        buttons: { enabled: false },
    },
    legend: {
        enabled: true,
        position: 'right',
        item: {
            marker: {
                shape: 'circle',
            },
        },
    },
    listeners: {
        activeChange: (ev: AgActiveChangeEvent<unknown, unknown>) => {
            if (shouldPreventDefault) {
                ev.preventDefault();
            }
        },
    },
};

AgCharts.create(options);

let shouldPreventDefault = true;

function onPreventDefaultChange(value: boolean) {
    shouldPreventDefault = value;
}

window.addEventListener('mousemove', (ev: MouseEvent) => {
    document.getElementById('myPointerPos').textContent = `clientX: ${ev.clientX}; clientY: ${ev.clientY}`;
});
