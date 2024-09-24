import { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import type { BBoxValues } from '../util/bboxinterface';
import { getDocument, setElementBBox } from '../util/dom';
import type { DOMManager } from './domManager';
import * as focusStyles from './focusStyles';

export class FocusIndicator {
    private readonly element: HTMLElement;
    private readonly svg: SVGSVGElement;
    private readonly path: SVGPathElement;
    private readonly div: HTMLDivElement;

    constructor(private readonly domManager: DOMManager) {
        const { block, elements } = focusStyles;
        this.div = getDocument().createElement('div');
        this.svg = getDocument().createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.path = getDocument().createElementNS('http://www.w3.org/2000/svg', 'path');
        this.svg.append(this.path);

        this.element = domManager.addChild('canvas-proxy', block);
        this.element.classList.add(block, elements.indicator);
        this.element.ariaHidden = 'true';
        this.element.append(this.svg);
    }

    destroy() {
        this.domManager.removeStyles(focusStyles.block);
        this.domManager.removeChild('canvas-proxy', focusStyles.block);
    }

    updateBounds(bounds: Path | BBoxValues | undefined) {
        if (bounds === undefined) {
            // skip
        } else if (bounds instanceof Path) {
            const transform = (x: number, y: number) => Transformable.toCanvasPoint(bounds, x, y);
            this.path.setAttribute('d', bounds.computeSVGDataPath(transform));
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

    // Get the `:focus-visible` CSS state.
    public isFocusVisible(): boolean {
        const focusableParent = this.element.parentElement;
        return focusableParent != null && getComputedStyle(focusableParent).opacity === '1';
    }
}
