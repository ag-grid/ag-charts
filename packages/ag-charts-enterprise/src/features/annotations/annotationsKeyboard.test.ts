import { afterEach, describe, expect, it } from 'vitest';

import type { AgAnnotation, AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import {
    clickAction,
    deproxy,
    expectSamePixels,
    getSeriesRect,
    hoverAction,
    pressKey,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { ANNOTATIONS_EXAMPLE_OPTIONS, createAnnotationsChart } from './test/fixture';

describe('Annotations keyboard navigation', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    async function prepareChart(annotations: AgAnnotation[], options: Partial<AgCartesianChartOptions> = {}) {
        chart = await createAnnotationsChart({
            ...ANNOTATIONS_EXAMPLE_OPTIONS,
            ...options,
            annotations: { ...ANNOTATIONS_EXAMPLE_OPTIONS.annotations, ...options.annotations },
            initialState: { ...options.initialState, annotations },
        });
    }

    const body = () => deproxy(chart).ctx.agDocument.body;
    const activeElement = () => document.activeElement;
    const root = () => body().querySelector<HTMLElement>('.ag-charts-annotations');
    const list = () => root()?.querySelector<HTMLElement>('[role="list"]');
    const items = () => Array.from(list()?.querySelectorAll<HTMLButtonElement>('[role="listitem"] > button') ?? []);
    const toolbarPopover = () => body().querySelector<HTMLElement>('.ag-charts-floating-toolbar');
    const toolbarButtons = () =>
        Array.from(toolbarPopover()?.querySelectorAll<HTMLButtonElement>('.ag-charts-toolbar__button') ?? []);
    const moveButton = () => toolbarButtons().find((button) => button.title === 'Move Annotation');
    const mover = () => root()?.querySelector<HTMLElement>('.ag-charts-annotations__mover');
    const horizontalLineValue = () => (chart.getState().annotations?.[0] as { value: number }).value;

    const toCode = (key: string) => (key === ' ' ? 'Space' : key);

    async function keyDown(target: Element | null | undefined, key: string) {
        expect(target).not.toBeNull();
        target!.dispatchEvent(new KeyboardEvent('keydown', { key, code: toCode(key), bubbles: true }));
        await waitForChartStability(chart);
    }

    async function keyUp(target: Element | null | undefined, key: string) {
        target!.dispatchEvent(new KeyboardEvent('keyup', { key, code: toCode(key), bubbles: true }));
        await waitForChartStability(chart);
    }

    async function focusItem(index: number) {
        items()[index].focus();
        await waitForChartStability(chart);
    }

    async function openOptions(index = 0) {
        await focusItem(index);
        await keyDown(items()[index], 'Enter');
    }

    async function startMove(index = 0) {
        await openOptions(index);
        moveButton()!.focus();
        await keyDown(moveButton(), 'Enter');
    }

    describe('list', () => {
        it('lists each annotation as a menu button after the series area', async () => {
            await prepareChart([
                { type: 'horizontal-line', value: 50 },
                { type: 'text', text: 'Hello', x: { __type: 'date', value: '2024-07-01' }, y: 75 },
            ]);

            expect(list()?.getAttribute('role')).toBe('list');
            expect(list()?.getAttribute('aria-label')).toBe('Annotations');
            const seriesAreaBounds = body().querySelector('.ag-charts-series-area-bounds')!;
            expect(root()?.parentElement).toBe(seriesAreaBounds.parentElement);
            expect(seriesAreaBounds.compareDocumentPosition(root()!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

            const [line, text] = items();
            expect(items()).toHaveLength(2);
            expect(line.textContent).toBe('50, Horizontal Line annotation');
            expect(text.textContent).toMatch(/^Hello, .+, 75, Text annotation$/);
            for (const item of items()) {
                expect(item.getAttribute('aria-haspopup')).toBe('dialog');
                expect(item.getAttribute('aria-expanded')).toBe('false');
            }
        });

        it('marks the annotations as opening a popup only while the Annotation Options Toolbar is enabled', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);
            const popupAttributes = () => [
                items()[0].getAttribute('aria-haspopup'),
                items()[0].getAttribute('aria-expanded'),
            ];

            await chart.updateDelta({ annotations: { optionsToolbar: { enabled: false } } });
            await waitForChartStability(chart);
            expect(popupAttributes()).toEqual([null, null]);

            await chart.updateDelta({ annotations: { optionsToolbar: { enabled: true } } });
            await waitForChartStability(chart);
            expect(popupAttributes()).toEqual(['dialog', 'false']);
        });

        it('leaves the list attributes alone when an update changes nothing', async () => {
            await prepareChart([
                { type: 'horizontal-line', value: 30 },
                { type: 'horizontal-line', value: 60 },
            ]);
            const changed: Array<string | null> = [];
            const observer = new MutationObserver((records) => {
                changed.push(...records.map((record) => record.attributeName));
            });
            observer.observe(list()!, { attributes: true, subtree: true });

            await chart.updateDelta({ annotations: { enabled: true } });
            await waitForChartStability(chart);
            observer.disconnect();

            expect(changed).toEqual([]);
        });

        it('makes only one annotation a tab stop, and moves between them with the arrow keys', async () => {
            await prepareChart([
                { type: 'horizontal-line', value: 30 },
                { type: 'horizontal-line', value: 60 },
            ]);

            expect(items().map((item) => item.tabIndex)).toEqual([0, -1]);

            await focusItem(0);
            await keyDown(items()[0], 'ArrowDown');

            expect(activeElement()).toBe(items()[1]);
            expect(items().map((item) => item.tabIndex)).toEqual([-1, 0]);
        });

        it('excludes annotations outside the domain and read-only annotations', async () => {
            await prepareChart([
                { type: 'horizontal-line', value: 50 },
                { type: 'horizontal-line', value: 1000 },
                { type: 'horizontal-line', value: 20, readOnly: true },
            ]);

            expect(items().map((item) => item.textContent)).toEqual(['50, Horizontal Line annotation']);
        });

        it('has no tab stop without annotations', async () => {
            await prepareChart([]);

            expect(body().querySelectorAll('.ag-charts-annotations [tabindex="0"]')).toHaveLength(0);
        });

        it('includes an annotation outside the viewport and pans it into view when it is focused', async () => {
            await prepareChart([{ type: 'vertical-line', value: { __type: 'date', value: '2024-12-01' } }], {
                zoom: { enabled: true },
                initialState: { zoom: { ratioX: { start: 0, end: 0.5 } } },
            });

            expect(items()).toHaveLength(1);

            await focusItem(0);

            const ratioX = chart.getState().zoom?.ratioX;
            expect(ratioX?.end).toBeGreaterThan(0.5);
        });

        it('keeps the focus on its annotation when an update lists another one before it', async () => {
            await prepareChart([
                { type: 'horizontal-line', value: 30 },
                { type: 'horizontal-line', value: 150 },
                { type: 'horizontal-line', value: 60 },
            ]);
            await focusItem(1);

            await chart.updateDelta({ axes: { y: { type: 'number', max: 200 } } });
            await waitForChartStability(chart);

            expect(items().map((item) => item.textContent?.split(',')[0])).toEqual(['30', '150', '60']);
            expect(activeElement()).toBe(items()[2]);
        });

        it('relabels the annotations when the locale changes', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);

            await chart.updateDelta({ locale: { localeText: { ariaLabelAnnotation: '${type}: ${description}' } } });
            await waitForChartStability(chart);

            expect(items()[0].textContent).toBe('Horizontal Line: 50');
        });

        it('leaves the focus alone when an update removes the annotation after the keyboard left it', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);
            await focusItem(0);
            items()[0].blur();

            await chart.setState({ ...chart.getState(), annotations: [] });
            await waitForChartStability(chart);

            expect(activeElement()).toBe(document.body);
        });
    });

    describe('an update that stops listing the focused annotation', () => {
        const startStates = [
            { name: 'list item', start: () => focusItem(0) },
            { name: 'Annotation Options Toolbar', start: () => openOptions(0) },
            { name: 'move', start: () => startMove(0) },
        ];

        it.each(startStates)('moves the focus from its $name to another annotation', async ({ start }) => {
            await prepareChart([
                { type: 'horizontal-line', value: 30 },
                { type: 'horizontal-line', value: 60 },
            ]);
            await start();

            await chart.setState({
                ...chart.getState(),
                annotations: [
                    { type: 'horizontal-line', value: 30, readOnly: true },
                    { type: 'horizontal-line', value: 60 },
                ],
            });
            await waitForChartStability(chart);

            expect(toolbarPopover()).toBeNull();
            expect(mover()?.style.display).toBe('none');
            expect(items()).toHaveLength(1);
            expect(activeElement()).toBe(items()[0]);
            expect(items()[0].textContent).toBe('60, Horizontal Line annotation');
        });

        it.each(startStates)(
            'moves the focus from its $name to the series area without annotations',
            async ({ start }) => {
                await prepareChart([{ type: 'horizontal-line', value: 50 }]);
                await start();

                await chart.setState({ ...chart.getState(), annotations: [] });
                await waitForChartStability(chart);

                expect(toolbarPopover()).toBeNull();
                expect(mover()?.style.display).toBe('none');
                expect(activeElement()?.classList.contains('ag-charts-swapchain')).toBe(true);
            }
        );
    });

    describe('panning', () => {
        it('pans only along the axis that a horizontal line is outside the viewport on', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 95 }], {
                zoom: { enabled: true, axes: 'xy' },
                initialState: { zoom: { ratioX: { start: 0.25, end: 0.75 }, ratioY: { start: 0.4, end: 0.6 } } },
            });

            await focusItem(0);

            const { ratioX, ratioY } = chart.getState().zoom ?? {};
            expect(ratioX).toEqual({ start: 0.25, end: 0.75 });
            expect(ratioY).not.toEqual({ start: 0.4, end: 0.6 });
            expect((ratioY?.end ?? 0) - (ratioY?.start ?? 0)).toBeCloseTo(0.2);
        });

        it('pans a line longer than the viewport into view without zooming out', async () => {
            await prepareChart(
                [
                    {
                        type: 'line',
                        start: { x: { __type: 'date', value: '2024-01-10' }, y: 90 },
                        end: { x: { __type: 'date', value: '2024-12-20' }, y: 95 },
                    },
                ],
                {
                    zoom: { enabled: true, axes: 'xy' },
                    initialState: { zoom: { ratioX: { start: 0.25, end: 0.5 }, ratioY: { start: 0.2, end: 0.4 } } },
                }
            );

            await focusItem(0);

            const { ratioX, ratioY } = chart.getState().zoom ?? {};
            expect(ratioX).toEqual({ start: 0.25, end: 0.5 });
            expect((ratioY?.end ?? 0) - (ratioY?.start ?? 0)).toBeCloseTo(0.2);
            expect(ratioY?.end).toBeGreaterThan(0.85);
        });
    });

    describe('Annotation Options Toolbar', () => {
        it('opens with Enter, moves focus to its first button and marks the annotation expanded', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);

            await openOptions();

            expect(toolbarPopover()?.getAttribute('role')).toBe('dialog');
            expect(toolbarPopover()?.getAttribute('aria-label')).toBe('Annotation Options');
            expect(activeElement()).toBe(toolbarButtons()[0]);
            expect(items()[0].getAttribute('aria-expanded')).toBe('true');
        });

        it('opens with Space', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);

            await focusItem(0);
            await keyDown(items()[0], ' ');

            expect(activeElement()).toBe(toolbarButtons()[0]);
        });

        it('closes with Escape and returns focus to the annotation', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);
            await openOptions();

            await keyDown(activeElement(), 'Escape');

            expect(toolbarPopover()).toBeNull();
            expect(activeElement()).toBe(items()[0]);
            expect(items()[0].getAttribute('aria-expanded')).toBe('false');
        });

        it('appends the Move Annotation button when opened with the keyboard, whatever the buttons options', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }], {
                annotations: {
                    optionsToolbar: {
                        buttons: [{ icon: 'delete', tooltip: 'toolbarAnnotationsDelete', value: 'delete' }],
                    },
                },
            });

            await openOptions();

            expect(toolbarButtons()).toHaveLength(2);
            expect(moveButton()).toBe(toolbarButtons()[1]);
        });

        async function clickLine() {
            const { x, y, width, height } = getSeriesRect(chart);
            const centre = { x: x + width / 2, y: y + height / 2 };
            await hoverAction(centre.x, centre.y)(chart);
            await clickAction(centre.x, centre.y)(chart);
            await waitForChartStability(chart);
        }

        it('does not show the Move Annotation button when the annotation is selected with a pointer', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);

            await clickLine();

            expect(toolbarButtons().length).toBeGreaterThan(0);
            expect(moveButton()).toBeUndefined();
        });

        it('adds the Move Annotation button when the keyboard selects the annotation that a pointer selected', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);
            await clickLine();
            expect(moveButton()).toBeUndefined();

            await openOptions();

            expect(moveButton()).toBeDefined();
        });

        it('moves focus to the next annotation after deleting one', async () => {
            await prepareChart([
                { type: 'horizontal-line', value: 30 },
                { type: 'horizontal-line', value: 60 },
            ]);
            await openOptions(0);

            toolbarButtons()
                .find((button) => button.title === 'Delete')!
                .click();
            await waitForChartStability(chart);

            expect(items()).toHaveLength(1);
            expect(activeElement()).toBe(items()[0]);
            expect(items()[0].textContent).toBe('60, Horizontal Line annotation');
        });
    });

    describe('Move Annotation', () => {
        it('hides the toolbar and hands the arrow keys to the annotation', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);

            await startMove();

            expect(toolbarPopover()).toBeNull();
            const handle = activeElement();
            expect(handle?.textContent).toBe('Moving annotation');
            const description = body().querySelector(`#${handle?.getAttribute('aria-describedby')}`);
            expect(description?.textContent).toContain('arrow keys');

            await keyDown(handle, 'ArrowUp');
            await keyUp(handle, 'ArrowUp');

            expect(horizontalLineValue()).toBeGreaterThan(50);
            expect(activeElement()).toBe(handle);
            expect(handle?.textContent).toMatch(/^50\.\d+$/);
        });

        it('announces only the range along the axis that a move changed', async () => {
            await prepareChart([
                {
                    type: 'line',
                    start: { x: { __type: 'date', value: '2024-03-01' }, y: 20 },
                    end: { x: { __type: 'date', value: '2024-09-01' }, y: 80 },
                },
            ]);
            await startMove();
            const handle = activeElement();

            await keyDown(handle, 'ArrowDown');
            await keyUp(handle, 'ArrowDown');

            expect(handle?.textContent).toMatch(/^1\d\.\d+ to 7\d\.\d+$/);
        });

        it('disables Move Annotation for a locked annotation', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50, locked: true }]);

            await openOptions();

            expect(moveButton()?.getAttribute('aria-disabled')).toBe('true');
        });

        it('ends the move when annotations are disabled, moving the focus to the series area', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);
            await startMove();
            const handle = activeElement();

            await chart.updateDelta({ annotations: { enabled: false } });
            await waitForChartStability(chart);
            await keyDown(handle, 'ArrowUp');
            await keyUp(handle, 'ArrowUp');

            expect(activeElement()?.classList.contains('ag-charts-swapchain')).toBe(true);
            await chart.updateDelta({ annotations: { enabled: true } });
            await waitForChartStability(chart);
            expect(horizontalLineValue()).toBe(50);
        });

        it('ends the move when an update locks the annotation, moving the focus to its list item', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);
            await startMove();
            const handle = activeElement();

            await chart.setState({
                ...chart.getState(),
                annotations: [{ type: 'horizontal-line', value: 50, locked: true }],
            });
            await waitForChartStability(chart);

            expect(activeElement()).toBe(items()[0]);
            expect((handle as HTMLElement).style.display).toBe('none');
        });

        it('records the move in the history, so that undo reverts it', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);
            await startMove();

            await keyDown(activeElement(), 'ArrowUp');
            await keyUp(activeElement(), 'ArrowUp');
            expect(horizontalLineValue()).toBeGreaterThan(50);

            await pressKey(chart, 'z', { ctrlKey: true });

            expect(horizontalLineValue()).toBe(50);
        });

        it('relabels the annotation after a move', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);
            await startMove();

            await keyDown(activeElement(), 'ArrowUp');
            await keyUp(activeElement(), 'ArrowUp');
            await keyDown(activeElement(), 'Escape');

            expect(items()[0].textContent).toMatch(/^50\.\d+, Horizontal Line annotation$/);
        });

        it('keeps the move and deselects the annotation when the focus leaves it', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);
            await startMove();
            await keyDown(activeElement(), 'ArrowUp');
            await keyUp(activeElement(), 'ArrowUp');

            mover()!.blur();
            await waitForChartStability(chart);
            const afterBlur = ctx.snapshot();

            expect(horizontalLineValue()).toBeGreaterThan(50);
            expect(mover()?.style.display).toBe('none');
            expect(toolbarPopover()).toBeNull();
            expect(activeElement()).toBe(document.body);
            // Selecting and deselecting the annotation again renders it as a deselected annotation.
            await openOptions();
            await keyDown(activeElement(), 'Escape');
            items()[0].blur();
            await waitForChartStability(chart);
            expectSamePixels(afterBlur, ctx.snapshot());
        });

        it('returns to the Move Annotation button with Escape', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);
            await startMove();
            const handle = activeElement();

            await keyDown(handle, 'Escape');

            expect(activeElement()).toBe(moveButton());
            expect(toolbarPopover()).not.toBeNull();
            expect((handle as HTMLElement).style.display).toBe('none');
        });
    });
});
