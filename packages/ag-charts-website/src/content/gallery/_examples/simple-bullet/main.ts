import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const first: AgChartOptions = {
    container: document.getElementById('first'),
    data: [{ revenue: 326, targetRevenue: 250 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Tech',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    width: 150,
};

AgCharts.create(first);

const second: AgChartOptions = {
    container: document.getElementById('second'),
    data: [{ revenue: 123, targetRevenue: 250 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Travel',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    width: 150,
};

AgCharts.create(second);

const third: AgChartOptions = {
    container: document.getElementById('third'),
    data: [{ revenue: 225, targetRevenue: 250 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Energy',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    width: 150,
};

AgCharts.create(third);

const fourth: AgChartOptions = {
    container: document.getElementById('fourth'),
    data: [{ revenue: 95, targetRevenue: 120 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Education',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    width: 150,
};

AgCharts.create(fourth);

const fifth: AgChartOptions = {
    container: document.getElementById('fifth'),
    data: [{ revenue: 225, targetRevenue: 330 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'revenue',
            valueName: 'Government',
            targetKey: 'targetRevenue',
            targetName: 'Target',
            scale: { max: 350 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>Revenue 2020 YTD: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    width: 150,
};

AgCharts.create(fifth);
