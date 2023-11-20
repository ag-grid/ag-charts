import type { AgTooltipRendererResult, InteractionRange } from '../../options/agChartOptions';
import { BBox } from '../../scene/bbox';
import { injectStyle } from '../../util/dom';
import {
    BOOLEAN,
    INTERACTION_RANGE,
    NUMBER,
    OPT_BOOLEAN,
    OPT_STRING,
    Validate,
    predicateWithMessage,
} from '../../util/validation';
import type { InteractionEvent } from '../interaction/interactionManager';

const DEFAULT_TOOLTIP_CLASS = 'ag-chart-tooltip';
const DEFAULT_TOOLTIP_DARK_CLASS = 'ag-chart-dark-tooltip';

const defaultTooltipCss = `
.${DEFAULT_TOOLTIP_CLASS} {
    transition: transform 0.1s ease;
    display: table;
    position: fixed;
    left: 0px;
    top: 0px;
    white-space: nowrap;
    z-index: 99999;
    font: 12px Verdana, sans-serif;
    color: rgb(70, 70, 70);
    background: white;
    border-radius: 2px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.${DEFAULT_TOOLTIP_CLASS}-no-interaction {
    pointer-events: none;
    user-select: none;
}

.${DEFAULT_TOOLTIP_CLASS}-no-animation {
    transition: none !important;
}

.${DEFAULT_TOOLTIP_CLASS}-hidden {
    visibility: hidden;
}

.${DEFAULT_TOOLTIP_CLASS}-title {
    padding: 8px 14px;
    border-top-left-radius: 2px;
    border-top-right-radius: 2px;
    color: white;
    background-color: #888888;
}

.${DEFAULT_TOOLTIP_CLASS}-content {
    padding: 6px 14px;
    line-height: 1.7em;
    border-bottom-left-radius: 2px;
    border-bottom-right-radius: 2px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    overflow: hidden;
}

.${DEFAULT_TOOLTIP_CLASS}-content:empty {
    padding: 0;
    height: 7px;
}

.${DEFAULT_TOOLTIP_CLASS}-arrow::before {
    content: "";

    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);

    border: 5px solid #d9d9d9;

    border-left-color: transparent;
    border-right-color: transparent;
    border-bottom-color: transparent;

    width: 0;
    height: 0;

    margin: 0 auto;
}

.${DEFAULT_TOOLTIP_CLASS}-arrow::after {
    content: "";

    position: absolute;
    top: calc(100% - 1px);
    left: 50%;
    transform: translateX(-50%);

    border: 5px solid white;

    border-left-color: transparent;
    border-right-color: transparent;
    border-bottom-color: transparent;

    width: 0;
    height: 0;

    margin: 0 auto;
}

.${DEFAULT_TOOLTIP_CLASS}.${DEFAULT_TOOLTIP_DARK_CLASS} {
    color: white;
    background: #15181c;
}

.${DEFAULT_TOOLTIP_CLASS}.${DEFAULT_TOOLTIP_DARK_CLASS} .${DEFAULT_TOOLTIP_CLASS}-content {
    border-color: rgba(255, 255, 255, 0.15);
}

.ag-chart-wrapper {
    box-sizing: border-box;
    overflow: hidden;
}
`;

export interface TooltipMeta {
    pageX: number;
    pageY: number;
    offsetX: number;
    offsetY: number;
    showArrow?: boolean;
    position?: {
        xOffset?: number;
        yOffset?: number;
    };
    enableInteraction?: boolean;
    event: Event | InteractionEvent<any>;
}

export function toTooltipHtml(input: string | AgTooltipRendererResult, defaults?: AgTooltipRendererResult): string {
    if (typeof input === 'string') {
        return input;
    }

    const {
        content = defaults?.content ?? '',
        title = defaults?.title,
        color = defaults?.color ?? 'white',
        backgroundColor = defaults?.backgroundColor ?? '#888',
    } = input;

    const titleHtml = title
        ? `<div class="${DEFAULT_TOOLTIP_CLASS}-title"
        style="color: ${color}; background-color: ${backgroundColor}">${title}</div>`
        : '';

    return `${titleHtml}<div class="${DEFAULT_TOOLTIP_CLASS}-content">${content}</div>`;
}

