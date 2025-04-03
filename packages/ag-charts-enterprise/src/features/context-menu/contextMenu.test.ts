import { afterEach, describe, expect, it, test } from '@jest/globals';

import { type AgChartOptions, AgCharts, AgContextMenuAction } from 'ag-charts-community';
import {
    Chart,
    contextMenuAction,
    longTapAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart, prepareEnterpriseTestOptions } from '../../test/utils';
import { DEFAULT_CONTEXT_MENU_CLASS } from './contextMenuStyles';

describe('Context Menu', () => {
    setupMockConsole();

    let chart: any;

    const EXAMPLE_OPTIONS: AgChartOptions = {
        data: [
            { x: 0, y: 15 },
            { x: 1, y: 50 },
            { x: 2, y: 25 },
            { x: 3, y: 75 },
            { x: 4, y: 50 },
            { x: 5, y: 25 },
            { x: 6, y: 50 },
            { x: 7, y: 75 },
        ],
        series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
        contextMenu: {
            enabled: true,
        },
        legend: {},
    };

    let cx: number = 0;
    let cy: number = 0;
    let tmpPointerEvent: typeof global.PointerEvent;

    async function prepareChart(contextMenuOptions?: AgChartOptions['contextMenu'], baseOptions = EXAMPLE_OPTIONS) {
        const options: AgChartOptions = {
            ...baseOptions,
            contextMenu: { ...baseOptions.contextMenu, ...(contextMenuOptions ?? {}) },
        };
        prepareEnterpriseTestOptions(options);
        cx = options.width! / 2;
        cy = options.height! / 2;

        chart = AgCharts.create(options);

        // Click once in the chart to ensure the chart is active / mouse is over it to ensure the first scroll wheel
        // event is triggered.
        await waitForChartStability(chart);
    }

    beforeEach(() => {
        // Node.js does not have a PointerEvent constructor (which is what we use to create synthetic 'contextmenu'
        // events). So create custom class for it (Note: the standard PointerEvent class extends MouseEvent).
        tmpPointerEvent = global.PointerEvent;
        global.PointerEvent = class extends MouseEvent {} as typeof global.PointerEvent;
    });

    afterEach(() => {
        global.PointerEvent = tmpPointerEvent;
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);
        expect(document.body.getElementsByClassName(DEFAULT_CONTEXT_MENU_CLASS)).toMatchSnapshot();
    };

    it('should initially be hidden', async () => {
        await prepareChart();
        await compare();
    });

    describe('should show the default actions', () => {
        test('mouse', async () => {
            await prepareChart();
            await contextMenuAction(cx, cy)(chart);
            await compare();
        });
        test('touch', async () => {
            await prepareChart();
            await longTapAction(cx, cy)(chart);
            await compare();
        });
    });

    describe('should show the legend actions', () => {
        test('mouse', async () => {
            await prepareChart();
            await contextMenuAction(410, 575)(chart);
            await compare();
        });
        test('touch', async () => {
            await prepareChart();
            await longTapAction(410, 575)(chart);
            await compare();
        });
    });
});

describe('Extra Actions', () => {
    setupMockConsole();
    setupMockCanvas();

    type ActionCall = { label: string; args: unknown[] };
    type ActionTracker = { calls: ActionCall[]; makeAction<TEvent>(label: string): AgContextMenuAction<TEvent> };
    let actions: ActionTracker;
    let chart: Chart;

    function findMenuItemByText(text: string): HTMLElement | undefined {
        const menuItems = document.querySelectorAll<HTMLElement>('.ag-charts-context-menu__item');
        for (let item of Array.from(menuItems)) {
            if (item.textContent === text) {
                return item;
            }
        }
        return undefined;
    }
    function clickMenuItem(text: string) {
        const menuItem = findMenuItemByText(text);
        expect(menuItem).toBeDefined();
        menuItem!.click();
    }

    beforeEach(async () => {
        actions = {
            calls: [],
            makeAction<TEvent>(label: string): AgContextMenuAction<TEvent> {
                return { label, action: (...args: any[]) => actions.calls.push({ label, args }) };
            },
        };
        chart = await createEnterpriseChart({
            contextMenu: {
                extraActions: [actions.makeAction('myExtraAction')],
                extraSeriesAreaActions: [actions.makeAction('myExtraSeriesAreaAction')],
                extraNodeActions: [actions.makeAction('myExtraNodeAction')],
                extraLegendItemActions: [actions.makeAction('myExtraLegendItemAction')],
            },
            data: [
                { month: 'Jun', sweaters: 50, hats: 40 },
                { month: 'Jul', sweaters: 70, hats: 50 },
                { month: 'Aug', sweaters: 60, hats: 30 },
            ],
            series: [
                { type: 'bar', xKey: 'month', yKey: 'sweaters' },
                { type: 'bar', xKey: 'month', yKey: 'hats' },
            ],
        });
    });

    test('callbacks', async ()=> {
        const landmark1 = {x: 102, y: 562}; // bottom left corner (i.e. background of the chart).
        const landmark2 = {x: 533, y: 291}; // series-area between two nodes (i.e. pickNode miss)
        const landmark3 = {x: 366, y: 299}; // 2nd node of 1st bar series.
        const landmark4 = {x: 707, y: 418}; // 3rd node of 2nd bar series.
        const landmark5 = {x: 376, y: 573}; // 1st legend item.
        const landmark6 = {x: 458, y: 573}; // 2nd legend item.
        expect(chart).toBeDefined();

        await contextMenuAction(landmark1.x, landmark1.y)(chart);
        clickMenuItem('myExtraAction');

        await contextMenuAction(landmark2.x, landmark2.y)(chart);
        clickMenuItem('myExtraSeriesAreaAction');

        await contextMenuAction(landmark3.x, landmark3.y)(chart);
        clickMenuItem('myExtraNodeAction');
        await contextMenuAction(landmark4.x, landmark4.y)(chart);
        clickMenuItem('myExtraNodeAction');

        await contextMenuAction(landmark5.x, landmark5.y)(chart);
        clickMenuItem('myExtraLegendItemAction');
        await contextMenuAction(landmark6.x, landmark6.y)(chart);
        clickMenuItem('myExtraLegendItemAction');

        expect(actions.calls).toMatchSnapshot();
    });
});
