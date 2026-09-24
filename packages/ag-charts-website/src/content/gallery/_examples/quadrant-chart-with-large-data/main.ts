import {
    AgCharts,
    AgQuadrantChartOptions,
    AgQuadrantRegion,
    ModuleRegistry,
    QuadrantChartModule,
} from 'ag-charts-enterprise';

import { type Account, getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

const segments: Record<AgQuadrantRegion, string> = {
    'top-left': 'Under-Using',
    'top-right': 'Expanding',
    'bottom-left': 'At Risk',
    'bottom-right': 'Under-Monetised',
};

// One chart-palette colour per segment.
const EXPANDING = '#459d55';
const UNDER_MONETISED = '#5090dc';
const UNDER_USING = '#ffa03a';
const AT_RISK = '#ef5452';

const options: AgQuadrantChartOptions<Account> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Customer Health',
    },
    subtitle: {
        text: '1,000 accounts by year-on-year change in usage and revenue',
    },
    theme: {
        params: {
            axisLineColor: { ref: 'foregroundColor', mix: 0.5, onto: 'backgroundColor' },
        },
    },
    xKey: 'usageChange',
    xName: 'Usage change',
    yKey: 'revenueChange',
    yName: 'Revenue change',
    size: 7,
    fillOpacity: 0.3,
    strokeWidth: 1,
    xAxis: {
        title: { text: 'Usage change' },
        gridLine: { enabled: false },
        tick: { enabled: true },
    },
    yAxis: {
        title: { text: 'Revenue change' },
        gridLine: { enabled: false },
        tick: { enabled: true },
    },
    pivot: { x: 0, y: 0 },
    regions: {
        label: { position: 'inside-inner-outer' },
        topLeft: {
            fillOpacity: 0,
            marker: { fill: UNDER_USING, stroke: UNDER_USING },
            label: {
                text: segments['top-left'],
                color: { ref: 'foregroundColor', mix: 0.45, ontoColor: UNDER_USING },
            },
        },
        topRight: {
            fillOpacity: 0,
            marker: { fill: EXPANDING, stroke: EXPANDING },
            label: {
                text: segments['top-right'],
                color: { ref: 'foregroundColor', mix: 0.25, ontoColor: EXPANDING },
            },
        },
        bottomLeft: {
            fillOpacity: 0,
            marker: { fill: AT_RISK, stroke: AT_RISK },
            label: {
                text: segments['bottom-left'],
                color: { ref: 'foregroundColor', mix: 0.25, ontoColor: AT_RISK },
            },
        },
        bottomRight: {
            fillOpacity: 0,
            marker: { fill: UNDER_MONETISED, stroke: UNDER_MONETISED },
            label: {
                text: segments['bottom-right'],
                color: { ref: 'foregroundColor', mix: 0.25, ontoColor: UNDER_MONETISED },
            },
        },
    },
    tooltip: {
        renderer: ({ datum, region }) => ({
            heading: datum.account,
            title: segments[region],
            data: [
                { label: 'Usage change', value: `${datum.usageChange}%` },
                { label: 'Revenue change', value: `${datum.revenueChange}%` },
            ],
        }),
    },
    formatter: {
        // A crosshair reads the raw value under the pointer, so round it to the precision the axis recommends.
        x: (params) => {
            if (params.type !== 'number') return;
            if (params.source === 'crosshair') return `${Number(params.value).toFixed(params.fractionDigits)}%`;
            return `${params.value}%`;
        },
        y: (params) => {
            if (params.type !== 'number') return;
            if (params.source === 'crosshair') return `${Number(params.value).toFixed(params.fractionDigits)}%`;
            return `${params.value}%`;
        },
    },
    highlight: {
        highlightedItem: {
            opacity: 1,
            fillOpacity: 1,
            strokeOpacity: 1,
            strokeWidth: 5,
        },
        unhighlightedItem: {
            opacity: 0.4,
        },
    },
};

AgCharts.createQuadrantChart(options);
