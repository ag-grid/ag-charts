// Source: https://survey.stackoverflow.co
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const numberFormatter = new Intl.NumberFormat('en-US', { useGrouping: true });

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'What technologies developers want to learn',
    },
    subtitle: {
        text: 'StackOverflow survey results',
    },
    data: [
        { from: 'Angular', to: 'Angular', frequency: 6363 },
        { from: 'Angular', to: 'Node.js', frequency: 4915 },
        { from: 'Angular', to: 'React', frequency: 4482 },
        { from: 'Express', to: 'Express', frequency: 7511 },
        { from: 'Express', to: 'Next.js', frequency: 5823 },
        { from: 'Express', to: 'Node.js', frequency: 9028 },
        { from: 'Express', to: 'React', frequency: 7374 },
        { from: 'Next.js', to: 'Next.js', frequency: 7896 },
        { from: 'Next.js', to: 'Node.js', frequency: 6626 },
        { from: 'Next.js', to: 'React', frequency: 7280 },
        { from: 'Node.js', to: 'Angular', frequency: 4650 },
        { from: 'Node.js', to: 'Express', frequency: 7547 },
        { from: 'Node.js', to: 'Next.js', frequency: 9783 },
        { from: 'Node.js', to: 'Node.js', frequency: 19793 },
        { from: 'Node.js', to: 'React', frequency: 14208 },
        { from: 'Node.js', to: 'Svelte', frequency: 6037 },
        { from: 'Node.js', to: 'Vue.js', frequency: 6735 },
        { from: 'React', to: 'Express', frequency: 6103 },
        { from: 'React', to: 'Next.js', frequency: 10825 },
        { from: 'React', to: 'Node.js', frequency: 13323 },
        { from: 'React', to: 'React', frequency: 18534 },
        { from: 'React', to: 'Svelte', frequency: 5696 },
        { from: 'React', to: 'Vue.js', frequency: 5139 },
        { from: 'Vue.js', to: 'Node.js', frequency: 4923 },
        { from: 'Vue.js', to: 'Vue.js', frequency: 6804 },
        { from: 'jQuery', to: 'Node.js', frequency: 6385 },
        { from: 'jQuery', to: 'React', frequency: 6126 },
        { from: 'jQuery', to: 'jQuery', frequency: 5192 },
    ],
    series: [
        {
            type: 'chord',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'frequency',
            tooltip: {
                renderer: ({ datum, fromKey, toKey, sizeKey }) => ({
                    content:
                        datum[sizeKey!] != null
                            ? `${numberFormatter.format(datum[sizeKey!])} ${datum[fromKey!]} developers want to learn ${datum[toKey!]}`
                            : '',
                }),
            },
        },
    ],
};

AgCharts.create(options);
