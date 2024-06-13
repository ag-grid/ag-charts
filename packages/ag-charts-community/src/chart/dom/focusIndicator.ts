import type { BBoxValues } from '../../util/bboxinterface';
import { getDocument } from '../../util/dom';
import type { DOMManager } from './domManager';
import * as focusStyles from './focusStyles';

export class FocusIndicator {
    private readonly element: HTMLElement;
    private readonly svg: SVGSVGElement;

    constructor(private readonly domManager: DOMManager) {
        const { css, block, elements, modifiers } = focusStyles;
        this.svg = getDocument().createElementNS('http://www.w3.org/2000/svg', 'svg');

        domManager.addStyles(block, css);
        this.element = domManager.addChild('canvas-overlay', block);
        this.element.classList.add(block, elements.indicator, modifiers.hidden);
        this.element.append(this.svg);
    }

    public destroy() {
        this.domManager.removeStyles(focusStyles.block);
        this.domManager.removeChild('canvas-overlay', focusStyles.block);
    }

    public updateBBox(rect: BBoxValues | undefined) {
        if (rect == null) {
            return this.hideSVG();
        }
        this.redrawSVG(this.createRect(rect));
    }

    private hideSVG() {
        this.element.classList.add(focusStyles.modifiers.hidden);
    }

    private redrawSVG(element: Element) {
        this.svg.innerHTML = '';
        this.element.classList.remove(focusStyles.modifiers.hidden);
        this.svg.append(element);
    }

    private createRect(bbox: BBoxValues) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', bbox.x.toString());
        rect.setAttribute('y', bbox.y.toString());
        rect.setAttribute('width', bbox.width.toString());
        rect.setAttribute('height', bbox.height.toString());
        return rect;
    }
}
