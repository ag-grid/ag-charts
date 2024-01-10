import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const questionOneDisagree: AgChartOptions = {
    container: document.getElementById('questionOneDisagree'),
    data: [{ disagree: 10.1 }],
    padding: {
        left: 0,
        right: 0,
    },
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'disagree',
            valueName: 'Question 1',
            scale: { max: 110 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName }) => {
                    const value = datum[valueKey];
                    return {
                        title: valueName,
                        content: `<b>Disagree: </b>${value}%`,
                    };
                },
            },
            colorRanges: [
                {
                    color: 'rgba(224,234,241, 0.5)',
                    stop: 10.1,
                },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            reverse: true,
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 10.1,
                    strokeOpacity: 0,
                    label: {
                        text: '10.1% \n-6.1▼',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'right',
            label: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(questionOneDisagree);

const questionOneAgree: AgChartOptions = {
    container: document.getElementById('questionOneAgree'),
    data: [{ agree: 89.9 }],
    padding: {
        left: 0,
        right: 0,
    },
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'agree',
            valueName: 'Question 1',
            scale: { max: 110 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName }) => {
                    const value = datum[valueKey];
                    return {
                        title: valueName,
                        content: `<b>Agree: </b>${value}%`,
                    };
                },
            },
            colorRanges: [
                {
                    color: 'rgba(224,234,241, 0.5)',
                    stop: 89.9,
                },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 89.9,
                    strokeOpacity: 0,
                    label: {
                        text: '89.9% \n-2.4▲',
                        position: 'right',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            label: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(questionOneAgree);

const questionTwoDisagree: AgChartOptions = {
    container: document.getElementById('questionTwoDisagree'),
    data: [{ disagree: 34.7 }],
    padding: {
        left: 0,
        right: 0,
    },
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'disagree',
            valueName: 'Question 1',
            scale: { max: 110 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName }) => {
                    const value = datum[valueKey];
                    return {
                        title: valueName,
                        content: `<b>Disagree: </b>${value}%`,
                    };
                },
            },
            colorRanges: [
                {
                    color: 'rgba(224,234,241, 0.5)',
                    stop: 34.7,
                },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            reverse: true,
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 34.7,
                    strokeOpacity: 0,
                    label: {
                        text: '34.7% \n-26.3▼',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'right',
            label: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(questionTwoDisagree);

const questionTwoAgree: AgChartOptions = {
    container: document.getElementById('questionTwoAgree'),
    data: [{ agree: 65.3 }],
    padding: {
        left: 0,
        right: 0,
    },
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'agree',
            valueName: 'Question 1',
            scale: { max: 110 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName }) => {
                    const value = datum[valueKey];
                    return {
                        title: valueName,
                        content: `<b>Agree: </b>${value}%`,
                    };
                },
            },
            colorRanges: [
                {
                    color: 'rgba(224,234,241, 0.5)',
                    stop: 65.3,
                },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 65.3,
                    strokeOpacity: 0,
                    label: {
                        text: '65.3% \n-29.2▲',
                        position: 'right',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            label: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(questionTwoAgree);

const questionThreeDisagree: AgChartOptions = {
    container: document.getElementById('questionThreeDisagree'),
    data: [{ disagree: 18.5 }],
    padding: {
        left: 0,
        right: 0,
    },
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'disagree',
            valueName: 'Question 1',
            scale: { max: 110 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName }) => {
                    const value = datum[valueKey];
                    return {
                        title: valueName,
                        content: `<b>Disagree: </b>${value}%`,
                    };
                },
            },
            colorRanges: [
                {
                    color: 'rgba(224,234,241, 0.5)',
                    stop: 18.5,
                },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            reverse: true,
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 18.5,
                    strokeOpacity: 0,
                    label: {
                        text: '18.5% \n-8.8▼',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'right',
            label: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(questionThreeDisagree);

const questionThreeAgree: AgChartOptions = {
    container: document.getElementById('questionThreeAgree'),
    data: [{ agree: 81.5 }],
    padding: {
        left: 0,
        right: 0,
    },
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'agree',
            valueName: 'Question 1',
            scale: { max: 110 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName }) => {
                    const value = datum[valueKey];
                    return {
                        title: valueName,
                        content: `<b>Agree: </b>${value}%`,
                    };
                },
            },
            colorRanges: [
                {
                    color: 'rgba(224,234,241, 0.5)',
                    stop: 81.5,
                },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 81.5,
                    strokeOpacity: 0,
                    label: {
                        text: '81.5% \n-14.5▲',
                        position: 'right',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            label: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(questionThreeAgree);

const questionFourDisagree: AgChartOptions = {
    container: document.getElementById('questionFourDisagree'),
    data: [{ disagree: 83.4 }],
    padding: {
        left: 0,
        right: 0,
    },
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'disagree',
            valueName: 'Question 1',
            scale: { max: 110 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName }) => {
                    const value = datum[valueKey];
                    return {
                        title: valueName,
                        content: `<b>Disagree: </b>${value}%`,
                    };
                },
            },
            colorRanges: [
                {
                    color: 'rgba(224,234,241, 0.5)',
                    stop: 83.4,
                },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            reverse: true,
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 83.4,
                    strokeOpacity: 0,
                    label: {
                        text: '83.4% \n-17.1▲',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'right',
            label: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(questionFourDisagree);

const questionFourAgree: AgChartOptions = {
    container: document.getElementById('questionFourAgree'),
    data: [{ agree: 16.6 }],
    padding: {
        left: 0,
        right: 0,
    },
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'agree',
            valueName: 'Question 1',
            scale: { max: 110 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName }) => {
                    const value = datum[valueKey];
                    return {
                        title: valueName,
                        content: `<b>Agree: </b>${value}%`,
                    };
                },
            },
            colorRanges: [
                {
                    color: 'rgba(224,234,241, 0.5)',
                    stop: 16.6,
                },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 16.6,
                    strokeOpacity: 0,
                    label: {
                        text: '16.6% \n-9.9▼',
                        position: 'right',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            label: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(questionFourAgree);

const questionFiveDisagree: AgChartOptions = {
    container: document.getElementById('questionFiveDisagree'),
    data: [{ disagree: 25.3 }],
    padding: {
        left: 0,
        right: 0,
    },
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'disagree',
            valueName: 'Question 1',
            scale: { max: 110 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName }) => {
                    const value = datum[valueKey];
                    return {
                        title: valueName,
                        content: `<b>Disagree: </b>${value}%`,
                    };
                },
            },
            colorRanges: [
                {
                    color: 'rgba(224,234,241, 0.5)',
                    stop: 25.3,
                },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            reverse: true,
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 25.3,
                    strokeOpacity: 0,
                    label: {
                        text: '25.3% \n-19.6▼',
                        position: 'left',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'right',
            label: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(questionFiveDisagree);

const questionFiveAgree: AgChartOptions = {
    container: document.getElementById('questionFiveAgree'),
    data: [{ agree: 74.7 }],
    padding: {
        left: 0,
        right: 0,
    },
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'agree',
            valueName: 'Question 1',
            scale: { max: 110 },
            tooltip: {
                renderer: ({ datum, valueKey, valueName }) => {
                    const value = datum[valueKey];
                    return {
                        title: valueName,
                        content: `<b>Agree: </b>${value}%`,
                    };
                },
            },
            colorRanges: [
                {
                    color: 'rgba(224,234,241, 0.5)',
                    stop: 74.7,
                },
            ],
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 74.7,
                    strokeOpacity: 0,
                    label: {
                        text: '74.7% \n-18.7▲',
                        position: 'right',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'left',
            label: {
                enabled: false,
            },
        },
    ],
    height: 80,
};

AgCharts.create(questionFiveAgree);
