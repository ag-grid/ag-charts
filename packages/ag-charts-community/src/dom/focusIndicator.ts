import { createElement, createSvgElement, setElementBBox } from 'ag-charts-core';

import { BBox } from '../scene/bbox';
import { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import type { FocusOptionsExperimental } from './focusOptions';
import type { FocusSwapChain } from './focusSwapChain';

export class FocusIndicator {
    private readonly element: HTMLElement;
    private readonly svg: SVGSVGElement;
    private readonly outerPath: SVGPathElement;
    private readonly innerPath: SVGPathElement;
    private readonly div: HTMLDivElement;

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
    }

    private show(child: Element) {
        this.element.innerHTML = '';
        this.element.append(child);
    }

    // The desired `:focus-visible` state, which the browser applies via `focus({ focusVisible })`.
    // `undefined` means "waiting for the first focus-frame": defer to the browser's own decision.
    private focusVisible?: boolean;
    private hasFocus: boolean = false;

    public focus(opts: FocusOptionsExperimental) {
        if (this.hasFocus) return;
        this.focusVisible = opts.focusVisible;
        if (opts.focusVisible !== undefined) {
            // Visibility is explicit, so onFocus() doesn't need to read the browser's `:focus-visible`.
            this.hasFocus = true;
        }
        this.swapChain.focus(opts);
    }

    setDesiredFocusVisible(focusVisible: boolean | undefined) {
        this.focusVisible = focusVisible;
        if (this.hasFocus && focusVisible !== undefined) {
            // Re-focus the already-focused announcer to update `:focus-visible` without re-announcing.
            this.swapChain.focus({ focusVisible });
        }
    }

    public isFocusVisible(): boolean {
        return this.focusVisible ?? false;
    }

    public onFocus(): boolean {
        if (this.hasFocus) return this.focusVisible ?? false;
        this.hasFocus = true;
        if (this.focusVisible === undefined) {
            const parent = this.element.parentElement;
            const elWin = this.element.ownerDocument.defaultView!;
            // !!!SLOW!!! Read the browser's `:focus-visible` decision once, on the first focus-frame.
            this.focusVisible = parent != null && elWin.getComputedStyle(parent).opacity === '1';
        }
        // Re-assert the visibility so subsequent announcer swaps keep the indicator stable.
        this.swapChain.focus({ focusVisible: this.focusVisible });
        return this.focusVisible;
    }

    public onBlur(): void {
        this.focusVisible = undefined;
        this.hasFocus = false;
    }
}
