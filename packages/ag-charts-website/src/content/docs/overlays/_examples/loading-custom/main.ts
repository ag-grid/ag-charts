import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    DataSourceModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    DataSourceModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    ContextMenuModule,
]);

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
                container.style.display = 'flex';
                container.style.alignItems = 'flex-end';
                container.style.justifyContent = 'flex-start';
                container.style.flexDirection = 'column';
                container.style.height = '100%';
                container.style.boxSizing = 'border-box';
                container.style.userSelect = 'none';
                container.style.animation = 'loading 250ms linear 50ms both';

                const spinner = document.createElement('div');
                spinner.style.width = '20px';
                spinner.style.height = '20px';
                spinner.style.backgroundImage = [
                    'linear-gradient(#333, #333)',
                    'linear-gradient(#999, #999)',
                    'linear-gradient(#ccc, #ccc)',
                ].join(', ');
                spinner.style.backgroundPosition = '0% 0%, 0% 100%, 100% 100%';
                spinner.style.backgroundSize = '50% 50%';
                spinner.style.backgroundRepeat = 'no-repeat';
                spinner.style.animation = 'loading-spinner 1s infinite';

                const animation = document.createElement('style');
                animation.innerText = [
                    '@keyframes loading { from { opacity: 0 } to { opacity: 1 } }',
                    '@keyframes loading-spinner {',
                    '  0% { background-position: 0% 0%, 0% 100%, 100% 100%; }',
                    '  25% { background-position: 100% 0%, 0% 0%, 0% 100%; }',
                    '  50% { background-position: 100% 100%, 100% 0%, 0% 0%; }',
                    '  75% { background-position: 0% 100%, 100% 100%, 100% 0%; }',
                    '  100% { background-position: 0% 0%, 0% 100%, 100% 100%; }',
                    '}',
                ].join(' ');

                container.replaceChildren(spinner, animation);

                return container;
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
        },
    ],
    axes: {
        y: { type: 'number', title: { text: 'Year' } },
        x: { type: 'number', title: { text: 'Spending' } },
    },
};

AgCharts.create(options);
