import { AgChartOptions, AgCharts, AgMarkerShapeFnParams } from 'ag-charts-community';

import { getData } from './data';

const rad = (degree: number) => {
    return (degree / 180) * Math.PI;
};

const heart = ({ x, y, path, size }: AgMarkerShapeFnParams) => {
    const r = size / 4;
    const yCoord = y + r / 2;

    path.clear();
    path.arc(x - r, yCoord - r, r, rad(130), rad(330));
    path.arc(x + r, yCoord - r, r, rad(220), rad(50));
    path.lineTo(x, yCoord + r);
    path.closePath();
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Fuel Spending (2019)',
    },
    data: getData(),
    series: [
        {
            xKey: 'quarter',
            yKey: 'electric',
            title: 'Electric',
            marker: {
                shape: heart,
                size: 16,
            },
        },
    ],
};

AgCharts.create(options);
