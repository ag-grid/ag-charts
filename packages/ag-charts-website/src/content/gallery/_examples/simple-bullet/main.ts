import { AgCharts, AgGaugeOptions } from 'ag-charts-enterprise';

const first: AgGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('first'),
    title: {
        text: 'Tech',
    },
    value: 236,
    cornerRadius: 100,
    padding: {
        left: 0,
    },
    scale: {
        min: 0,
        max: 250,
    },
    bar: {
        fillMode: 'discrete',
        thickness: 20,
    },
    segmentation: {
        enabled: true,
    },
    targets: [
        { value: 220, shape: 'line', placement: 'middle', rotation: 90, size: 40, stroke: 'gray', strokeWidth: 2 },
    ],
    thickness: 30,
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
        text: 'Energy',
    },
    value: 225,
    cornerRadius: 100,
    scale: {
        min: 0,
        max: 250,
    },
    bar: {
        fillMode: 'discrete',
        thickness: 20,
    },
    segmentation: {
        enabled: true,
    },
    targets: [
        { value: 220, shape: 'line', placement: 'middle', rotation: 90, size: 40, stroke: 'gray', strokeWidth: 2 },
    ],
    thickness: 30,
    width: 150,
    tooltip: {
        enabled: true,
        renderer: ({ value }) => ({
            title: 'Energy',
            content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>Target: </b>${250}`,
        }),
    },
};

AgCharts.createGauge(second);

const third: AgGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('third'),
    title: {
        text: 'Government',
    },
    value: 205,
    cornerRadius: 100,
    scale: {
        min: 0,
        max: 250,
    },
    bar: {
        fillMode: 'discrete',
        thickness: 20,
    },
    segmentation: {
        enabled: true,
    },
    targets: [
        { value: 215, shape: 'line', placement: 'middle', rotation: 90, size: 40, stroke: 'gray', strokeWidth: 2 },
    ],
    thickness: 30,
    width: 150,
    tooltip: {
        enabled: true,
        renderer: ({ value }) => ({
            title: 'Government',
            content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>Target: </b>${330}`,
        }),
    },
};

AgCharts.createGauge(third);

const fourth: AgGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('fourth'),
    title: {
        text: 'Travel',
    },
    value: 123,
    cornerRadius: 100,
    scale: {
        min: 0,
        max: 250,
    },
    bar: {
        fillMode: 'discrete',
        thickness: 20,
    },
    segmentation: {
        enabled: true,
    },
    targets: [
        { value: 220, shape: 'line', placement: 'middle', rotation: 90, size: 40, stroke: 'gray', strokeWidth: 2 },
    ],
    thickness: 30,
    width: 150,
    tooltip: {
        enabled: true,
        renderer: ({ value }) => ({
            title: 'Travel',
            content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>Target: </b>${250}`,
        }),
    },
};

AgCharts.createGauge(fourth);

const fifth: AgGaugeOptions = {
    type: 'linear-gauge',
    container: document.getElementById('fifth'),
    title: {
        text: 'Education',
    },
    value: 95,
    cornerRadius: 100,
    scale: {
        min: 0,
        max: 250,
    },
    bar: {
        fillMode: 'discrete',
        thickness: 20,
    },
    segmentation: {
        enabled: true,
    },
    targets: [
        { value: 120, shape: 'line', placement: 'middle', rotation: 90, size: 40, stroke: 'gray', strokeWidth: 2 },
    ],
    thickness: 30,
    width: 150,
    tooltip: {
        enabled: true,
        renderer: ({ value }) => ({
            title: 'Education',
            content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>Target: </b>${120}`,
        }),
    },
};

AgCharts.createGauge(fifth);
