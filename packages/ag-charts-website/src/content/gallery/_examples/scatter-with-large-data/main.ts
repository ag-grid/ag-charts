import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { chromosomes, getData } from './data';

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
            min: -40,
            max: 50,
            interval: { values: [-40, -30, -20, -10, 10, 20, 30, 40, 50] },
            gridLine: {
                enabled: false,
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
                        padding: 75,
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
                        padding: 75,
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
    formatter: {
        y(params) {
            if (params.type !== 'number') return;
            let pq = params.value < 0 ? 'p' : 'q';
            return `${pq}${Math.abs(params.value).toFixed(params.fractionDigits)}`;
        },
    },
};
AgCharts.create(options);
