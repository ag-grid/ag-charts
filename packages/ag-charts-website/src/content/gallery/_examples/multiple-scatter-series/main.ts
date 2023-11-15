import { AgChart, AgChartOptions, Marker } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Wealth And Happiness',
    },
    footnote: {
        text: 'Source: The World Happiness Report 2018',
    },
    series: Object.entries(getData()).map(([continent, data]) => ({
        data,
        type: 'scatter',
        xKey: 'gdpPerCapita',
        xName: 'GDP Per Capita',
        yKey: 'lifeSatisfaction',
        yName: continent,
        labelKey: 'country',
        labelName: 'Country',
        label: {},
        marker: {
            shape: starFactory(),
            size: 5,
        },
    })),
    axes: [
        {
            position: 'bottom',
            type: 'number',
            nice: false,
            label: {
                formatter: ({ value }) => `${value / 1000}K`,
            },
            title: {
                text: 'National Income',
            },
        },
        {
            position: 'left',
            type: 'number',
            nice: false,
            title: {
                text: 'Happiness',
            },
        },
    ],
    legend: {
        position: 'right',
        item: {
            marker: {
                size: 5,
            },
        },
    },
};

function starFactory() {
    class Star extends Marker {
        updatePath() {
            const { x, y, path, size } = this;
            const spikes = 5;
            const innerRadius = size / 2;
            const rotation = Math.PI / 2;

            path.clear();
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? size : innerRadius;
                const angle = (i * Math.PI) / spikes - rotation;
                const xCoordinate = x + Math.cos(angle) * radius;
                const yCoordinate = y + Math.sin(angle) * radius;
                path.lineTo(xCoordinate, yCoordinate);
            }
            path.closePath();
        }
    }
    return Star;
}

AgChart.create(options);
