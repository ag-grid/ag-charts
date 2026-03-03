import { describe, expect, test } from '@jest/globals';

import type { AgChartOptions } from 'ag-charts-types';

import {
    IMAGE_SNAPSHOT_DEFAULTS,
    createChart,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

const HEBREW_CARTESIAN_DATA = [
    { category: 'ינואר', sales: 150, revenue: 200 },
    { category: 'פברואר', sales: 230, revenue: 310 },
    { category: 'מרץ', sales: 180, revenue: 250 },
    { category: 'אפריל', sales: 290, revenue: 380 },
    { category: 'מאי', sales: 210, revenue: 290 },
    { category: 'יוני', sales: 260, revenue: 350 },
];

const HEBREW_PIE_DATA = [
    { label: 'מוצר א', value: 30 },
    { label: 'מוצר ב', value: 25 },
    { label: 'מוצר ג', value: 20 },
    { label: 'מוצר ד', value: 15 },
    { label: 'מוצר ה', value: 10 },
];

describe('RTL', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    const createRtlChart = (options: AgChartOptions) =>
        createChart({
            enableRtl: true,
            data: HEBREW_CARTESIAN_DATA,
            title: { text: 'תרשים נתונים' },
            legend: { enabled: true },
            ...options,
        });

    describe('cartesian series', () => {
        test('bar', async () => {
            chart = await createRtlChart({
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'sales', yName: 'מכירות' },
                    { type: 'bar', xKey: 'category', yKey: 'revenue', yName: 'הכנסות' },
                ],
            });
            await compare();
        });

        test('line', async () => {
            chart = await createRtlChart({
                series: [
                    { type: 'line', xKey: 'category', yKey: 'sales', yName: 'מכירות' },
                    { type: 'line', xKey: 'category', yKey: 'revenue', yName: 'הכנסות' },
                ],
            });
            await compare();
        });

        test('area', async () => {
            chart = await createRtlChart({
                series: [
                    { type: 'area', xKey: 'category', yKey: 'sales', yName: 'מכירות', stacked: true },
                    { type: 'area', xKey: 'category', yKey: 'revenue', yName: 'הכנסות', stacked: true },
                ],
            });
            await compare();
        });

        test('scatter', async () => {
            chart = await createRtlChart({
                title: { text: 'פיזור מכירות והכנסות' },
                series: [{ type: 'scatter', xKey: 'sales', yKey: 'revenue' }],
            });
            await compare();
        });

        test('bubble', async () => {
            chart = await createRtlChart({
                title: { text: 'בועות מכירות והכנסות' },
                series: [{ type: 'bubble', xKey: 'sales', yKey: 'revenue', sizeKey: 'sales' }],
            });
            await compare();
        });
    });

    describe('polar series', () => {
        test('pie', async () => {
            chart = await createChart({
                enableRtl: true,
                data: HEBREW_PIE_DATA,
                title: { text: 'התפלגות מוצרים' },
                series: [{ type: 'pie', angleKey: 'value', calloutLabelKey: 'label', sectorLabelKey: 'label' }],
            });
            await compare();
        });

        test('donut', async () => {
            chart = await createChart({
                enableRtl: true,
                data: HEBREW_PIE_DATA,
                title: { text: 'התפלגות מוצרים' },
                series: [
                    {
                        type: 'donut',
                        angleKey: 'value',
                        calloutLabelKey: 'label',
                        sectorLabelKey: 'label',
                        innerRadiusRatio: 0.6,
                    },
                ],
            });
            await compare();
        });
    });

    describe('captions with BiDi text', () => {
        test('Hebrew captions on bar chart', async () => {
            chart = await createRtlChart({
                title: { text: 'תרשים עמודות' },
                subtitle: { text: 'נתוני Sales מוצרים' },
                footnote: { text: 'Source מחלקת report' },
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'sales', yName: 'מכירות' },
                    { type: 'bar', xKey: 'category', yKey: 'revenue', yName: 'הכנסות' },
                ],
            });
            await compare();
        });

        test('mixed text alignment', async () => {
            chart = await createRtlChart({
                title: { text: 'Sales in שקלים for 2024', textAlign: 'left' },
                subtitle: { text: 'מכירות Sales מוצרים', textAlign: 'center' },
                footnote: { text: 'Revenue מכירות', textAlign: 'right' },
                series: [
                    { type: 'line', xKey: 'category', yKey: 'sales', yName: 'מכירות' },
                    { type: 'line', xKey: 'category', yKey: 'revenue', yName: 'הכנסות' },
                ],
            });
            await compare();
        });

        test('text wrapping', async () => {
            chart = await createRtlChart({
                title: {
                    text: 'תרשים עמודות המציג נתוני מכירות חודשיים של מוצרים שונים בשנת אלפיים עשרים וארבע',
                    wrapping: 'always',
                    maxWidth: 300,
                },
                footnote: { text: 'מקור: מחלקת מכירות\nעדכון: פברואר 2024' },
                series: [
                    { type: 'area', xKey: 'category', yKey: 'sales', yName: 'מכירות', stacked: true },
                    { type: 'area', xKey: 'category', yKey: 'revenue', yName: 'הכנסות', stacked: true },
                ],
            });
            await compare();
        });
    });

    describe('LTR baseline', () => {
        test('bar chart without enableRtl', async () => {
            chart = await createChart({
                data: HEBREW_CARTESIAN_DATA,
                title: { text: 'תרשים נתונים' },
                legend: { enabled: true },
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'sales', yName: 'מכירות' },
                    { type: 'bar', xKey: 'category', yKey: 'revenue', yName: 'הכנסות' },
                ],
            });
            await compare();
        });
    });
});
