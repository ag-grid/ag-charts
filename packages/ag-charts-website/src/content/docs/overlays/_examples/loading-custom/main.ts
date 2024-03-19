import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    dataSource: {
        getData: () =>
            new Promise(() => {
                // Never resolve so the loading spinner remains
            }),
    },
    overlays: {
        loading: {
            renderer: () => {
                const container = document.createElement('div');
                container.style.height = '100%';
                container.style.display = 'flex';
                container.style.alignItems = 'flex-end';
                container.style.justifyContent = 'flex-start';
                container.style.flexDirection = 'column';
                container.style.boxSizing = 'border-box';

                const spinner = document.createElement('div');
                spinner.style.width = '10px';
                spinner.style.height = '10px';
                spinner.style.borderRadius = '50%';
                spinner.style.borderWidth = '2px';
                spinner.style.borderStyle = 'solid';
                spinner.style.borderColor = '#999 #9990';
                spinner.style.animation = 'loading-spinner 1s infinite';

                const animation = document.createElement('style');
                animation.innerText =
                    '@keyframes loading-spinner { from { rotate(0turn); } to { transform: rotate(0.5turn); } }';

                container.append(spinner, animation);

                return container;
            },
        },
    },
    series: [
        {
            xKey: 'year',
            yKey: 'spending',
        },
    ],
    axes: [
        { type: 'number', position: 'left', title: { text: 'Year' } },
        { type: 'number', position: 'bottom', title: { text: 'Spending' } },
    ],
};

AgCharts.create(options);
