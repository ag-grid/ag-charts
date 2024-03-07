import type { BBox } from '../../scene/bbox';
import { BOOLEAN, FUNCTION, STRING, Validate } from '../../util/validation';
import type { AnimationManager } from '../interaction/animationManager';

export const DEFAULT_OVERLAY_CLASS = 'ag-chart-overlay';
export const DEFAULT_OVERLAY_DARK_CLASS = 'ag-chart-dark-overlay';

export class Overlay {
    private element?: HTMLElement;

    constructor(
        private readonly className: string,
        private readonly parentElement: HTMLElement,
        private readonly animationManager: AnimationManager
    ) {}

    @Validate(FUNCTION, { optional: true })
    renderer?: () => string;

    @Validate(STRING, { optional: true })
    text?: string;

    @Validate(BOOLEAN)
    darkTheme = false;

    show(rect: BBox) {
        if (!this.element) {
            this.element = this.createElement('div');
            this.element.classList.add(this.className, DEFAULT_OVERLAY_CLASS);
        }

        this.element.classList.toggle(DEFAULT_OVERLAY_DARK_CLASS, this.darkTheme);

        const { element } = this;
        element.style.position = 'absolute';
        element.style.left = `${rect.x}px`;
        element.style.top = `${rect.y}px`;
        element.style.width = `${rect.width}px`;
        element.style.height = `${rect.height}px`;

        if (this.renderer) {
            element.innerHTML = this.renderer();
        } else {
            const content = this.createElement('div');
            content.style.alignItems = 'center';
            content.style.boxSizing = 'border-box';
            content.style.display = 'flex';
            content.style.justifyContent = 'center';
            content.style.margin = '8px';
            content.style.height = '100%';
            content.style.font = '12px Verdana, sans-serif';
            content.innerText = this.text ?? 'No data to display';

            element.replaceChildren(content);

            this.animationManager.animate({
                from: 0,
                to: 1,
                phase: 'add',
                id: 'overlay',
                groupId: 'opacity',
                onUpdate(value) {
                    element.style.opacity = String(value);
                },
                onStop() {
                    element.style.opacity = '1';
                },
            });
        }

        this.parentElement?.append(element);
    }

    hide() {
        if (!this.element) return;

        const element = this.element;
        this.animationManager.animate({
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

        this.element = undefined;
    }

    protected createElement(tagName: string, options?: ElementCreationOptions) {
        return this.parentElement.ownerDocument.createElement(tagName, options);
    }
}
