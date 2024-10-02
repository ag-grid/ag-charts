import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const first: AgGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('first'),
    title: {
        text: 'Tech',
    },
    value: 326,
    scale: {
        min: 0,
        max: 350,
        fills: [{ color: '#8898', stop: 200 }, { color: '#AAB8', stop: 300 }, { color: '#CCD8' }],
        fillMode: 'discrete',
    },
    bar: {
        fill: '#334E',
        thickness: 30,
    },
    targets: [
        { value: 250, shape: 'line', placement: 'middle', rotation: 90, size: 40, stroke: '#112E', strokeWidth: 2 },
    ],
    thickness: 50,
    width: 150,
    tooltip: {
        enabled: true,
        renderer: ({ value }) => ({
            title: 'Tech',
            content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>Target: </b>${250}`,
        }),
    },
};

AgCharts.createGauge(first);

const second: AgGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('second'),
    title: {
        text: 'Travel',
    },
    value: 123,
    scale: {
        min: 0,
        max: 350,
        fills: [{ color: '#8898', stop: 200 }, { color: '#AAB8', stop: 300 }, { color: '#CCD8' }],
        fillMode: 'discrete',
    },
    bar: {
        fill: '#334E',
        thickness: 30,
    },
    targets: [
        { value: 250, shape: 'line', placement: 'middle', rotation: 90, size: 40, stroke: '#112E', strokeWidth: 2 },
    ],
    thickness: 50,
    width: 150,
    tooltip: {
        enabled: true,
        renderer: ({ value }) => ({
            title: 'Travel',
            content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>Target: </b>${250}`,
        }),
    },
};

AgCharts.createGauge(second);

const third: AgGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('third'),
    title: {
        text: 'Energy',
    },
    value: 225,
    scale: {
        min: 0,
        max: 350,
        fills: [{ color: '#8898', stop: 200 }, { color: '#AAB8', stop: 300 }, { color: '#CCD8' }],
        fillMode: 'discrete',
    },
    bar: {
        fill: '#334E',
        thickness: 30,
    },
    targets: [
        { value: 250, shape: 'line', placement: 'middle', rotation: 90, size: 40, stroke: '#112E', strokeWidth: 2 },
    ],
    thickness: 50,
    width: 150,
    tooltip: {
        enabled: true,
        renderer: ({ value }) => ({
            title: 'Energy',
            content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>Target: </b>${250}`,
        }),
    },
};

AgCharts.createGauge(third);

const fourth: AgGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('fourth'),
    title: {
        text: 'Education',
    },
    value: 95,
    scale: {
        min: 0,
        max: 350,
        fills: [{ color: '#8898', stop: 200 }, { color: '#AAB8', stop: 300 }, { color: '#CCD8' }],
        fillMode: 'discrete',
    },
    bar: {
        fill: '#334E',
        thickness: 30,
    },
    targets: [
        { value: 120, shape: 'line', placement: 'middle', rotation: 90, size: 40, stroke: '#112E', strokeWidth: 2 },
    ],
    thickness: 50,
    width: 150,
    tooltip: {
        enabled: true,
        renderer: ({ value }) => ({
            title: 'Education',
            content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>Target: </b>${120}`,
        }),
    },
};

AgCharts.createGauge(fourth);

const fifth: AgGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('fifth'),
    title: {
        text: 'Government',
    },
    value: 225,
    scale: {
        min: 0,
        max: 350,
        fills: [{ color: '#8898', stop: 200 }, { color: '#AAB8', stop: 300 }, { color: '#CCD8' }],
        fillMode: 'discrete',
    },
    bar: {
        fill: '#334E',
        thickness: 30,
    },
    targets: [
        { value: 330, shape: 'line', placement: 'middle', rotation: 90, size: 40, stroke: '#112E', strokeWidth: 2 },
    ],
    thickness: 50,
    width: 150,
    tooltip: {
        enabled: true,
        renderer: ({ value }) => ({
            title: 'Government',
            content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>Target: </b>${330}`,
        }),
    },
};

AgCharts.createGauge(fifth);
