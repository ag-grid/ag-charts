import { createElement } from 'ag-charts-core';

import type { LocaleManager } from '../../locale/localeManager';
import type { BBox } from '../../scene/bbox';
import { BaseProperties } from '../../util/properties';
import { Property } from '../../util/properties';
import type { AnimationManager } from '../interaction/animationManager';

export const DEFAULT_OVERLAY_CLASS = 'ag-charts-overlay';
export const DEFAULT_OVERLAY_DARK_CLASS = 'ag-charts-dark-overlay';

export class Overlay extends BaseProperties {
    @Property
    enabled = true;

    @Property
    text?: string;

    @Property
    renderer?: () => string | HTMLElement;

    private content?: HTMLElement;
    public focusBox?: BBox;

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
            if (htmlContent instanceof HTMLElement) {
                this.content = htmlContent;
            } else {
                const tempDiv = createElement('div');
                tempDiv.innerHTML = htmlContent;
                const { firstElementChild } = tempDiv;
                if (firstElementChild instanceof HTMLElement && tempDiv.childElementCount === 1) {
                    this.content = firstElementChild;
                } else {
                    this.content = tempDiv;
                }
            }
        } else {
            const content = createElement('div', {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                height: '100%',
                margin: '8px',
                fontFamily: 'var(--ag-charts-font-family)',
                fontSize: 'var(--ag-charts-font-size)',
                fontWeight: 'var(--ag-charts-font-weight)',
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
