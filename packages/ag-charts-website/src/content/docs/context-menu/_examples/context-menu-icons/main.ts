import { LegendModule, ModuleRegistry, PieSeriesModule } from 'ag-charts-community';
import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';
import { ContextMenuModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([ContextMenuModule, LegendModule, PieSeriesModule]);
const DOWNLOAD_URL =
    'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJhZy1pY29uIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMS41IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxzdHlsZT4qIHsgdmVjdG9yLWVmZmVjdDogbm9uLXNjYWxpbmctc3Ryb2tlOyB9PC9zdHlsZT48cGF0aCBkPSJNMTIgMTdWMyIvPjxwYXRoIGQ9Im02IDExIDYgNiA2LTYiLz48cGF0aCBkPSJNMTkgMjFINSIvPjwvc3ZnPg==';

const JSON_URL =
    'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJhZy1pY29uIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMS41IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxzdHlsZT4qIHsgdmVjdG9yLWVmZmVjdDogbm9uLXNjYWxpbmctc3Ryb2tlOyB9PC9zdHlsZT48cGF0aCBkPSJNMTQuNSAySDZhMiAyIDAgMCAwLTIgMnYxNmEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJWNy41TDE0LjUgMnoiLz48cG9seWxpbmUgcG9pbnRzPSIxNCAyIDE0IDggMjAgOCIvPjxwYXRoIGQ9Ik04IDEzaDIiLz48cGF0aCBkPSJNOCAxN2gyIi8+PHBhdGggZD0iTTE0IDEzaDIiLz48cGF0aCBkPSJNMTQgMTdoMiIvPjwvc3ZnPg==';

const CSV_URL =
    'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSJhZy1pY29uIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMS41IiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxzdHlsZT4qIHsgdmVjdG9yLWVmZmVjdDogbm9uLXNjYWxpbmctc3Ryb2tlOyB9PC9zdHlsZT48cGF0aCBkPSJNOSAzSDVhMiAyIDAgMCAwLTIgMnY0bTYtNmgxMGEyIDIgMCAwIDEgMiAydjRNOSAzdjE4bTAgMGgxMGEyIDIgMCAwIDAgMi0yVjlNOSAyMUg1YTIgMiAwIDAgMS0yLTJWOW0wIDBoMTgiLz48L3N2Zz4=';

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
                // @ts-expect-error undocumented option
                iconUrl: DOWNLOAD_URL,
                action: () => downloadPNG(),
            },
            {
                label: 'Download JSON',
                // @ts-expect-error undocumented option
                iconUrl: JSON_URL,
                action: () => downloadJSON(),
            },
            {
                label: 'Download CSV',
                // @ts-expect-error undocumented option
                iconUrl: CSV_URL,
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
