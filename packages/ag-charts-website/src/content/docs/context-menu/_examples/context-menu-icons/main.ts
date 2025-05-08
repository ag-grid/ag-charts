import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'My Wealth Portfolio' },
    data: [
        { asset: 'Stocks', value: 450000 },
        { asset: 'Bonds', value: 150000 },
        { asset: 'Real Estate', value: 300000 },
        { asset: 'Gold', value: 50000 },
        { asset: 'Cash', value: 50000 },
    ],
    contextMenu: {
        items: [
            {
                label: 'Download PNG',
                iconClassName: 'icon icon-download',
                action: () => downloadPNG(),
            },
            {
                label: 'Download JSON',
                iconClassName: 'icon icon-sheet',
                action: () => downloadJSON(),
            },
            {
                label: 'Download CSV',
                iconClassName: 'icon icon-table',
                action: () => downloadCSV(),
            },
        ],
    },
    legend: { enabled: false },
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            calloutLabelKey: 'asset',
            sectorLabelKey: 'value',
            sectorLabel: {
                formatter: ({ value }) => `$${(value / 1000).toFixed(0)}k`,
            },
        },
    ],
};

const chart = AgCharts.create(options);

function downloadPNG() {
    chart.download();
}

function downloadJSON() {
    const dataStr = JSON.stringify(options.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart-data.json';
    a.click();

    URL.revokeObjectURL(url);
}

function downloadCSV() {
    const headers = Object.keys(options.data![0]).join(',') + '\n';
    const rows = options
        .data!.map((row) =>
            Object.values(row)
                .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                .join(',')
        )
        .join('\n');

    const csv = headers + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart-data.csv';
    a.click();

    URL.revokeObjectURL(url);
}
