import {
    AgChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

// Wei balances exceed Number.MAX_SAFE_INTEGER (2^53 - 1), so they are supplied
// as bigint. Data values, aggregated totals, tooltips and axis tick labels stay
// exact; bar positions are computed at high but finite precision.
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Wallet Balances' },
    subtitle: { text: 'Balances in wei (1 ETH = 10^18 wei), beyond the safe-integer range' },
    data: [
        { wallet: 'Treasury', balance: 4_500_000_000_000_000_000_000n },
        { wallet: 'Staking', balance: 2_750_000_000_000_000_000_000n },
        { wallet: 'Rewards', balance: 1_125_000_000_000_000_000_000n },
        { wallet: 'Reserve', balance: 980_000_000_000_000_000_000n },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'wallet',
            yKey: 'balance',
            yName: 'Balance (wei)',
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
};

AgCharts.create(options);
