import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const greatBritain: AgChartOptions = {
    container: document.getElementById('greatBritain'),
    data: [{ 2020: 65, 2016: 67 }],
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: '2020',
            valueName: 'Great Britain',
            targetKey: '2016',
            targetName: '2016',
            scale: { max: 130 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>2020: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 65,
                    strokeOpacity: 0,
                    label: {
                        text: '65',
                        position: 'left',
                        color: 'white',
                    },
                },
                {
                    type: 'line',
                    value: 130,
                    strokeOpacity: 0,
                    label: {
                        text: '-3%',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            thickness: 80,
            line: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(greatBritain);

const unitedStates: AgChartOptions = {
    container: document.getElementById('unitedStates'),
    data: [{ 2020: 113, 2016: 121 }],
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: '2020',
            valueName: 'United States',
            targetKey: '2016',
            targetName: '2016',
            scale: { max: 130 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>2020: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 113,
                    strokeOpacity: 0,
                    label: {
                        text: '113',
                        position: 'left',
                        color: 'white',
                    },
                },
                {
                    type: 'line',
                    value: 130,
                    strokeOpacity: 0,
                    label: {
                        text: '-7%',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            thickness: 80,
            line: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(unitedStates);

const china: AgChartOptions = {
    container: document.getElementById('china'),
    data: [{ 2020: 88, 2016: 70 }],
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: '2020',
            valueName: 'China',
            targetKey: '2016',
            targetName: '2016',
            scale: { max: 130 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>2020: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 88,
                    strokeOpacity: 0,
                    label: {
                        text: '88',
                        position: 'left',
                        color: 'white',
                    },
                },
                {
                    type: 'line',
                    value: 130,
                    strokeOpacity: 0,
                    label: {
                        text: '+25%',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            thickness: 80,
            line: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(china);

const russia: AgChartOptions = {
    container: document.getElementById('russia'),
    data: [{ 2020: 71, 2016: 56 }],
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: '2020',
            valueName: 'Russia',
            targetKey: '2016',
            targetName: '2016',
            scale: { max: 130 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>2020: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 71,
                    strokeOpacity: 0,
                    label: {
                        text: '71',
                        position: 'left',
                        color: 'white',
                    },
                },
                {
                    type: 'line',
                    value: 130,
                    strokeOpacity: 0,
                    label: {
                        text: '+27%',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            thickness: 80,
            line: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(russia);

const germany: AgChartOptions = {
    container: document.getElementById('germany'),
    data: [{ 2020: 92, 2016: 42 }],
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: '2020',
            valueName: 'Germany',
            targetKey: '2016',
            targetName: '2016',
            scale: { max: 130 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>2020: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 92,
                    strokeOpacity: 0,
                    label: {
                        text: '65',
                        position: 'left',
                        color: 'white',
                    },
                },
                {
                    type: 'line',
                    value: 130,
                    strokeOpacity: 0,
                    label: {
                        text: '+119%',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            thickness: 80,
            line: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(germany);

const france: AgChartOptions = {
    container: document.getElementById('france'),
    data: [{ 2020: 33, 2016: 42 }],
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: '2020',
            valueName: 'France',
            targetKey: '2016',
            targetName: '2016',
            scale: { max: 130 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>2020: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 33,
                    strokeOpacity: 0,
                    label: {
                        text: '33',
                        position: 'left',
                        color: 'white',
                    },
                },
                {
                    type: 'line',
                    value: 130,
                    strokeOpacity: 0,
                    label: {
                        text: '-20%',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            thickness: 80,
            line: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(france);

const japan: AgChartOptions = {
    container: document.getElementById('japan'),
    data: [{ 2020: 91, 2016: 94 }],
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: '2020',
            valueName: 'Japan',
            targetKey: '2016',
            targetName: '2016',
            scale: { max: 130 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>2020: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 91,
                    strokeOpacity: 0,
                    label: {
                        text: '91',
                        position: 'left',
                        color: 'white',
                    },
                },
                {
                    type: 'line',
                    value: 130,
                    strokeOpacity: 0,
                    label: {
                        text: '-3%',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            thickness: 80,
            line: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(japan);
const australia: AgChartOptions = {
    container: document.getElementById('australia'),
    data: [{ 2020: 76, 2016: 62 }],
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: '2020',
            valueName: 'Australia',
            targetKey: '2016',
            targetName: '2016',
            scale: { max: 130 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName, targetKey, targetName }) => {
                    const value = datum[valueKey];
                    const target = targetKey ? datum[targetKey] : NaN;
                    return {
                        title: valueName,
                        content: `<b>2020: </b>${value}<br/><b>${targetName}: </b>${target}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 76,
                    strokeOpacity: 0,
                    label: {
                        text: '76',
                        position: 'left',
                        color: 'white',
                    },
                },
                {
                    type: 'line',
                    value: 130,
                    strokeOpacity: 0,
                    label: {
                        text: '+23%',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            thickness: 80,
            line: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(australia);
