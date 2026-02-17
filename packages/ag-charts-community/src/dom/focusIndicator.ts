import { createElement, createSvgElement, setElementBBox } from 'ag-charts-core';

import { BBox } from '../scene/bbox';
import { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import type { FocusSwapChain } from './focusSwapChain';

export class FocusIndicator {
    private readonly element: HTMLElement;
    private readonly svg: SVGSVGElement;
    private readonly outerPath: SVGPathElement;
    private readonly innerPath: SVGPathElement;
    private readonly div: HTMLDivElement;
    private hasBeenActivated = false;

    constructor(private readonly swapChain: FocusSwapChain) {
        this.div = createElement('div');
        this.svg = createSvgElement('svg');
        this.outerPath = createSvgElement('path');
        this.innerPath = createSvgElement('path');
        this.svg.append(this.outerPath);
        this.svg.append(this.innerPath);
        this.outerPath.classList.add('ag-charts-focus-svg-outer-path');
        this.innerPath.classList.add('ag-charts-focus-svg-inner-path');

        this.element = createElement('div', 'ag-charts-focus-indicator');
        this.element.ariaHidden = 'true';
        this.element.append(this.svg);
        this.swapChain.addListener('swap', (parent) => this.onSwap(parent));
    }

    public clear() {
        // placeholder
    }

    public update(focus: BBox | Path, rect: BBox | undefined, clip: boolean) {
        if (rect == null) return;

        if (focus instanceof Path) {
            const transform = (localX: number, localY: number) => {
                let { x, y } = Transformable.toCanvasPoint(focus, localX, localY);
                x -= rect.x ?? 0;
                y -= rect.y ?? 0;
                return { x, y };
            };
            const d = focus.svgPathData(transform);
            this.outerPath.setAttribute('d', d);
            this.innerPath.setAttribute('d', d);
            this.show(this.svg);
        } else {
            let bbox: BBox;
            if (clip) {
                const x0 = Math.max(focus.x - rect.x, 0);
                const y0 = Math.max(focus.y - rect.y, 0);
                const x1 = Math.min(focus.x + focus.width - rect.x, rect.width);
                const y1 = Math.min(focus.y + focus.height - rect.y, rect.height);
                bbox = new BBox(x0, y0, x1 - x0, y1 - y0);
            } else {
                bbox = new BBox(focus.x - rect.x, focus.y - rect.y, focus.width, focus.height);
            }

            setElementBBox(this.div, bbox);
            this.show(this.div);
        }
    }

    private onSwap(newParent: HTMLElement) {
        if (newParent === this.element.parentElement) return;
        this.element.remove();
        newParent.appendChild(this.element);
        this.overrideFocusVisible(this.focusVisible);
    }

    private show(child: Element) {
        this.hasBeenActivated = true;
        this.element.innerHTML = '';
        this.element.append(child);
    }

    // Use with caution! The focus must be visible when using the keyboard.
    private focusVisible?: boolean;
    overrideFocusVisible(focusVisible: boolean | undefined) {
        this.focusVisible = focusVisible;
        const opacity = { true: '1', false: '0', undefined: '' } as const;
        const parent = this.element.parentElement;
        parent?.style.setProperty('opacity', opacity[`${focusVisible}`]);
    }

    // Get the `:focus-visible` CSS state.
    public isFocusVisible(force = false): boolean {
        // Short-circuit from an expensive call to `getComputedStyle()` if focus has
        // never been activated.
        if (!force && !this.hasBeenActivated) return false;

        const parent = this.element.parentElement;
        const elWin = this.element.ownerDocument.defaultView!;
        return parent != null && elWin.getComputedStyle(parent).opacity === '1';
    }
}
