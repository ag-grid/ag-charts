import { afterEach, describe, expect, it, vi } from 'vitest';

import { type AgAnnotation, type AgChartInstance, _ModuleSupport } from 'ag-charts-community';
import {
    clickAction,
    deproxy,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { ButtonWidget } from 'ag-charts-core';

import { getAnnotationsModuleContext } from '../../test/featureAccessors';
import { ANNOTATIONS_EXAMPLE_OPTIONS, createAnnotationsChart } from './test/fixture';

const MENU = '.ag-charts-menu';
const DIALOG = '.ag-charts-dialog';
const COLOR_PICKER = '.ag-charts-color-picker';
const ACTIVE = 'ag-charts-toolbar__button--active';

describe('Annotation popovers', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const body = () => deproxy(chart!).ctx.agDocument.body;
    const all = (selector: string) => Array.from(body().querySelectorAll<HTMLElement>(selector));

    function getButton(title: string) {
        const button = body().querySelector<HTMLElement>(`button[title="${title}"]`);
        expect(button).not.toBeNull();
        return button!;
    }

    function getOnly(selector: string) {
        const found = all(selector);
        expect(found).toHaveLength(1);
        return found[0];
    }

    async function press(element: HTMLElement) {
        element.click();
        await waitForChartStability(chart!);
    }

    // The settings dialog opens on its Line tab, whose first colour button is the line colour.
    function getLineColorButton() {
        const [button] = all('.ag-charts-dialog__color-picker-button');
        expect(button).toBeDefined();
        return button;
    }

    async function selectHorizontalLine() {
        const annotation: AgAnnotation = { type: 'horizontal-line', value: 50 };
        chart = await createAnnotationsChart({
            ...ANNOTATIONS_EXAMPLE_OPTIONS,
            initialState: { annotations: [annotation] },
        });
        const rect = deproxy(chart).seriesRect;
        expect(rect).toBeDefined();
        const centre = { x: rect!.x + rect!.width / 2, y: rect!.y + rect!.height / 2 };
        await hoverAction(centre.x, centre.y)(chart);
        await clickAction(centre.x, centre.y)(chart);
        await waitForChartStability(chart);
    }

    // `DOCUMENT_POSITION_FOLLOWING`: of two absolutely positioned popovers, the later one in the DOM is painted on top.
    const follows = (later: Node, earlier: Node) =>
        (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

    describe('stacking', () => {
        async function openSettingsColorPicker() {
            await press(getButton('Settings'));
            await press(getLineColorButton());
        }

        it('paints the colour picker opened from the settings dialog above the dialog', async () => {
            await selectHorizontalLine();
            await openSettingsColorPicker();

            expect(follows(getOnly(COLOR_PICKER), getOnly(DIALOG))).toBe(true);
        });

        it('keeps the colour picker above the settings dialog after the dialog is reopened', async () => {
            await selectHorizontalLine();
            await openSettingsColorPicker();
            await press(getButton('Settings'));
            expect(all(DIALOG)).toHaveLength(0);
            expect(all(COLOR_PICKER)).toHaveLength(0);

            await openSettingsColorPicker();

            expect(follows(getOnly(COLOR_PICKER), getOnly(DIALOG))).toBe(true);
        });

        it('replaces the colour picker content when its button is pressed while it is open', async () => {
            await selectHorizontalLine();
            await openSettingsColorPicker();

            await press(getLineColorButton());

            expect(getOnly(COLOR_PICKER).querySelectorAll('.ag-charts-color-picker__palette')).toHaveLength(1);
            expect(follows(getOnly(COLOR_PICKER), getOnly(DIALOG))).toBe(true);
        });
    });

    describe('menus', () => {
        it('closes a menu when the same toolbar button is pressed again', async () => {
            await selectHorizontalLine();
            await press(getButton('Line Style'));
            expect(all(MENU)).toHaveLength(1);

            await press(getButton('Line Style'));

            expect(all(MENU)).toHaveLength(0);
            expect(getButton('Line Style').getAttribute('aria-expanded')).toBe('false');
        });

        it('shows only the latest menu when another menu button is pressed while one is open', async () => {
            await selectHorizontalLine();
            await press(getButton('Line Style'));

            await press(getButton('Line Stroke Width'));

            expect(all(MENU)).toHaveLength(1);
            expect(getButton('Line Style').getAttribute('aria-expanded')).toBe('false');
            expect(getButton('Line Stroke Width').getAttribute('aria-expanded')).toBe('true');
        });

        it('keeps the group button active after a tool is picked from its menu', async () => {
            chart = await createAnnotationsChart({
                ...ANNOTATIONS_EXAMPLE_OPTIONS,
                annotations: { enabled: true, toolbar: { enabled: true } },
            });
            await press(getButton('Trend Lines'));
            expect(getButton('Trend Lines').classList).toContain(ACTIVE);

            const row = all('.ag-charts-menu__row').find((r) => r.textContent === 'Horizontal Line');
            expect(row).toBeDefined();
            await press(row!);

            expect(all(MENU)).toHaveLength(0);
            expect(getButton('Trend Lines').classList).toContain(ACTIVE);
        });

        it('moves the active group button when another group menu is opened', async () => {
            chart = await createAnnotationsChart({
                ...ANNOTATIONS_EXAMPLE_OPTIONS,
                annotations: { enabled: true, toolbar: { enabled: true } },
            });
            await press(getButton('Trend Lines'));

            await press(getButton('Arrows'));

            expect(all(MENU)).toHaveLength(1);
            expect(getButton('Trend Lines').classList).not.toContain(ACTIVE);
            expect(getButton('Arrows').classList).toContain(ACTIVE);
        });
    });

    describe('menu onHide', () => {
        const items = [
            { label: 'First', value: 'first' },
            { label: 'Second', value: 'second' },
        ];

        async function createMenu() {
            chart = await createAnnotationsChart({ ...ANNOTATIONS_EXAMPLE_OPTIONS });
            const menu = new _ModuleSupport.Menu(getAnnotationsModuleContext(chart), 'test-menu');
            const controller = new ButtonWidget();
            body().append(controller.getElement());
            return { menu, controller };
        }

        it('runs once when the open menu is hidden', async () => {
            const { menu, controller } = await createMenu();
            const onHide = vi.fn();
            menu.show(controller, { items, onHide });

            menu.hide();

            expect(onHide).toHaveBeenCalledTimes(1);
            expect(menu.isVisible()).toBe(false);
            expect(all(MENU)).toHaveLength(0);
            menu.destroy();
        });

        it('runs once when the menu closes because an item was picked', async () => {
            const { menu, controller } = await createMenu();
            const onHide = vi.fn();
            const onPress = vi.fn();
            menu.show(controller, { items, onHide, onPress });

            await press(all('.ag-charts-menu__row')[1]);

            expect(onPress).toHaveBeenCalledWith(items[1], expect.anything());
            expect(onHide).toHaveBeenCalledTimes(1);
            expect(menu.isVisible()).toBe(false);
            expect(all(MENU)).toHaveLength(0);
            menu.destroy();
        });

        it('does not run when another menu replaces the open one', async () => {
            const { menu, controller } = await createMenu();
            const onHide = vi.fn();
            menu.show(controller, { items, onHide });

            menu.show(controller, { items });

            expect(onHide).not.toHaveBeenCalled();
            expect(menu.isVisible()).toBe(true);
            expect(all(MENU)).toHaveLength(1);
            menu.destroy();
        });
    });

    describe('focus', () => {
        const focused = () => document.activeElement;

        it('returns focus to the Settings button when the settings dialog closes', async () => {
            await selectHorizontalLine();
            await press(getButton('Settings'));

            await press(getOnly('.ag-charts-dialog__close-button'));

            expect(all(DIALOG)).toHaveLength(0);
            expect(focused()).toBe(getButton('Settings'));
        });

        it('focuses the colour picker palette when the picker opens from the settings dialog', async () => {
            await selectHorizontalLine();
            await press(getButton('Settings'));

            await press(getLineColorButton());

            expect(focused()).toBe(getOnly('.ag-charts-color-picker__palette'));
        });

        it('does not return focus to the colour button when the toolbar closes its colour picker', async () => {
            await selectHorizontalLine();
            await press(getButton('Line Color'));
            expect(focused()).toBe(getOnly('.ag-charts-color-picker__palette'));

            await press(getButton('Line Color'));

            expect(all(COLOR_PICKER)).toHaveLength(0);
            expect(focused()).toBe(document.body);
        });
    });
});
