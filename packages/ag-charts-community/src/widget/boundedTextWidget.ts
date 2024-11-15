import { createElementNS, getDocument } from '../util/dom';
import { Widget } from '../widget/widget';

// This class represents text that is sized by bounds rather than font size.
// Its main purpose to tell screenreaders about the bounds & content of text scene nodes.
export class BoundedTextWidget extends Widget<HTMLDivElement> {
    private readonly svgElement: SVGElement;
    private readonly textElement: SVGTextElement;

    set textContent(text: string | null) {
        this.textElement.textContent = text;

        // Set the viewBox of the SVG to match the bounding box of the text
        // Note: our SVG mocks do not implement getBBox(), so ignore bounds in tests.
        const bboxCalculator: { getBBox?: () => DOMRect } = this.textElement;
        const bbox = bboxCalculator.getBBox?.();
        if (bbox) {
            this.svgElement.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
        }
    }

    get textContent() {
        return this.textElement.textContent;
    }

    constructor() {
        super(getDocument().createElement('div'));
        this.textElement = createElementNS('http://www.w3.org/2000/svg', 'text');
        this.textElement.role = 'presentation';

        this.svgElement = createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgElement.appendChild(this.textElement);
        this.svgElement.style.width = '100%';
        this.svgElement.style.opacity = '0';
        this.svgElement.role = 'presentation';

        this.elem.appendChild(this.svgElement);
        this.elem.role = 'presentation';
    }

    protected override destructor() {
        // Nothing to destroy.
    }
}
