import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

function formatNumber(value: number) {
    value /= 1000;
    return `$${Math.floor(value)}K`;
}

const first: AgChartOptions = {
    container: document.getElementById('first'),
    data: [{ revenue: 326_270, targetRevenue: 250_000 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Tech',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350_000 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = formatNumber(datum[valueKey]);
                    const target = formatNumber(targetKey ? datum[targetKey] : NaN);
                    return {
                        title: valueName,
                        content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            label: { formatter: ({ value }) => formatNumber(value) },
        },
        {
            type: 'category',
            position: 'bottom',
        },
    ],
    width: 150,
};

AgCharts.create(first);

const second: AgChartOptions = {
    container: document.getElementById('second'),
    data: [{ revenue: 123_456, targetRevenue: 250_000 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Travel',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350_000 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = formatNumber(datum[valueKey]);
                    const target = formatNumber(targetKey ? datum[targetKey] : NaN);
                    return {
                        title: valueName,
                        content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            label: { formatter: ({ value }) => formatNumber(value) },
        },
        {
            type: 'category',
            position: 'bottom',
        },
    ],
    width: 150,
};

AgCharts.create(second);

const third: AgChartOptions = {
    container: document.getElementById('third'),
    data: [{ revenue: 225_000, targetRevenue: 250_000 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Energy',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350_000 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = formatNumber(datum[valueKey]);
                    const target = formatNumber(targetKey ? datum[targetKey] : NaN);
                    return {
                        title: valueName,
                        content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            label: { formatter: ({ value }) => formatNumber(value) },
        },
        {
            type: 'category',
            position: 'bottom',
        },
    ],
    width: 150,
};

AgCharts.create(third);

const fourth: AgChartOptions = {
    container: document.getElementById('fourth'),
    data: [{ revenue: 95_000, targetRevenue: 120_000 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Education',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350_000 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = formatNumber(datum[valueKey]);
                    const target = formatNumber(targetKey ? datum[targetKey] : NaN);
                    return {
                        title: valueName,
                        content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            label: { formatter: ({ value }) => formatNumber(value) },
        },
        {
            type: 'category',
            position: 'bottom',
        },
    ],
    width: 150,
};

AgCharts.create(fourth);

const fifth: AgChartOptions = {
    container: document.getElementById('fifth'),
    data: [{ revenue: 225_000, targetRevenue: 330_000 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Government',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350_000 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = formatNumber(datum[valueKey]);
                    const target = formatNumber(targetKey ? datum[targetKey] : NaN);
                    return {
                        title: valueName,
                        content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            label: { formatter: ({ value }) => formatNumber(value) },
        },
        {
            type: 'category',
            position: 'bottom',
        },
    ],
    width: 150,
};

AgCharts.create(fifth);
