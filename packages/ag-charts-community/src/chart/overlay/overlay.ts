import type { BBox } from '../../scene/bbox';
import { FUNCTION, STRING, Validate } from '../../util/validation';

export class Overlay {
    constructor(className: string, parent: HTMLElement, document: Document) {
        this.className = className;
        this.parentElement = parent;
        this.document = document;
    }

    @Validate(FUNCTION, { optional: true })
    renderer?: () => string;

    @Validate(STRING, { optional: true })
    text?: string = undefined;

    private className: string;
    private parentElement: HTMLElement;
    private element?: HTMLElement;
    private document: Document;

    show(rect: BBox) {
        let element = this.element;
        if (!element) {
            element = this.document.createElement('div');
            element.className = this.className;
            this.element = element;
        }

        element.style.position = 'absolute';
        element.style.left = `${rect.x}px`;
        element.style.top = `${rect.y}px`;
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;

        if (this.renderer) {
            element.innerHTML = this.renderer();
        } else {
            const content = this.document.createElement('div');
            content.style.alignItems = 'center';
            content.style.boxSizing = 'border-box';
            content.style.display = 'flex';
            content.style.justifyContent = 'center';
            content.style.margin = '8px';
            content.style.height = '100%';
            content.style.font = '12px Verdana, sans-serif';
            content.innerText = this.text ?? 'No data to display';

            element.replaceChildren(content);
        }

        this.parentElement?.append(element);
    }

    hide() {
        this.element?.remove();
        this.element = undefined;
    }
}
