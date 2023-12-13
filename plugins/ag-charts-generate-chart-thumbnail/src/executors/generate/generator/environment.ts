import { JSDOM } from 'jsdom';

import { AgCharts } from 'ag-charts-community';
import { mockCanvas } from 'ag-charts-test';

import { DEFAULT_THUMBNAIL_HEIGHT, DEFAULT_THUMBNAIL_WIDTH, THUMBNAIL_POOL_SIZE } from './constants';

function buildPoolEntry() {
    const jsdom = new JSDOM('<html><head><style></style></head><body><div id="myChart"></div></body></html>');

    const mockCtx = mockCanvas.setup({
        width: DEFAULT_THUMBNAIL_WIDTH,
        height: DEFAULT_THUMBNAIL_HEIGHT,
        document: jsdom.window.document,
        window: jsdom.window as any,
        mockText: false,
    });

    const options = {
        animation: { enabled: false },
        document: jsdom.window.document,
        window: jsdom.window,
        width: DEFAULT_THUMBNAIL_WIDTH,
        height: DEFAULT_THUMBNAIL_HEIGHT,
    } as any;

    const chartProxy = AgCharts.create(options);

    return [jsdom, mockCtx, chartProxy] as const;
}

const pool: ReturnType<typeof buildPoolEntry>[] = [];

function initPool() {
    // eslint-disable-next-line no-console
    console.log(`Creating thumbnail pool of size ${THUMBNAIL_POOL_SIZE}`);
    for (let i = 0; i < THUMBNAIL_POOL_SIZE; i++) {
        pool.push(buildPoolEntry());
    }
}
initPool();

export async function borrowFromPool() {
    let count = 0;
    while (pool.length === 0 && count < THUMBNAIL_POOL_SIZE) {
        // eslint-disable-next-line no-console
        console.log('Waiting for pool to become available...');
        await new Promise((resolve) => setTimeout(resolve, (10 * count) ** 2));
        count++;
    }

    if (pool.length === 0) {
        throw new Error('No JSDOM instance available to borrow.');
    }

    return pool.shift();
}

export function returnToPool(poolEntry: ReturnType<typeof buildPoolEntry>) {
    pool.push(poolEntry);
}
