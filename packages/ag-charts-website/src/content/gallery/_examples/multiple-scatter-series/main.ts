import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { chromosomes, getData } from './data';

const tooltip = {
    renderer: ({ datum, xKey, yKey, xName }: AgCartesianSeriesTooltipRendererParams) => {
        const region = `${datum[yKey] < 0 ? 'p' : 'q'}${Math.abs(datum[yKey])}`;
        return {
            title: `${xName} ${datum[xKey]}`,
            content: `Region: ${region}`,
        };
    },
};
const data = getData();
const options: AgChartOptions = {
    title: {
        text: 'Cytogenetic Map',
    },
    subtitle: {
        text: `Bird's eye view of the 23 pairs of chromosomes in Homo Sapien (human) DNA.`,
    },
    container: document.getElementById('myChart'),
    series: chromosomes.map((chromosome) => ({
        data: data.filter((d) => d.chromosome === chromosome),
        type: 'scatter',
        xKey: 'chromosome',
        xName: 'Chromosome',
        yKey: 'region',
        yName: `C${chromosome}`,
        tooltip,
    })),
    seriesArea: {
        padding: {
            left: 20,
        },
    },
    axes: [
        {
            position: 'left',
            type: 'number',
            nice: false,
            max: 50,
            tick: {
                size: 0,
                values: [-40, -30, -20, -10, 10, 20, 30, 40, 50],
            },
            gridLine: {
                enabled: false,
            },
            label: {
                formatter: ({ value }) => `${value < 0 ? 'p' : 'q'}${Math.abs(value)}`,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 0,
                    lineDash: [5, 6],
                    label: {
                        text: 'Centromere',
                        position: 'left',
                    },
                },
                {
                    type: 'range',
                    range: [0, 50],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: 'Long Arm',
                        position: 'left',
                        rotation: -90,
                        padding: 65,
                    },
                },
                {
                    type: 'range',
                    range: [0, -40],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: 'Short Arm',
                        position: 'left',
                        rotation: -90,
                        padding: 65,
                    },
                },
            ],
        },
        {
            position: 'bottom',
            type: 'category',
            title: {
                text: 'Chromosome',
            },
        },
    ],
};
AgEnterpriseCharts.create(options);
