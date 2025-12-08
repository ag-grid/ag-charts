import {
    BaseProperties,
    Property,
    callWithContext,
    createElement,
    isArray,
    toPlainText,
    toTextString,
} from 'ag-charts-core';
import type { AgChartOverlayRendererParams, DatumDefault, TextOrSegments } from 'ag-charts-types';

import type { LocaleManager } from '../../locale/localeManager';
import type { BBox } from '../../scene/bbox';
import type { AnimationManager } from '../interaction/animationManager';

export const DEFAULT_OVERLAY_CLASS = 'ag-charts-overlay';
export const DEFAULT_OVERLAY_DARK_CLASS = 'ag-charts-dark-overlay';

export class Overlay extends BaseProperties {
    @Property
    enabled = true;

    @Property
    text?: TextOrSegments;

    @Property
    renderer?: (params: AgChartOverlayRendererParams<DatumDefault>) => string | HTMLElement;

    private content?: HTMLElement;
    private rendererAsText?: string;
    public focusBox?: BBox;

    constructor(
        protected className: string,
        protected defaultMessageId: string
    ) {
        super();
    }

    getText(localeManager: LocaleManager): string {
        if (isArray(this.text)) {
            return toPlainText(this.text);
        }
        if (this.rendererAsText) {
            return this.rendererAsText;
        }
        return localeManager.t(toTextString(this.text) || this.defaultMessageId);
    }

    getElement(
        callers: Parameters<typeof callWithContext>[0],
        animationManager: AnimationManager | undefined,
        localeManager: LocaleManager,
        rect: BBox
    ) {
        this.content?.remove();
        this.rendererAsText = undefined;
        this.focusBox = rect;

        if (this.renderer) {
            const params: AgChartOverlayRendererParams<DatumDefault> = {};
            const htmlContent = callWithContext(callers, this.renderer, params);

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
            this.rendererAsText = this.content?.textContent?.trim() ?? undefined;
            console.log(`"${this.rendererAsText}"`);
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
            if (isArray(this.text)) {
                const container = createElement('div');
                for (const segment of this.text) {
                    const el = createElement('span', {
                        color: segment.color,
                        fontSize: `${segment.fontSize}px`,
                        fontFamily: segment.fontFamily ?? 'inherit',
                        fontWeight: String(segment.fontWeight),
                        fontStyle: segment.fontStyle,
                    });
                    el.innerText = toTextString(segment.text);
                    container.appendChild(el);
                }
                content.appendChild(container);
            } else {
                content.innerText = this.getText(localeManager);
            }
            this.content = content;
            this.content.classList.add(this.className);

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
