import type { BBox } from '../../scene/bbox';
import { createElement } from '../../util/dom';
import { BaseProperties } from '../../util/properties';
import { FUNCTION, STRING, Validate } from '../../util/validation';
import type { AnimationManager } from '../interaction/animationManager';
import type { LocaleManager } from '../locale/localeManager';

export const DEFAULT_OVERLAY_CLASS = 'ag-chart-overlay';
export const DEFAULT_OVERLAY_DARK_CLASS = 'ag-chart-dark-overlay';

export class Overlay extends BaseProperties {
    @Validate(STRING, { optional: true })
    text?: string;

    @Validate(FUNCTION, { optional: true })
    renderer?: () => string | HTMLElement;

    private content?: HTMLElement;
    public focusBox?: { x: number; y: number; width: number; height: number };

    constructor(
        protected className: string,
        protected defaultMessageId: string
    ) {
        super();
    }

    getText(localeManager: LocaleManager) {
        return localeManager.t(this.text ?? this.defaultMessageId);
    }

    getElement(animationManager: AnimationManager | undefined, localeManager: LocaleManager, rect: BBox) {
        this.content?.remove();
        this.focusBox = rect;

        if (this.renderer) {
            const htmlContent = this.renderer();
            this.content = createElement('div');
            if (htmlContent instanceof HTMLElement) {
                this.content.replaceChildren(htmlContent);
            } else {
                this.content.innerHTML = htmlContent;
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
            content.innerText = this.getText(localeManager);
            this.content = content;

            animationManager?.animate({
                from: 0,
                to: 1,
                id: 'overlay',
                phase: 'add',
                groupId: 'opacity',
                onUpdate(value) {
                    content.style.opacity = String(value);
                },
                onStop() {
                    content.style.opacity = '1';
                },
            });
        }

        return this.content;
    }

    removeElement(cleanup = () => this.content?.remove(), animationManager?: AnimationManager) {
        if (!this.content) return;

        if (animationManager) {
            const { content } = this;
            animationManager.animate({
                from: 1,
                to: 0,
                phase: 'remove',
                id: 'overlay',
                groupId: 'opacity',
                onUpdate(value) {
                    content.style.opacity = String(value);
                },
                onStop() {
                    cleanup?.();
                },
            });
        } else {
            cleanup?.();
        }

        this.content = undefined;
        this.focusBox = undefined;
    }
}