const POSITION_TYPES = ['pointer', 'node'];
const POSITION_TYPE = predicateWithMessage(
    (v: any) => POSITION_TYPES.includes(v),
    `expecting a position type keyword such as 'pointer' or 'node'`
);

type TooltipPositionType = 'pointer' | 'node';

export class TooltipPosition {
    @Validate(POSITION_TYPE)
    /** The type of positioning for the tooltip. By default, the tooltip follows the pointer. */
    type: TooltipPositionType = 'pointer';

    @Validate(NUMBER())
    /** The horizontal offset in pixels for the position of the tooltip. */
    xOffset: number = 0;

    @Validate(NUMBER())
    /** The vertical offset in pixels for the position of the tooltip. */
    yOffset: number = 0;
}

export class Tooltip {
    private static tooltipDocuments: Document[] = [];

    private readonly element: HTMLDivElement;

    private readonly observer?: IntersectionObserver;
    private readonly canvasElement: HTMLElement;
    private readonly tooltipRoot: HTMLElement;

    private enableInteraction: boolean = false;

    @Validate(BOOLEAN)
    enabled: boolean = true;

    @Validate(OPT_BOOLEAN)
    showArrow?: boolean = undefined;

    @Validate(OPT_STRING)
    class?: string = undefined;
    lastClass?: string = undefined;

    @Validate(NUMBER(0))
    delay: number = 0;

    @Validate(INTERACTION_RANGE)
    range: InteractionRange = 'nearest';

    private lastVisibilityChange: number = Date.now();

    readonly position: TooltipPosition = new TooltipPosition();
    private readonly window: Window;

