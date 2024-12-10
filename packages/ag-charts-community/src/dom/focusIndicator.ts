import { BBox } from '../scene/bbox';
import { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import { getDocument, getWindow, setElementBBox } from '../util/dom';
import type { FocusSwapChain } from './focusSwapChain';

export class FocusIndicator {
    private readonly element: HTMLElement;
    private readonly svg: SVGSVGElement;
    private readonly path: SVGPathElement;
    private readonly div: HTMLDivElement;

    constructor(private readonly swapChain: FocusSwapChain) {
        this.div = getDocument().createElement('div');
        this.svg = getDocument().createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.path = getDocument().createElementNS('http://www.w3.org/2000/svg', 'path');
        this.svg.append(this.path);

        this.element = getDocument().createElement('div');
        this.element.classList.add('ag-charts-focus-indicator');
        this.element.ariaHidden = 'true';
        this.element.append(this.svg);
        this.swapChain.addListener('swap', (parent) => this.onSwap(parent));
    }

    updateBounds(
        bounds: Path | BBox | undefined,
        clipRect?: BBox,
        // @todo(AG-13619) - The path should be relative to the canvas, not the clipRect
        fixmeTranslatePathX: number = 0,
        fixmeTranslatePathY: number = 0
    ) {
        if (bounds === undefined) {
            return;
        } else if (bounds instanceof Path) {
            const transform = (localX: number, localY: number) => {
                let { x, y } = Transformable.toCanvasPoint(bounds, localX, localY);
                x -= fixmeTranslatePathX;
                y -= fixmeTranslatePathY;
                return { x, y };
            };
            this.path.setAttribute('d', bounds.svgPathData(transform));
            this.show(this.svg);
        } else {
            if (clipRect == null) {
                setElementBBox(this.div, bounds);
            } else {
                const x0 = Math.max(bounds.x, clipRect.x);
                const y0 = Math.max(bounds.y, clipRect.y);
                const x1 = Math.min(bounds.x + bounds.width, clipRect.x + clipRect.width);
                const y1 = Math.min(bounds.y + bounds.height, clipRect.y + clipRect.height);
                setElementBBox(this.div, new BBox(x0, y0, x1 - x0, y1 - y0));
            }

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
    public isFocusVisible(): boolean {
        const parent = this.element.parentElement;
        return parent != null && getWindow().getComputedStyle(parent).opacity === '1';
    }
}
