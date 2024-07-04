import type { BBoxValues } from '../../util/bboxinterface';
import { createElement, createElementNS, setElementBBox } from '../../util/dom';

// This class represents text that is sized by bounds rather than font size.
// Its main purpose to tell screenreaders about the bounds & content of text scene nodes.
export class BoundedText {
    private readonly boundedContainer: HTMLDivElement;
    private readonly svgElement: SVGElement;
    private readonly textElement: SVGTextElement;

    set textContent(text: string | null) {
        this.textElement.textContent = text;

        // Set the viewBox of the SVG to match the bounding box of the text
        const bbox = this.textElement.getBBox();
        this.svgElement.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    }

    get textContent() {
        return this.textElement.textContent;
    }

    constructor() {
        this.textElement = createElementNS('http://www.w3.org/2000/svg', 'text');
        this.textElement.role = 'presentation';

        this.svgElement = createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgElement.appendChild(this.textElement);
        this.svgElement.style.width = '100%';
        this.svgElement.style.opacity = '0';
        this.svgElement.role = 'presentation';

        this.boundedContainer = createElement('div');
        this.boundedContainer.appendChild(this.svgElement);
        this.boundedContainer.role = 'presentation';
    }

    remove() {
        this.boundedContainer.remove();
    }

    getContainer(): HTMLDivElement {
        return this.boundedContainer;
    }

    updateBounds(bounds: BBoxValues) {
        setElementBBox(this.boundedContainer, bounds);
    }
}