    constructor(canvasElement: HTMLCanvasElement, document: Document, window: Window, container: HTMLElement) {
        this.tooltipRoot = container;
        this.window = window;
        const element = document.createElement('div');
        this.element = this.tooltipRoot.appendChild(element);
        this.element.classList.add(DEFAULT_TOOLTIP_CLASS);
        this.canvasElement = canvasElement;

        // Detect when the chart becomes invisible and hide the tooltip as well.
        if (typeof IntersectionObserver !== 'undefined') {
            const observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (entry.target === this.canvasElement && entry.intersectionRatio === 0) {
                            this.toggle(false);
                        }
                    }
                },
                { root: this.tooltipRoot }
            );
            observer.observe(this.canvasElement);
            this.observer = observer;
        }

        if (Tooltip.tooltipDocuments.indexOf(document) < 0) {
            injectStyle(document, defaultTooltipCss);
            Tooltip.tooltipDocuments.push(document);
        }
    }

    destroy() {
        const { parentNode } = this.element;
        if (parentNode) {
            parentNode.removeChild(this.element);
        }

        if (this.observer) {
            this.observer.unobserve(this.canvasElement);
        }
    }

    isVisible(): boolean {
        const { element } = this;

        return !element.classList.contains(DEFAULT_TOOLTIP_CLASS + '-hidden');
    }

    private updateClass(visible?: boolean, showArrow?: boolean) {
        const { element, class: newClass, lastClass, enableInteraction, lastVisibilityChange } = this;

        const wasVisible = this.isVisible();
        const nowVisible = !!visible;
        let timeSinceLastVisibilityChangeMs = Infinity;

        if (wasVisible !== nowVisible) {
            const now = Date.now();
            timeSinceLastVisibilityChangeMs = now - lastVisibilityChange;
            this.lastVisibilityChange = now;
        }

        const toggleClass = (name: string, include: boolean) => {
            const className = `${DEFAULT_TOOLTIP_CLASS}-${name}`;
            if (include) {
                element.classList.add(className);
            } else {
                element.classList.remove(className);
            }
        };

        // Time below which an animated move should be used.
        const animatedMoveThresholdMs = 100;
        // Time below which we should treat updates as indistinguishable to users, and we shouldn't
        // adjust the `no-animation` CSS class.
        const thrashingThresholdMs = 5;

        // No animation on first show or if tooltip is disabled for a non-trivial amount of time.
        // Don't change the `no-animation` class on fast update.
        const noAnimation = !wasVisible && nowVisible && timeSinceLastVisibilityChangeMs > animatedMoveThresholdMs;
        if (timeSinceLastVisibilityChangeMs > thrashingThresholdMs) {
            toggleClass('no-animation', noAnimation);
        }
        toggleClass('no-interaction', !enableInteraction); // Prevent interaction.
        toggleClass('hidden', !visible); // Hide if not visible.
        toggleClass('arrow', !!showArrow); // Add arrow if tooltip is constrained.

        if (newClass !== lastClass) {
            if (lastClass) {
                element.classList.remove(lastClass);
            }
            if (newClass) {
                element.classList.add(newClass);
            }
            this.lastClass = newClass;
        }
    }

    private showTimeout: number = 0;
    private _showArrow = true;
    /**
     * Shows tooltip at the given event's coordinates.
     * If the `html` parameter is missing, moves the existing tooltip to the new position.
     */
    show(meta: TooltipMeta, html?: string, instantly = false) {
        const { element, canvasElement } = this;

        if (html !== undefined) {
            element.innerHTML = html;
        } else if (!element.innerHTML) {
            this.toggle(false);
            return;
        }

        const limit = (low: number, actual: number, high: number) => {
            return Math.max(Math.min(actual, high), low);
        };

        const xOffset = meta.position?.xOffset ?? 0;
        const yOffset = meta.position?.yOffset ?? 0;
        const canvasRect = canvasElement.getBoundingClientRect();
        const naiveLeft = canvasRect.left + meta.offsetX - element.clientWidth / 2 + xOffset;
        const naiveTop = canvasRect.top + meta.offsetY - element.clientHeight - 8 + yOffset;

        const windowBounds = this.getWindowBoundingBox();
        const maxLeft = windowBounds.x + windowBounds.width - element.clientWidth - 1;
        const maxTop = windowBounds.y + windowBounds.height - element.clientHeight;

        const left = limit(windowBounds.x, naiveLeft, maxLeft);
        const top = limit(windowBounds.y, naiveTop, maxTop);

        const constrained = left !== naiveLeft || top !== naiveTop;
        const defaultShowArrow = !constrained && !xOffset && !yOffset;
        const showArrow = meta.showArrow ?? this.showArrow ?? defaultShowArrow;
        this.updateShowArrow(showArrow);
        element.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;

        this.enableInteraction = meta.enableInteraction ?? false;

        if (this.delay > 0 && !instantly) {
            this.toggle(false);
            this.showTimeout = this.window.setTimeout(() => {
                this.toggle(true);
            }, this.delay);
            return;
        }

        this.toggle(true);
    }

    private getWindowBoundingBox(): BBox {
        return new BBox(0, 0, this.window.innerWidth, this.window.innerHeight);
    }

    toggle(visible?: boolean) {
        if (!visible) {
            this.window.clearTimeout(this.showTimeout);
        }
        this.updateClass(visible, this._showArrow);
    }

    pointerLeftOntoTooltip(event: InteractionEvent<'leave'>): boolean {
        if (!this.enableInteraction) return false;

        const classList = ((event.sourceEvent as MouseEvent).relatedTarget as any)?.classList as DOMTokenList;
        const classes = ['', '-title', '-content'];
        const classListContains = Boolean(classes.filter((c) => classList?.contains(`${DEFAULT_TOOLTIP_CLASS}${c}`)));

        return classList !== undefined && classListContains;
    }

    private updateShowArrow(show: boolean) {
        this._showArrow = show;
    }
}
