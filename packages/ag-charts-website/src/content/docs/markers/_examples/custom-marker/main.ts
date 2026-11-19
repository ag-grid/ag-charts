import { AgCartesianChartOptions, AgCharts, AgMarkerShapeFnParams } from 'ag-charts-community';
import { BubbleSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, NumberAxisModule]);

const smiley = ({ x, y, path, size }: AgMarkerShapeFnParams) => {
    const r = size / 2;
    const eyeR = r * 0.15;
    const eyeY = y - r * 0.25;
    const mouthR = r * 0.5;
    const mouthY = y + r * 0.1;

    path.clear();
    // Face, drawn clockwise
    path.moveTo(x + r, y);
    path.arc(x, y, r, 0, 2 * Math.PI);
    path.closePath();
    // Eyes and mouth, drawn anticlockwise so they are cut out of the face
    for (const eyeX of [x - r * 0.35, x + r * 0.35]) {
        path.moveTo(eyeX + eyeR, eyeY);
        path.arc(eyeX, eyeY, eyeR, 0, 2 * Math.PI, true);
        path.closePath();
    }
    path.moveTo(x - mouthR, mouthY);
    path.arc(x, mouthY, mouthR, Math.PI, 0, true);
    path.closePath();
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Customer Support Performance (2025)',
    },
    subtitle: {
        text: 'Monthly Satisfaction vs First Response Time, Sized by Tickets',
    },
    data: getData(),
    series: [
        {
            type: 'bubble',
            xKey: 'responseTime',
            xName: 'First Response Time',
            yKey: 'satisfaction',
            yName: 'Satisfaction',
            sizeKey: 'tickets',
            sizeName: 'Tickets',
            labelKey: 'month',
            labelName: 'Month',
            shape: smiley,
            minSize: 20,
            maxSize: 40,
        },
    ],
    axes: {
        x: {
            type: 'number',
            title: {
                text: 'Median First Response Time',
            },
            label: {
                formatter: ({ value }) => `${value}h`,
            },
        },
        y: {
            type: 'number',
            title: {
                text: 'Customer Satisfaction',
            },
            label: {
                formatter: ({ value }) => `${value}%`,
            },
        },
    },
};

AgCharts.create(options);
