import type { BBox } from '../../scene/bbox';
import { createElement } from '../../util/dom';
import { BaseProperties } from '../../util/properties';
import { BOOLEAN, FUNCTION, STRING, Validate } from '../../util/validation';
import type { AnimationManager } from '../interaction/animationManager';

export const DEFAULT_OVERLAY_CLASS = 'ag-chart-overlay';
export const DEFAULT_OVERLAY_DARK_CLASS = 'ag-chart-dark-overlay';

export class Overlay extends BaseProperties {
    @Validate(STRING, { optional: true })
    text?: string;

    @Validate(FUNCTION, { optional: true })
    renderer?: () => string | HTMLElement;

    @Validate(BOOLEAN)
    darkTheme = false;

    private element?: HTMLElement;

    constructor(
        protected className: string,
        protected defaultText: string
    ) {
        super();
    }

    getText() {
        return this.text ?? this.defaultText;
    }

    getElement(animationManager: AnimationManager | undefined, rect: BBox) {
        this.element ??= createElement('div', DEFAULT_OVERLAY_CLASS, { position: 'absolute' });
        this.element.classList.toggle(DEFAULT_OVERLAY_DARK_CLASS, this.darkTheme);

        const element = this.element;

        element.style.left = `${rect.x}px`;
        element.style.top = `${rect.y}px`;
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;

        if (this.renderer) {
            const htmlContent = this.renderer();
            if (htmlContent instanceof HTMLElement) {
                element.replaceChildren(htmlContent);
            } else {
                element.innerHTML = htmlContent;
            }
        } else {
            const content = createElement('div', {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                height: '100%',
                margin: '8px',
                font: '12px Verdana, sans-serif',
            });
            content.innerText = this.getText();

            element.replaceChildren(content);

            animationManager?.animate({
                from: 0,
                to: 1,
                id: 'overlay',
                phase: 'add',
                groupId: 'opacity',
                onUpdate(value) {
                    element.style.opacity = String(value);
                },
                onStop() {
                    element.style.opacity = '1';
                },
            });
        }

        return this.element;
    }

    removeElement(animationManager?: AnimationManager) {
        if (!this.element) return;

        if (animationManager) {
            const { element } = this;
            animationManager.animate({
                from: 1,
                to: 0,
                phase: 'remove',
                id: 'overlay',
                groupId: 'opacity',
                onUpdate(value) {
                    element.style.opacity = String(value);
                },
                onStop() {
                    element.remove();
                },
            });
        } else {
            this.element.remove();
        }

        this.element = undefined;
    }
}
