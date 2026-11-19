import { afterEach, describe, expect, it } from 'vitest';

import type { AgAnnotation, AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import {
    clickAction,
    deproxy,
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
    setupMockCanvas();

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
    const list = () => body().querySelector<HTMLElement>('.ag-charts-annotations');
    const items = () => Array.from(list()?.querySelectorAll<HTMLButtonElement>('[role="listitem"] > button') ?? []);
    const toolbarPopover = () => body().querySelector<HTMLElement>('.ag-charts-floating-toolbar');
    const toolbarButtons = () =>
        Array.from(toolbarPopover()?.querySelectorAll<HTMLButtonElement>('.ag-charts-toolbar__button') ?? []);
    const moveButton = () => toolbarButtons().find((button) => button.title === 'Move Annotation');
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

    describe('list', () => {
        it('lists each annotation as a menu button after the series area', async () => {
            await prepareChart([
                { type: 'horizontal-line', value: 50 },
                { type: 'text', text: 'Hello', x: { __type: 'date', value: '2024-07-01' }, y: 75 },
            ]);

            expect(list()?.getAttribute('role')).toBe('list');
            expect(list()?.getAttribute('aria-label')).toBe('Annotations');
            const seriesAreaBounds = body().querySelector('.ag-charts-series-area-bounds')!;
            expect(list()?.parentElement).toBe(seriesAreaBounds.parentElement);
            expect(seriesAreaBounds.compareDocumentPosition(list()!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

            const [line, text] = items();
            expect(items()).toHaveLength(2);
            expect(line.textContent).toBe('50, Horizontal Line annotation');
            expect(text.textContent).toMatch(/^Hello, .+, 75, Text annotation$/);
            for (const item of items()) {
                expect(item.getAttribute('aria-haspopup')).toBe('dialog');
                expect(item.getAttribute('aria-expanded')).toBe('false');
            }
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

        it('lets pointer events through to the series area', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);

            expect(items()[0].style.pointerEvents).toBe('none');
            // The container's own `pointer-events: none` comes from this class's stylesheet.
            expect(list()?.classList.contains('ag-charts-proxy-container')).toBe(true);
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
                annotations: { optionsToolbar: { buttons: [{ icon: 'delete', value: 'delete' }] } },
            });

            await openOptions();

            expect(toolbarButtons()).toHaveLength(2);
            expect(moveButton()).toBe(toolbarButtons()[1]);
        });

        it('does not show the Move Annotation button when the annotation is selected with a pointer', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);

            const { x, y, width, height } = getSeriesRect(chart);
            const centre = { x: x + width / 2, y: y + height / 2 };
            await hoverAction(centre.x, centre.y)(chart);
            await clickAction(centre.x, centre.y)(chart);
            await waitForChartStability(chart);

            expect(toolbarButtons().length).toBeGreaterThan(0);
            expect(moveButton()).toBeUndefined();
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
        async function startMove() {
            await openOptions();
            moveButton()!.focus();
            await keyDown(moveButton(), 'Enter');
        }

        it('hides the toolbar and hands the arrow keys to the annotation', async () => {
            await prepareChart([{ type: 'horizontal-line', value: 50 }]);

            await startMove();

            expect(toolbarPopover()).toBeNull();
            const handle = activeElement();
            expect(handle?.textContent).toBe('50, Horizontal Line annotation');
            const description = body().querySelector(`#${handle?.getAttribute('aria-describedby')}`);
            expect(description?.textContent).toContain('arrow keys');

            await keyDown(handle, 'ArrowUp');
            await keyUp(handle, 'ArrowUp');

            expect(horizontalLineValue()).toBeGreaterThan(50);
            expect(activeElement()).toBe(handle);
            expect(handle?.textContent).toMatch(/^50\.\d+, Horizontal Line annotation$/);
            const liveRegion = body().querySelector('[role="status"]');
            expect(liveRegion?.textContent).toMatch(/^50\.\d+$/);
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
