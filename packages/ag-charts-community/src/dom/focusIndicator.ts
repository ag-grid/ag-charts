import { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import type { BBoxValues } from '../util/bboxinterface';
import { getDocument, getWindow, setElementBBox } from '../util/dom';
import type { DOMManager } from './domManager';

const FOCUS_INDICATOR_CSS_CLASS = 'ag-charts-focus-indicator';
export class FocusIndicator {
    private readonly element: HTMLElement;
    private readonly svg: SVGSVGElement;
    private readonly path: SVGPathElement;
    private readonly div: HTMLDivElement;
    private forceInvisible = false;

    constructor(private readonly domManager: DOMManager) {
        this.div = getDocument().createElement('div');
        this.svg = getDocument().createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.path = getDocument().createElementNS('http://www.w3.org/2000/svg', 'path');
        this.svg.append(this.path);

        this.element = domManager.addChild('series-area', FOCUS_INDICATOR_CSS_CLASS);
        this.element.classList.add(FOCUS_INDICATOR_CSS_CLASS);
        this.element.ariaHidden = 'true';
        this.element.append(this.svg);
    }

    destroy() {
        this.domManager.removeStyles(FOCUS_INDICATOR_CSS_CLASS);
        this.domManager.removeChild('series-area', FOCUS_INDICATOR_CSS_CLASS);
    }

    updateBounds(bounds: Path | BBoxValues | undefined) {
        if (bounds === undefined) {
            // skip
        } else if (bounds instanceof Path) {
            const transform = (x: number, y: number) => Transformable.toCanvasPoint(bounds, x, y);
            this.path.setAttribute('d', bounds.svgPathData(transform));
            this.show(this.svg);
        } else {
            setElementBBox(this.div, bounds);
            this.show(this.div);
        }
    }

    private show(child: Element) {
        this.element.innerHTML = '';
        this.element.append(child);
    }

    // Use with caution! The focus must be visible when using the keyboard.
    toggleForceInvisible(force: boolean) {
        this.forceInvisible = force;
        this.element.classList.toggle(`ag-charts-focus-indicator__force_invisible`, force);
    }

    // Get the `:focus-visible` CSS state.
    public isFocusVisible(): boolean {
        const parent = this.element.parentElement;
        return !this.forceInvisible && parent != null && getWindow().getComputedStyle(parent).opacity === '1';
    }
}
