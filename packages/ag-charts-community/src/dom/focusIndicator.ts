import { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import type { BBoxValues } from '../util/bboxinterface';
import { getDocument, setElementBBox } from '../util/dom';
import type { MenuDevice } from '../util/keynavUtil';
import type { DOMManager } from './domManager';
import * as focusStyles from './focusStyles';

function getLastFocus(sourceEvent: Event): HTMLElement | undefined {
    // We need to guess whether the event comes the mouse or keyboard, which isn't an obvious task because
    // the event.sourceEvent instances are mostly indistinguishable.
    //
    // However, when right-clicking with the mouse, the target element will the
    // <div class="ag-charts-canvas-overlay"> element. But when the contextmenu is requested using the
    // keyboard, then the target should be an element with the tabindex attribute set. So that's what we'll
    // use to determine the device that triggered the contextmenu event.
    if (sourceEvent.target instanceof HTMLElement && 'tabindex' in sourceEvent.target.attributes) {
        return sourceEvent.target;
    }
    return undefined;
}

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
        this.domManager.removeChild('canvas-overlay', focusStyles.block);
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

    public guessDevice(event: Event): MenuDevice {
        const lastFocus = getLastFocus(event);
        if (lastFocus !== undefined) {
            const style = getComputedStyle(lastFocus);
            if (this.isFocusVisible() || (style.outlineStyle !== 'none' && style.outlineWidth !== '0px')) {
                return { type: 'keyboard', lastFocus };
            }
        }
        return { type: 'mouse', lastFocus };
    }
}
