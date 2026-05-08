// @ag-skip-fws
// @ag-skip-container-check
import { AgChartsCommunityModule } from 'ag-charts-community';

declare const agGrid: any;

const { ModuleRegistry, SparklinesModule, createGrid, themeQuartz } = agGrid;

ModuleRegistry.registerModules([SparklinesModule.with(AgChartsCommunityModule)]);

const SPARKLINE_COUNT = 10;

function generateSparklineData(): number[] {
    return Array.from({ length: 12 }, () => Math.round((Math.random() - 0.5) * 200) / 100);
}

const SYMBOLS = [
    'AAPL',
    'GOOGL',
    'MSFT',
    'AMZN',
    'META',
    'TSLA',
    'NVDA',
    'JPM',
    'V',
    'JNJ',
    'WMT',
    'PG',
    'UNH',
    'HD',
    'DIS',
    'BAC',
    'VZ',
    'ADBE',
    'NFLX',
    'CRM',
];
const NAMES = [
    'Apple Inc',
    'Alphabet Inc',
    'Microsoft Corp',
    'Amazon.com Inc',
    'Meta Platforms',
    'Tesla Inc',
    'NVIDIA Corp',
    'JPMorgan Chase',
    'Visa Inc',
    'Johnson & Johnson',
    'Walmart Inc',
    'Procter & Gamble',
    'UnitedHealth',
    'Home Depot',
    'Walt Disney',
    'Bank of America',
    'Verizon',
    'Adobe Inc',
    'Netflix Inc',
    'Salesforce',
];

function generateData(count: number) {
    const rows: Record<string, any>[] = [];
    for (let i = 0; i < count; i++) {
        const idx = i % SYMBOLS.length;
        const row: Record<string, any> = { symbol: SYMBOLS[idx], name: NAMES[idx] };
        for (let s = 0; s < SPARKLINE_COUNT; s++) {
            row['spark' + s] = generateSparklineData();
        }
        rows.push(row);
    }
    return rows;
}

const sparklineCols = Array.from({ length: SPARKLINE_COUNT }, (_, i) => ({
    headerName: 'Spark ' + (i + 1),
    field: 'spark' + i,
    cellRenderer: 'agSparklineCellRenderer',
    cellRendererParams: { sparklineOptions: { type: 'line' } },
    width: 120,
}));

const columnDefs = [{ field: 'symbol', width: 100 }, { field: 'name', width: 160 }, ...sparklineCols];

createGrid(document.getElementById('myChart'), {
    theme: themeQuartz,
    columnDefs,
    rowData: generateData(10000),
    rowHeight: 50,
    defaultColDef: { sortable: false, filter: false, resizable: true },
});
