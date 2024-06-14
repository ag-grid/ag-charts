import { Path } from '../../scene/shape/path';
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

    destroy() {
        this.domManager.removeStyles(focusStyles.block);
        this.domManager.removeChild('canvas-overlay', focusStyles.block);
    }

    updateBounds(bounds: Path | BBoxValues | undefined) {
        if (bounds === undefined) {
            this.hide();
        } else if (bounds instanceof Path) {
            this.updatePath(bounds);
        } else {
            this.updateBBox(bounds);
        }
    }

    private updatePath(path: Path) {
        this.redrawSVG(this.createPath(path));
    }

    private updateBBox(rect: BBoxValues) {
        this.redrawSVG(this.createRect(rect));
    }

    private hide() {
        this.element.classList.add(focusStyles.modifiers.hidden);
    }

    private redrawSVG(element: Element) {
        this.svg.innerHTML = '';
        this.element.classList.remove(focusStyles.modifiers.hidden);
        this.svg.append(element);
    }

    private createPath(scenePath: Path) {
        const path = getDocument().createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', scenePath.computeSVGDataPath());
        return path;
    }

    private createRect(bbox: BBoxValues) {
        const rect = getDocument().createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', bbox.x.toString());
        rect.setAttribute('y', bbox.y.toString());
        rect.setAttribute('width', bbox.width.toString());
        rect.setAttribute('height', bbox.height.toString());
        return rect;
    }
}
