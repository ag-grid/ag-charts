import type { AgTooltipRendererResult, InteractionRange, TextWrap } from '../../options/agChartOptions';
import { createElement, getDocument, getWindow } from '../../util/dom';
import { clamp } from '../../util/number';
import { Bounds, calculatePlacement } from '../../util/placement';
import { BaseProperties } from '../../util/properties';
import { ObserveChanges } from '../../util/proxy';
import {
    BOOLEAN,
    INTERACTION_RANGE,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    STRING,
    TEXT_WRAP,
    UNION,
    Validate,
} from '../../util/validation';
import type { InteractionEvent, PointerOffsets } from '../interaction/interactionManager';

export const DEFAULT_TOOLTIP_CLASS = 'ag-chart-tooltip';
export const DEFAULT_TOOLTIP_DARK_CLASS = 'ag-chart-dark-tooltip';

type TooltipPositionType =
    | 'pointer'
    | 'node'
    | 'top'
    | 'right'
    | 'bottom'
    | 'left'
    | 'top-left'
    | 'top-right'
    | 'bottom-right'
    | 'bottom-left';

export type TooltipMeta = PointerOffsets & {
    showArrow?: boolean;
    lastPointerEvent?: PointerOffsets;
    position?: {
        type?: TooltipPositionType;
        xOffset?: number;
        yOffset?: number;
    };
    enableInteraction?: boolean;
};

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

    const contentHtml = content ? `<div class="${DEFAULT_TOOLTIP_CLASS}-content">${content}</div>` : '';

    return `${titleHtml}${contentHtml}`;
}
export class TooltipPosition extends BaseProperties {
    @Validate(
        UNION(
            [
                'pointer',
                'node',
                'top',
                'right',
                'bottom',
                'left',
                'top-left',
                'top-right',
                'bottom-right',
                'bottom-left',
            ],
            'a position type'
        )
    )
    /** The type of positioning for the tooltip. By default, the tooltip follows the pointer. */
    type: TooltipPositionType = 'pointer';

    @Validate(NUMBER)
    /** The horizontal offset in pixels for the position of the tooltip. */
    xOffset: number = 0;

    @Validate(NUMBER)
    /** The vertical offset in pixels for the position of the tooltip. */
    yOffset: number = 0;
}

