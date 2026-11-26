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

const SPARKLINE_COUNT = 30;
const STYLE_SELECTOR = 'style[data-ag-charts]';

const options: AgSparklineOptions = {
    type: 'line',
    width: 200,
    height: 30,
    background: { visible: false },
    minHeight: 0,
    minWidth: 0,
    xKey: 'x',
    yKey: 'y',
    data: getData(),
};

AgCharts.__createSparkline({ ...options, container: document.getElementById('myChart') });

const win = window as any;
win.__styleCopiesAdded = 0;

function countCopies(records: MutationRecord[]) {
    for (const record of records) {
        for (const node of Array.from(record.addedNodes)) {
            if (!(node instanceof Element)) continue;
            win.__styleCopiesAdded +=
                Number(node.matches(STYLE_SELECTOR)) + node.querySelectorAll(STYLE_SELECTOR).length;
        }
    }
}

function observe(target: Node) {
    new MutationObserver(countCopies).observe(target, { childList: true, subtree: true });
}

function createCell() {
    const cell = document.createElement('div');
    cell.style.width = '200px';
    cell.style.height = '30px';
    cell.style.display = 'inline-block';
    return cell;
}

function createInDetachedCells(cells: HTMLElement) {
    const created: AgChartInstance<AgSparklineOptions>[] = [];
    const newCells: HTMLElement[] = [];
    for (let i = 0; i < SPARKLINE_COUNT; i++) {
        const cell = createCell();
        created.push(AgCharts.__createSparkline({ ...options, container: cell }));
        newCells.push(cell);
    }
    for (const cell of newCells) {
        cells.appendChild(cell);
    }
    return created;
}

const cells = document.getElementById('cells')!;
observe(cells);

let pool: AgChartInstance<AgSparklineOptions>[] = [];

function createDetached() {
    pool = createInDetachedCells(cells);
}

function rerenderPooled() {
    const oldCells = Array.from(cells.children);
    const newCells = pool.map((chart) => {
        const cell = createCell();
        chart.update({ ...options, container: cell });
        return cell;
    });
    for (const cell of newCells) {
        cells.appendChild(cell);
    }
    for (const cell of oldCells) {
        cell.remove();
    }
}

function createInShadowRoot() {
    const host = document.getElementById('shadowHost')!;
    const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    const shadowCells = document.createElement('div');
    shadowRoot.appendChild(shadowCells);
    observe(shadowCells);
    createInDetachedCells(shadowCells);
}

Object.assign(win, { createDetached, rerenderPooled, createInShadowRoot });
