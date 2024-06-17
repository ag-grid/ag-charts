import { Path } from '../../scene/shape/path';
import type { BBoxValues } from '../../util/bboxinterface';
import { getDocument, setElementBBox } from '../../util/dom';
import type { DOMManager } from './domManager';
import * as focusStyles from './focusStyles';

export class FocusIndicator {
    private readonly element: HTMLElement;
    private readonly svg: SVGSVGElement;
    private readonly path: SVGPathElement;
    private readonly div: HTMLDivElement;

    constructor(private readonly domManager: DOMManager) {
        const { css, block, elements, modifiers } = focusStyles;
        this.div = getDocument().createElement('div');
        this.svg = getDocument().createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.path = getDocument().createElementNS('http://www.w3.org/2000/svg', 'path');
        this.svg.append(this.path);

        domManager.addStyles(block, css);
        this.element = domManager.addChild('canvas-overlay', block);
        this.element.classList.add(block, elements.indicator, modifiers.hidden);
        this.element.append(this.svg);
    }

    destroy() {
        this.domManager.removeStyles(focusStyles.block);
        this.domManager.removeChild('canvas-overlay', focusStyles.block);
    }

    updateBounds(bounds: Path | BBoxValues | undefined) {
        if (bounds === undefined) {
            this.element.classList.add(focusStyles.modifiers.hidden);
        } else if (bounds instanceof Path) {
            this.path.setAttribute('d', bounds.computeSVGDataPath());
            this.show(this.svg);
        } else {
            setElementBBox(this.div, bounds);
            this.show(this.div);
        }
    }

    private show(child: Element) {
        this.element.classList.remove(focusStyles.modifiers.hidden);
        this.element.innerHTML = '';
        this.element.append(child);
    }
}