export class Tooltip extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = true;

    @Validate(BOOLEAN, { optional: true })
    showArrow?: boolean;

    @ObserveChanges<Tooltip>((target, newValue, oldValue) => {
        if (newValue) {
            target.element.classList.add(newValue);
        }
        if (oldValue) {
            target.element.classList.remove(oldValue);
        }
    })
    @Validate(STRING, { optional: true })
    class?: string;

    @Validate(POSITIVE_NUMBER)
    delay: number = 0;

    @Validate(INTERACTION_RANGE)
    range: InteractionRange = 'nearest';

    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'hyphenate';

    @Validate(OBJECT)
    readonly position = new TooltipPosition();

    @Validate(BOOLEAN)
    darkTheme = false;

    private enableInteraction: boolean = false;
    private lastVisibilityChange: number = Date.now();
    private readonly wrapTypes = ['always', 'hyphenate', 'on-space', 'never'];

    private readonly element: HTMLDivElement;
    readonly root: HTMLElement;

    private showTimeout: NodeJS.Timeout | number = 0;
    private _showArrow = true;

    constructor() {
        super();

        this.element = createElement('div');
        this.element.classList.add(DEFAULT_TOOLTIP_CLASS);

        this.root = getDocument().body;
        this.root.appendChild(this.element);
    }

    destroy() {
        this.element.remove();
    }

    isVisible(): boolean {
        return !this.element.classList.contains(DEFAULT_TOOLTIP_CLASS + '-hidden');
    }

    /**
     * Shows tooltip at the given event's coordinates.
     * If the `html` parameter is missing, moves the existing tooltip to the new position.
     */
    show(canvasRect: DOMRect, meta: TooltipMeta, html?: string | null, instantly = false) {
        const { element } = this;

        if (html != null) {
            element.innerHTML = html;
        } else if (!element.innerHTML) {
            this.toggle(false);
            return;
        }

        const positionType = meta.position?.type ?? this.position.type;
        const xOffset = meta.position?.xOffset ?? 0;
        const yOffset = meta.position?.yOffset ?? 0;

        const tooltipBounds = this.getTooltipBounds({ positionType, meta, yOffset, xOffset, canvasRect });
        const windowBounds = this.getWindowSize();

        const position = calculatePlacement(
            element.clientWidth,
            element.clientHeight,
            canvasRect.width,
            canvasRect.height,
            tooltipBounds
        );

        position.x += canvasRect.x;
        position.y += canvasRect.y;

        const left = clamp(0, position.x, windowBounds.width - element.clientWidth - 1);
        const top = clamp(0, position.y, windowBounds.height - element.clientHeight);

        const constrained = left !== position.x || top !== position.y;
        const defaultShowArrow =
            (positionType === 'node' || positionType === 'pointer') && !constrained && !xOffset && !yOffset;
        const showArrow = meta.showArrow ?? this.showArrow ?? defaultShowArrow;
        this.updateShowArrow(showArrow);

        element.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;

        this.enableInteraction = meta.enableInteraction ?? false;

        if (this.delay > 0 && !instantly) {
            this.toggle(false);
            this.showTimeout = setTimeout(() => {
                this.toggle(true);
            }, this.delay);
        } else {
            this.toggle(true);
        }
    }

    private getWindowSize() {
        const { innerWidth, innerHeight } = getWindow();
        return { width: innerWidth, height: innerHeight };
    }

    toggle(visible: boolean) {
        const { classList } = this.element;
        const toggleClass = (name: string, include: boolean) =>
            classList.toggle(`${DEFAULT_TOOLTIP_CLASS}-${name}`, include);

        const wasVisible = this.isVisible();
        let timeSinceLastVisibilityChangeMs = Infinity;

        if (!visible) {
            clearTimeout(this.showTimeout);
        }

        if (wasVisible !== visible) {
            const now = Date.now();
            timeSinceLastVisibilityChangeMs = now - this.lastVisibilityChange;
            this.lastVisibilityChange = now;
        }

        // Time below which an animated move should be used.
        const animatedMoveThresholdMs = 100;
        // Time below which we should treat updates as indistinguishable to users, and we shouldn't
        // adjust the `no-animation` CSS class.
        const thrashingThresholdMs = 5;

        // No animation on first show or if tooltip is disabled for a non-trivial amount of time.
        // Don't change the `no-animation` class on fast update.
        const noAnimation = !wasVisible && visible && timeSinceLastVisibilityChangeMs > animatedMoveThresholdMs;
        if (timeSinceLastVisibilityChangeMs > thrashingThresholdMs) {
            toggleClass('no-animation', noAnimation);
        }

        toggleClass('no-interaction', !this.enableInteraction); // Prevent interaction.
        toggleClass('hidden', !visible); // Hide if not visible.
        toggleClass('arrow', this._showArrow); // Add arrow if tooltip is constrained.

        classList.toggle(DEFAULT_TOOLTIP_DARK_CLASS, this.darkTheme);

        for (const wrapType of this.wrapTypes) {
            classList.toggle(`${DEFAULT_TOOLTIP_CLASS}-wrap-${wrapType}`, wrapType === this.wrapping);
        }
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

    private getTooltipBounds({
        positionType,
        meta,
        yOffset,
        xOffset,
        canvasRect,
    }: {
        positionType: TooltipPositionType;
        meta: TooltipMeta;
        yOffset: number;
        xOffset: number;
        canvasRect: DOMRect;
    }): Bounds {
        const { clientWidth: tooltipWidth, clientHeight: tooltipHeight } = this.element;
        const bounds: Bounds = { width: tooltipWidth, height: tooltipHeight };

        switch (positionType) {
            case 'node':
            case 'pointer': {
                bounds.top = meta.offsetY + yOffset - tooltipHeight - 8;
                bounds.left = meta.offsetX + xOffset - tooltipWidth / 2;
                return bounds;
            }
            case 'top': {
                bounds.top = yOffset;
                bounds.left = canvasRect.width / 2 - tooltipWidth / 2 + xOffset;
                return bounds;
            }
            case 'right': {
                bounds.top = canvasRect.height / 2 - tooltipHeight / 2 + yOffset;
                bounds.left = canvasRect.width - tooltipWidth / 2 + xOffset;
                return bounds;
            }
            case 'left': {
                bounds.top = canvasRect.height / 2 - tooltipHeight / 2 + yOffset;
                bounds.left = xOffset;
                return bounds;
            }
            case 'bottom': {
                bounds.top = canvasRect.height - tooltipHeight + yOffset;
                bounds.left = canvasRect.width / 2 - tooltipWidth / 2 + xOffset;
                return bounds;
            }
            case 'top-left': {
                bounds.top = yOffset;
                bounds.left = xOffset;
                return bounds;
            }
            case 'top-right': {
                bounds.top = yOffset;
                bounds.left = canvasRect.width - tooltipWidth + xOffset;
                return bounds;
            }
            case 'bottom-right': {
                bounds.top = canvasRect.height - tooltipHeight + yOffset;
                bounds.left = canvasRect.width - tooltipWidth + xOffset;
                return bounds;
            }
            case 'bottom-left': {
                bounds.top = canvasRect.height - tooltipHeight + yOffset;
                bounds.left = xOffset;
                return bounds;
            }
        }
    }
}
