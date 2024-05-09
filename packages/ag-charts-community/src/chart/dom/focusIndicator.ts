import { setElementBBox } from '../../module-support';
import type { DOMManager } from './domManager';
import * as focusStyles from './focusStyles';

export class FocusIndicator {
    private readonly element: HTMLElement;

    constructor(private readonly domManager: DOMManager) {
        const { css, block, elements, modifiers } = focusStyles;
        domManager.addStyles(block, css);
        this.element = domManager.addChild('canvas-overlay', block);
        this.element.classList.add(block, elements.indicator, modifiers.hidden);
    }

    public destroy() {
        this.domManager.removeStyles(focusStyles.block);
        this.domManager.removeChild('canvas-overlay', focusStyles.block);
    }

    public updateBBox(rect?: { x: number; y: number; width: number; height: number }) {
        if (rect == null) {
            this.element.classList.add(focusStyles.modifiers.hidden);
            return;
        }

        this.element.classList.remove(focusStyles.modifiers.hidden);
        setElementBBox(this.element, rect);
    }
}
