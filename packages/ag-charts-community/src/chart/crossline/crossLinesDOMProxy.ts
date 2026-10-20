import type { BBox, BoxBounds, ButtonWidget, DynamicContext, ListWidget } from 'ag-charts-core';
import { CleanupRegistry, Path, Transformable, createSvgElement } from 'ag-charts-core';

import type { ChartRegistry } from '../../module/moduleContext';
import type { ChartAxis } from '../chartAxis';
import type { CrossLine } from './crossLine';
import type { CrossLinesPlugin } from './crossLinesPlugin';
import { getCrossLinesPlugin } from './getCrossLinesPlugin';

const DOM_MANAGER_ID = 'cross-lines';
const FOCUS_PATH_CLASS = 'ag-charts-proxy-cross-line-focus-path';

interface ProxyEntry {
    readonly plugin: CrossLinesPlugin;
    readonly crossLine: CrossLine;
    readonly bounds: BoxBounds;
    readonly focusPath?: string;
}

/** A `Path` is outlined as drawn; any other focus region is outlined by its proxy button. */
function toCanvasFocus(focus: BBox | Path): { bounds: BoxBounds; focusPath?: string } {
    if (!(focus instanceof Path)) return { bounds: focus };

    const bounds = Transformable.toCanvas(focus, focus.path.computeBBox());
    const focusPath = focus.svgPathData((x, y) => {
        const { canvasX, canvasY } = Transformable.toCanvasPoint(focus, x, y);
        return { x: canvasX, y: canvasY };
    });
    return { bounds, focusPath };
}

/** Unlocalised placeholder text, kept in one place until a localised format is agreed. */
function getAccessibleText({ type, value, range, label }: CrossLine): string {
    const prefix = label.enabled !== false && label.text != null && label.text !== '' ? `${label.text}, ` : '';
    if (type === 'range') {
        return `${prefix}${String(range?.[0])} - ${String(range?.[1])}`;
    }
    return `${prefix}${String(value)}`;
}

/**
 * Keyboard proxies for clickable cross lines: a single roving-tabindex list across every axis, each item a
 * button bounding its cross line and label. The buttons ignore the pointer, so pointer clicks still reach the
 * series area, which hit-tests cross lines itself.
 */
export class CrossLinesDOMProxy {
    private readonly cleanup = new CleanupRegistry();
    private readonly list: ListWidget;
    private readonly buttons: ButtonWidget[] = [];
    /** Drawn beside the button they outline, as a button's text content would replace them. */
    private readonly focusPaths: (SVGSVGElement | undefined)[] = [];
    private entries: ProxyEntry[] = [];
    private dirty = true;

    constructor(
        private readonly ctx: DynamicContext<ChartRegistry>,
        private readonly getAxes: () => Iterable<ChartAxis>
    ) {
        this.list = ctx.proxyInteractionService.createProxyContainer({
            type: 'list',
            domManagerId: DOM_MANAGER_ID,
            classList: ['ag-charts-proxy-cross-lines'],
            ariaLabel: undefined,
        });
        this.list.setAriaLabel('Cross Lines');
        this.list.setBounds({ x: 0, y: 0 });

        this.cleanup.register(
            // Label placement settles after layout, so the bounds are read just before the scene renders.
            ctx.eventsHub.on('layout:complete', () => {
                this.dirty = true;
            }),
            ctx.eventsHub.on('update:pre-scene-render', () => this.update()),
            () => this.list.destroy(),
            () => ctx.domManager.removeChild('canvas-proxy', DOM_MANAGER_ID)
        );
    }

    destroy() {
        this.cleanup.flush();
    }

    private update() {
        if (!this.dirty) return;
        this.dirty = false;

        const entries: ProxyEntry[] = [];
        for (const axis of this.getAxes()) {
            const plugin = getCrossLinesPlugin(axis);
            if (!plugin?.isVisible()) continue;

            for (const crossLine of plugin.getInstances()) {
                if (!plugin.isKeyboardClickable(crossLine)) continue;

                const focus = crossLine.computeFocusBounds?.();
                if (focus != null) entries.push({ plugin, crossLine, ...toCanvasFocus(focus) });
            }
        }
        this.entries = entries;

        // Buttons are reused by index, so a focused proxy keeps focus across re-layouts.
        const { buttons } = this;
        while (buttons.length > entries.length) {
            buttons.pop()?.destroy();
        }
        this.focusPaths.length = Math.min(this.focusPaths.length, entries.length);
        while (buttons.length < entries.length) {
            buttons.push(this.createButton(buttons.length));
        }
        for (let i = 0; i < entries.length; i++) {
            const { crossLine, bounds, focusPath } = entries[i];
            buttons[i].setBounds(bounds);
            buttons[i].setTextContent(getAccessibleText(crossLine));
            this.updateFocusPath(i, bounds, focusPath);
        }
    }

    private updateFocusPath(index: number, { x, y, width, height }: BoxBounds, d: string | undefined) {
        const button = this.buttons[index];
        button.toggleClass(FOCUS_PATH_CLASS, d != null);

        let svg = this.focusPaths[index];
        if (d == null) {
            svg?.remove();
            this.focusPaths[index] = undefined;
            return;
        }
        if (svg == null) {
            svg = createSvgElement('svg');
            svg.setAttribute('aria-hidden', 'true');
            for (const className of ['ag-charts-focus-svg-outer-path', 'ag-charts-focus-svg-inner-path']) {
                const path = createSvgElement('path');
                path.classList.add(className);
                svg.append(path);
            }
            button.getElement().after(svg);
            this.focusPaths[index] = svg;
        }
        // The path is in canvas coordinates, and the button spans exactly `bounds` of the canvas.
        svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
        for (const path of Array.from(svg.children)) {
            path.setAttribute('d', d);
        }
    }

    private createButton(index: number): ButtonWidget {
        const button = this.ctx.proxyInteractionService.createProxyElement({
            type: 'button',
            textContent: '',
            parent: this.list,
        });
        // Fires for Enter and Space only: the buttons have `pointer-events: none`.
        button.addListener('click', (event) => {
            const entry = this.entries[index];
            entry?.plugin.keyboardClick(entry.crossLine, event.sourceEvent);
        });
        return button;
    }
}
