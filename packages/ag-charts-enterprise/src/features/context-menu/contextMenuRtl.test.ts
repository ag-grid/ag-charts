import { afterEach, describe, expect, it, test } from '@jest/globals';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import { contextMenuAction, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import { DEFAULT_CONTEXT_MENU_CLASS } from './contextMenuStyles';

describe('Context Menu RTL', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    const EXAMPLE_OPTIONS: AgChartOptions = {
        enableRtl: true,
        data: [
            { x: 'ינואר', y: 15 },
            { x: 'פברואר', y: 50 },
            { x: 'מרץ', y: 25 },
            { x: 'אפריל', y: 75 },
            { x: 'מאי', y: 50 },
            { x: 'יוני', y: 25 },
        ],
        series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
        contextMenu: {
            enabled: true,
            items: [
                'defaults',
                'separator',
                {
                    type: 'action',
                    label: 'Sales in שקלים for 2024',
                    action: () => {},
                },
                {
                    label: 'מכירות Sales מוצרים',
                    items: [
                        {
                            type: 'action',
                            label: 'תרשים עמודות',
                            action: () => {},
                        },
                        {
                            label: 'מכירות Q1 2024',
                            items: [
                                {
                                    type: 'action',
                                    label: 'Revenue מכירות',
                                    action: () => {},
                                },
                                {
                                    type: 'action',
                                    label: 'מכירות Sales מוצרים',
                                    action: () => {},
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        legend: {},
    };

    let cx: number = 0;
    let cy: number = 0;
    let tmpPointerEvent: typeof globalThis.PointerEvent;

    async function prepareChart(contextMenuOptions?: AgChartOptions['contextMenu'], baseOptions = EXAMPLE_OPTIONS) {
        const options: AgChartOptions = {
            ...baseOptions,
            contextMenu: { ...baseOptions.contextMenu, ...(contextMenuOptions ?? {}) },
        };
        prepareEnterpriseTestOptions(options);
        cx = options.width! / 2;
        cy = options.height! / 2;

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
    }

    beforeEach(() => {
        tmpPointerEvent = globalThis.PointerEvent;
        globalThis.PointerEvent = class extends MouseEvent {} as typeof globalThis.PointerEvent;
    });

    afterEach(() => {
        globalThis.PointerEvent = tmpPointerEvent;
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);
        expect(document.body.getElementsByClassName(DEFAULT_CONTEXT_MENU_CLASS)).toMatchSnapshot();
    };

    it('should render menu with RTL direction and Hebrew text', async () => {
        await prepareChart();
        await contextMenuAction(cx, cy)(chart);
        await compare();
    });

    describe('submenu expansion', () => {
        test('hover submenu parent shows submenu', async () => {
            await prepareChart();
            await contextMenuAction(cx, cy)(chart);
            await waitForChartStability(chart);

            const menuItems = Array.from(
                document.body.getElementsByClassName(
                    `${DEFAULT_CONTEXT_MENU_CLASS}__item`
                ) as HTMLCollectionOf<HTMLElement>
            );
            const submenuParent = menuItems.find((item) => item.textContent?.includes('מכירות Sales מוצרים'));
            expect(submenuParent).toBeDefined();

            submenuParent!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            await waitForChartStability(chart);
            await compare();
        });

        test('nested submenu (3 levels)', async () => {
            await prepareChart();
            await contextMenuAction(cx, cy)(chart);
            await waitForChartStability(chart);

            // Open level 1 submenu.
            const menuItems = Array.from(
                document.body.getElementsByClassName(
                    `${DEFAULT_CONTEXT_MENU_CLASS}__item`
                ) as HTMLCollectionOf<HTMLElement>
            );
            const level1Parent = menuItems.find((item) => item.textContent?.includes('מכירות Sales מוצרים'));
            expect(level1Parent).toBeDefined();
            level1Parent!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            await waitForChartStability(chart);

            // Open level 2 submenu.
            const allItems = Array.from(
                document.body.getElementsByClassName(
                    `${DEFAULT_CONTEXT_MENU_CLASS}__item`
                ) as HTMLCollectionOf<HTMLElement>
            );
            const level2Parent = allItems.find((item) => item.textContent?.includes('מכירות Q1 2024'));
            expect(level2Parent).toBeDefined();
            level2Parent!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            await waitForChartStability(chart);

            await compare();
        });
    });

    describe('keyboard navigation', () => {
        test('ArrowLeft opens submenu in RTL', async () => {
            await prepareChart();
            await contextMenuAction(cx, cy)(chart);
            await waitForChartStability(chart);

            const menu = document.body.querySelector(`.${DEFAULT_CONTEXT_MENU_CLASS}__menu`) as HTMLElement;
            expect(menu).toBeDefined();

            // Navigate down to the submenu parent item.
            menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
            menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
            menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
            await waitForChartStability(chart);

            // ArrowLeft should open submenu in RTL.
            menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', code: 'ArrowLeft', bubbles: true }));
            await waitForChartStability(chart);

            await compare();
        });

        test('ArrowRight closes submenu in RTL', async () => {
            await prepareChart();
            await contextMenuAction(cx, cy)(chart);
            await waitForChartStability(chart);

            // Open submenu via hover first.
            const menuItems = Array.from(
                document.body.getElementsByClassName(
                    `${DEFAULT_CONTEXT_MENU_CLASS}__item`
                ) as HTMLCollectionOf<HTMLElement>
            );
            const submenuParent = menuItems.find((item) => item.textContent?.includes('מכירות Sales מוצרים'));
            expect(submenuParent).toBeDefined();
            submenuParent!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            await waitForChartStability(chart);

            // Find the submenu and dispatch ArrowRight to close it.
            const allMenus = document.body.querySelectorAll(`.${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
            const submenu = allMenus.item(allMenus.length - 1) as HTMLElement;
            submenu.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true })
            );
            await waitForChartStability(chart);

            await compare();
        });

        test('Escape closes submenu', async () => {
            await prepareChart();
            await contextMenuAction(cx, cy)(chart);
            await waitForChartStability(chart);

            // Open submenu via hover.
            const menuItems = Array.from(
                document.body.getElementsByClassName(
                    `${DEFAULT_CONTEXT_MENU_CLASS}__item`
                ) as HTMLCollectionOf<HTMLElement>
            );
            const submenuParent = menuItems.find((item) => item.textContent?.includes('מכירות Sales מוצרים'));
            expect(submenuParent).toBeDefined();
            submenuParent!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            await waitForChartStability(chart);

            // Dispatch Escape on the submenu.
            const allMenus = document.body.querySelectorAll(`.${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
            const submenu = allMenus.item(allMenus.length - 1) as HTMLElement;
            submenu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
            await waitForChartStability(chart);

            await compare();
        });

        test('ArrowDown/ArrowUp navigate items', async () => {
            await prepareChart();
            await contextMenuAction(cx, cy)(chart);
            await waitForChartStability(chart);

            const menu = document.body.querySelector(`.${DEFAULT_CONTEXT_MENU_CLASS}__menu`) as HTMLElement;
            expect(menu).toBeDefined();

            // Navigate down through items.
            menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
            menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));
            await waitForChartStability(chart);

            await compare();

            // Navigate up.
            menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', code: 'ArrowUp', bubbles: true }));
            await waitForChartStability(chart);

            expect(document.body.getElementsByClassName(DEFAULT_CONTEXT_MENU_CLASS)).toMatchSnapshot();
        });
    });
});
