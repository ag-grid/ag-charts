import { Path } from '../scene/shape/path';
import { Transformable } from '../scene/transformable';
import type { BBoxValues } from '../util/bboxinterface';
import { getDocument, getWindow, setElementBBox } from '../util/dom';

export class FocusIndicator {
    private readonly element: HTMLElement;
    private readonly svg: SVGSVGElement;
    private readonly path: SVGPathElement;
    private readonly div: HTMLDivElement;

    constructor(private readonly container: HTMLElement) {
        this.div = getDocument().createElement('div');
        this.svg = getDocument().createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.path = getDocument().createElementNS('http://www.w3.org/2000/svg', 'path');
        this.svg.append(this.path);

        this.element = getDocument().createElement('div');
        this.element.classList.add('ag-charts-focus-indicator');
        this.element.ariaHidden = 'true';
        this.element.append(this.svg);
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

    move(newParent: HTMLElement) {
        if (newParent === this.element.parentElement) return;
        this.element.remove();
        newParent.appendChild(this.element);
    }

    private show(child: Element) {
        this.element.innerHTML = '';
        this.element.append(child);
    }

    // Use with caution! The focus must be visible when using the keyboard.
    overrideFocusVisible(focusVisible: boolean | undefined) {
        const opacity = { true: '1', false: '0', undefined: '' } as const;
        this.container.style.setProperty('opacity', opacity[`${focusVisible}`]);
    }

    // Get the `:focus-visible` CSS state.
    public isFocusVisible(): boolean {
        return getWindow().getComputedStyle(this.container).opacity === '1';
    }
}
