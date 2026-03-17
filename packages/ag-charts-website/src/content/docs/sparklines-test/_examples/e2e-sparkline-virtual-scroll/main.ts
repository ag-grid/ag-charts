// @ag-skip-fws
// @ag-skip-container-check
import {
    AgChartInstance,
    AgCharts,
    AgSparklineOptions,
    CategoryAxisModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule]);

// ---------------------------------------------------------------------------
// Virtual-scroll sparkline demo
//
// Simulates a grid with 1000 rows, each containing a sparkline. Only the rows
// visible inside the 400px viewport are materialised. As the user scrolls,
// sparklines leaving the viewport are destroyed (returned to pool) and new ones
// entering the viewport are created (reused from pool).
// ---------------------------------------------------------------------------

const TOTAL_ROWS = 1000;
const ROW_HEIGHT = 36;
const OVERSCAN = 5; // extra rows rendered above/below viewport

const baseOptions: AgSparklineOptions = {
    type: 'line',
    width: 200,
    height: 30,
    background: { visible: false },
    minHeight: 0,
    minWidth: 0,
    xKey: 'x',
    yKey: 'y',
};

// Pre-generate data for all rows so scrolling back shows the same sparkline.
const rowData: { x: number; y: number }[][] = Array.from({ length: TOTAL_ROWS }, () => getData());

// Create one initial sparkline so gotoExample detects a canvas on load.
AgCharts.__createSparkline({ ...baseOptions, container: document.getElementById('myChart')!, data: getData() });

// ---------------------------------------------------------------------------
// Virtual-scroll state
// ---------------------------------------------------------------------------

interface RowEntry {
    element: HTMLElement;
    sparkline: AgChartInstance<AgSparklineOptions>;
}

const activeRows = new Map<number, RowEntry>();
let currentStart = -1;
let currentEnd = -1;

const viewport = document.getElementById('viewport')!;
const stats = document.getElementById('stats')!;

// Sentinel element whose height matches the full virtual list, providing the
// scrollbar range.
const scrollContent = document.createElement('div');
scrollContent.id = 'scroll-content';
scrollContent.style.height = `${TOTAL_ROWS * ROW_HEIGHT}px`;
viewport.appendChild(scrollContent);

// ---------------------------------------------------------------------------
// Render visible rows
// ---------------------------------------------------------------------------

function renderVisibleRows() {
    const scrollTop = viewport.scrollTop;
    const viewportHeight = viewport.clientHeight;

    const firstVisible = Math.floor(scrollTop / ROW_HEIGHT);
    const lastVisible = Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) - 1;

    const start = Math.max(0, firstVisible - OVERSCAN);
    const end = Math.min(TOTAL_ROWS - 1, lastVisible + OVERSCAN);

    if (start === currentStart && end === currentEnd) return;
    currentStart = start;
    currentEnd = end;

    // Remove rows that scrolled out of range.
    for (const [index, entry] of activeRows) {
        if (index < start || index > end) {
            entry.sparkline.destroy();
            entry.element.remove();
            activeRows.delete(index);
        }
    }

    // Add rows that scrolled into range.
    for (let i = start; i <= end; i++) {
        if (activeRows.has(i)) continue;

        const row = document.createElement('div');
        row.className = 'row';
        row.style.position = 'absolute';
        row.style.top = `${i * ROW_HEIGHT}px`;
        row.style.width = '100%';

        const label = document.createElement('div');
        label.className = 'row-label';
        label.textContent = `Row ${i}`;
        row.appendChild(label);

        const cell = document.createElement('div');
        cell.className = 'sparkline-cell';
        row.appendChild(cell);

        scrollContent.appendChild(row);

        const sparkline = AgCharts.__createSparkline({
            ...baseOptions,
            container: cell,
            data: rowData[i],
        });

        activeRows.set(i, { element: row, sparkline });
    }

    stats.textContent = `rows ${start}–${end} (${activeRows.size} active, pool recycling via destroy/create)`;
}

// ---------------------------------------------------------------------------
// Wire up scroll listener and initial render
// ---------------------------------------------------------------------------

viewport.addEventListener('scroll', renderVisibleRows, { passive: true });
renderVisibleRows();
