import {
    AgDocument,
    BaseProperties,
    type Bounds,
    CleanupRegistry,
    type Placement,
    Property,
    calculatePlacement,
    clamp,
    isNode,
} from 'ag-charts-core';
import type { AgTooltipAnchorTo, AgTooltipMode, AgTooltipPlacement, InteractionRange, TextWrap } from 'ag-charts-types';

import type { DOMManager } from '../../dom/domManager';
import type { LocaleManager } from '../../locale/localeManager';
import { SizeMonitor } from '../../util/sizeMonitor';
import { SpringAnimation } from './springAnimation';
import {
    DEFAULT_TOOLTIP_CLASS,
    DEFAULT_TOOLTIP_DARK_CLASS,
    type TooltipContent,
    type TooltipPaginationState,
    tooltipHtml,
} from './tooltipContent';

export {
    DEFAULT_TOOLTIP_CLASS,
    DEFAULT_TOOLTIP_DARK_CLASS,
    tooltipHtml,
    tooltipContentAriaLabel,
    isTooltipValueMissing,
    type TooltipContent,
    type TooltipPaginationState,
    type TooltipContentDataRow,
    type TooltipStructuredContent,
} from './tooltipContent';

type TooltipOffsets = { canvasX: number; canvasY: number; nodeCanvasX?: number; nodeCanvasY?: number };
export type TooltipEventType = 'pointermove' | 'click' | 'dblclick' | 'keyboard';
export type TooltipPointerEvent<T extends TooltipEventType = TooltipEventType> = Readonly<TooltipOffsets> & {
    readonly type: T;
};

export interface TooltipMetaPosition {
    anchorTo?: AgTooltipAnchorTo;
    placement?: AgTooltipPlacement | AgTooltipPlacement[];
    xOffset?: number;
    yOffset?: number;
}

export interface TooltipMeta extends TooltipOffsets {
    showArrow?: boolean;
    position?: TooltipMetaPosition;
    enableInteraction?: boolean;
}

const horizontalAlignments: Record<AgTooltipPlacement, -1 | 0 | 1> = {
    left: -1,
    'top-left': -1,
    'bottom-left': -1,
    top: 0,
    center: 0,
    bottom: 0,
    right: 1,
    'top-right': 1,
    'bottom-right': 1,
};

const verticalAlignments: Record<AgTooltipPlacement, -1 | 0 | 1> = {
    'top-left': -1,
    top: -1,
    'top-right': -1,
    left: 0,
    center: 0,
    right: 0,
    'bottom-left': 1,
    bottom: 1,
    'bottom-right': 1,
};

enum ArrowPosition {
    Left,
    Top,
    Bottom,
    Right,
}

const arrowPositions: Record<AgTooltipPlacement, ArrowPosition | undefined> = {
    left: ArrowPosition.Right,
    'top-left': undefined,
    'bottom-left': undefined,
    top: ArrowPosition.Bottom,
    center: undefined,
    bottom: ArrowPosition.Top,
    right: ArrowPosition.Left,
    'top-right': undefined,
    'bottom-right': undefined,
};

enum DirectionCheck {
    Horizontal = 0b01,
    Vertical = 0b10,
    Both = 0b11,
    None = 0b00,
}

const directionChecks: Record<AgTooltipPlacement, DirectionCheck> = {
    top: DirectionCheck.Vertical,
    bottom: DirectionCheck.Vertical,
    left: DirectionCheck.Horizontal,
    right: DirectionCheck.Horizontal,
    'top-right': DirectionCheck.Both,
    'top-left': DirectionCheck.Both,
    'bottom-right': DirectionCheck.Both,
    'bottom-left': DirectionCheck.Both,
    center: DirectionCheck.None,
};

const defaultPlacements: Record<AgTooltipAnchorTo, AgTooltipPlacement> = {
    pointer: 'top',
    node: 'top',
    chart: 'top-left',
};

export class TooltipPosition extends BaseProperties {
    @Property
    /** The horizontal offset in pixels for the position of the tooltip. */
    xOffset: number = 0;

    @Property
    /** The vertical offset in pixels for the position of the tooltip. */
    yOffset: number = 0;

    @Property
    anchorTo?: AgTooltipAnchorTo;

    @Property
    placement?: AgTooltipPlacement | AgTooltipPlacement[];
}

export class Tooltip extends BaseProperties {
    @Property
    enabled: boolean = true;

    @Property
    mode: AgTooltipMode = 'single';

    @Property
    showArrow?: boolean;

    @Property
    delay: number = 0;

    @Property
    range?: InteractionRange = undefined;

    @Property
    wrapping: TextWrap = 'hyphenate';

    @Property
    readonly position = new TooltipPosition();

    @Property
    readonly pagination = false;

    @Property
    darkTheme = false;

    /** Escape-hatch for changes in AG-11645. */
    @Property
    bounds: 'extended' | 'canvas' = 'extended';

    private readonly cleanup = new CleanupRegistry();
    private readonly springAnimation = new SpringAnimation(this.agDocument);

    private enableInteraction: boolean = false;
    private readonly wrapTypes = ['always', 'hyphenate', 'on-space', 'never'];

    private element?: HTMLElement;
    private readonly sizeMonitor: SizeMonitor;

    private interactiveLeave?: {
        callback: () => void;
        listener: (e: MouseEvent | FocusEvent) => void;
    };

    // Reading the element size is expensive, so cache the result
    private _elementSize: { width: number; height: number } | undefined = undefined;
    private _showTimeout: NodeJS.Timeout | undefined = undefined;
    private arrowPosition: ArrowPosition | undefined = undefined;
    private _visible = false;

    private positionParams:
        | {
              canvasRect: DOMRect;
              relativeRect: { x: number; y: number; width: number; height: number };
              meta: TooltipMeta;
          }
        | undefined = undefined;

    get interactive() {
        return this.enableInteraction;
    }

    constructor(private readonly agDocument: AgDocument) {
        super();

        this.sizeMonitor = new SizeMonitor(agDocument);
        this.cleanup.register(this.springAnimation.events.on('update', this.updateTooltipPosition.bind(this)));
    }

    private localeManager: LocaleManager | undefined = undefined;
    setup(localeManager: LocaleManager, domManager: DOMManager) {
        this.element = domManager.addChild('tooltip-container', DEFAULT_TOOLTIP_CLASS);
        this.element.setAttribute('popover', 'manual');
        this.element.className = DEFAULT_TOOLTIP_CLASS;
        // @ts-expect-error Typings need updating
        this.element.style.positionAnchor = domManager.anchorName;

        this.sizeMonitor.observe(this.element, (size) => {
            this._elementSize = size;
            this.updateTooltipPosition();
        });
        this.localeManager = localeManager;

        return () => {
            domManager.removeChild('tooltip-container', DEFAULT_TOOLTIP_CLASS);
            this.cleanup.flush();

            if (this.element) {
                this.sizeMonitor.unobserve(this.element);
            }
        };
    }

    isVisible(): boolean {
        return this._visible;
    }

    contains(node: Node | null): boolean {
        return this.element?.contains(node) ?? false;
    }

    private updateTooltipPosition() {
        const { element, _elementSize: elementSize, positionParams } = this;
        if (element == null || elementSize == null || positionParams == null) return;

        const { canvasRect, relativeRect, meta } = positionParams;
        const { x: canvasX, y: canvasY } = this.springAnimation;

        const anchorTo = meta.position?.anchorTo ?? 'pointer';
        let placements = meta.position?.placement ?? defaultPlacements[anchorTo];
        if (!Array.isArray(placements)) {
            placements = [placements];
        }
        const xOffset = meta.position?.xOffset ?? 0;
        const yOffset = meta.position?.yOffset ?? 0;

        const minX = relativeRect.x;
        const minY = relativeRect.y;
        const maxX = relativeRect.width - elementSize.width - 1 + minX;
        const maxY = relativeRect.height - elementSize.height + minY;

        let i = 0;
        let placement: AgTooltipPlacement | undefined;
        let position: Placement | undefined;
        let constrained = false;
        do {
            placement = placements[i];
            i += 1;

            const tooltipBounds = this.getTooltipBounds({
                elementSize,
                placement,
                anchorTo,
                canvasX,
                canvasY,
                yOffset,
                xOffset,
                canvasRect,
            });
            position = calculatePlacement(elementSize.width, elementSize.height, relativeRect, tooltipBounds);

            constrained = false;
            if (directionChecks[placement] & DirectionCheck.Horizontal) {
                constrained ||= position.x < minX || position.x > maxX;
            }
            if (directionChecks[placement] & DirectionCheck.Vertical) {
                constrained ||= position.y < minY || position.y > maxY;
            }
        } while (i < placements.length && constrained);

        const left = clamp(minX, position.x, maxX);
        const top = clamp(minY, position.y, maxY);

        constrained ||= left !== position.x || top !== position.y;
        const defaultShowArrow = anchorTo !== 'chart' && !constrained && !xOffset && !yOffset;
        const showArrow = meta.showArrow ?? this.showArrow ?? defaultShowArrow;
        this.arrowPosition = showArrow ? arrowPositions[placement] : undefined;
        this.updateClassModifiers();

        element.style.translate = `${left}px ${top}px`;
    }

    /**
     * Shows tooltip at the given event's coordinates.
     * If the `html` parameter is missing, moves the existing tooltip to the new position.
     */
    show(
        boundingRect: DOMRect,
        canvasRect: DOMRect,
        meta: TooltipMeta,
        content: TooltipContent[] | null,
        pagination?: TooltipPaginationState,
        instantly = false
    ) {
        const { element } = this;

        if (element != null && content != null && content.length !== 0) {
            const html = tooltipHtml(this.localeManager, content, this.mode, this.pagination ? pagination : undefined);
            if (html == null) {
                element.innerHTML = '';
                this.toggle(false);
                return;
            }

            element.innerHTML = html;
        } else if (element == null || element.innerHTML === '') {
            this.toggle(false);
            return;
        }

        const relativeRect = {
            x: boundingRect.x - canvasRect.x,
            y: boundingRect.y - canvasRect.y,
            width: boundingRect.width,
            height: boundingRect.height,
        };

        this.positionParams = {
            canvasRect,
            relativeRect,
            meta,
        };

        const anchorTo = meta.position?.anchorTo ?? 'pointer';
        switch (anchorTo) {
            case 'node':
                this.springAnimation.update(meta.nodeCanvasX ?? meta.canvasX, meta.nodeCanvasY ?? meta.canvasY);
                break;
            case 'pointer':
                this.springAnimation.update(meta.canvasX, meta.canvasY);
                break;
            case 'chart':
                this.springAnimation.reset();
        }

        if (meta.enableInteraction) {
            this.enableInteraction = true;
            element.style.pointerEvents = 'auto';
            element.removeAttribute('aria-hidden');
            element.tabIndex = -1; // AG-14347 Allow interactive tooltips to receive focus
        } else {
            this.enableInteraction = false;
            element.style.pointerEvents = 'none';
            element.setAttribute('aria-hidden', 'true');
            element.removeAttribute('tabindex');
        }

        element.style.setProperty('--top', `${canvasRect.top}px`);
        element.style.setProperty('--left', `${canvasRect.left}px`);
        this.updateClassModifiers();

        this.toggle(true, instantly);
    }

    hide() {
        this.toggle(false);
    }

    maybeEnterInteractiveTooltip({ relatedTarget }: FocusEvent | MouseEvent, callback: () => void): boolean {
        const { interactive, interactiveLeave, enabled, element } = this;
        if (element == null) return false;
        if (interactiveLeave) return true;

        const isEntering =
            interactive && enabled && this.isVisible() && isNode(relatedTarget) && this.contains(relatedTarget);

        // AG-14990 Add a custom listener to dismiss the tooltip when the user is done interacting with it.
        if (isEntering) {
            this.interactiveLeave = {
                callback,
                listener: (popoverEvent: FocusEvent | MouseEvent): void => {
                    const isLeaving =
                        popoverEvent.relatedTarget == null ||
                        (isNode(popoverEvent.relatedTarget) && !this.contains(popoverEvent.relatedTarget));
                    if (isLeaving) {
                        this.popInteractiveLeaveCallback();
                    }
                },
            };
            element.addEventListener('focusout', this.interactiveLeave.listener);
            element.addEventListener('mouseout', this.interactiveLeave.listener);
        }

        return isEntering;
    }

    private popInteractiveLeaveCallback() {
        const { interactiveLeave, element } = this;
        this.interactiveLeave = undefined; // prevent re-entrancy.
        if (interactiveLeave) {
            if (element) {
                element.removeEventListener('focusout', interactiveLeave.listener);
                element.removeEventListener('mouseout', interactiveLeave.listener);
            }
            interactiveLeave.callback();
        }
    }

    private toggle(visible: boolean, instantly: boolean = false) {
        const { delay } = this;

        if (visible && delay > 0 && !instantly) {
            this._showTimeout ??= setTimeout(() => {
                this._showTimeout = undefined;
                this.toggleCallback(true);
            }, delay);
        } else {
            clearTimeout(this._showTimeout);
            this._showTimeout = undefined;
            this.toggleCallback(visible);
        }
    }

    private toggleCallback(visible: boolean) {
        if (!this.element?.isConnected) return;

        // Avoid touching the DOM if invisible and visibility status hasn't changed.
        if (this._visible === visible) return;
        this._visible = visible;

        this.element.togglePopover(visible);

        if (visible) {
            // After togglePopover(true) the element is visible and measurable,
            // but the ResizeObserver may not have fired yet (especially cross-window).
            if (this._elementSize == null) {
                const { width, height } = this.element.getBoundingClientRect();
                if (width > 0 || height > 0) {
                    this._elementSize = { width, height };
                }
            }
            this.updateTooltipPosition();
        } else {
            this.springAnimation.reset();
            this.popInteractiveLeaveCallback();
        }
    }

    private updateClassModifiers() {
        if (!this.element?.isConnected) return;

        const { classList } = this.element;

        const toggleClass = (name: string, include: boolean) =>
            classList.toggle(`${DEFAULT_TOOLTIP_CLASS}--${name}`, include);

        toggleClass('no-interaction', !this.enableInteraction); // Prevent interaction.
        toggleClass('arrow-top', this.arrowPosition === ArrowPosition.Top);
        toggleClass('arrow-right', this.arrowPosition === ArrowPosition.Right);
        toggleClass('arrow-bottom', this.arrowPosition === ArrowPosition.Bottom);
        toggleClass('arrow-left', this.arrowPosition === ArrowPosition.Left);
        toggleClass('compact', this.mode === 'compact');

        classList.toggle(DEFAULT_TOOLTIP_DARK_CLASS, this.darkTheme);

        for (const wrapType of this.wrapTypes) {
            classList.toggle(`${DEFAULT_TOOLTIP_CLASS}--wrap-${wrapType}`, wrapType === this.wrapping);
        }
    }

    private getTooltipBounds(opts: {
        elementSize: { width: number; height: number };
        anchorTo: AgTooltipAnchorTo;
        placement: AgTooltipPlacement;
        canvasX: number;
        canvasY: number;
        yOffset: number;
        xOffset: number;
        canvasRect: DOMRect;
    }): Bounds {
        const { elementSize, anchorTo, placement, canvasX, canvasY, yOffset, xOffset, canvasRect } = opts;

        const { width: tooltipWidth, height: tooltipHeight } = elementSize;
        const bounds: Bounds = { width: tooltipWidth, height: tooltipHeight };

        if (anchorTo === 'node' || anchorTo === 'pointer') {
            const horizontalAlignment = horizontalAlignments[placement];
            const verticalAlignment = verticalAlignments[placement];
            bounds.top = canvasY + yOffset + (tooltipHeight * (verticalAlignment - 1)) / 2 + 8 * verticalAlignment;
            bounds.left = canvasX + xOffset + (tooltipWidth * (horizontalAlignment - 1)) / 2 + 8 * horizontalAlignment;
            return bounds;
        }

        switch (placement) {
            case 'top': {
                bounds.top = yOffset;
                bounds.left = canvasRect.width / 2 - tooltipWidth / 2 + xOffset;
                return bounds;
            }
            case 'right': {
                bounds.top = canvasRect.height / 2 - tooltipHeight / 2 + yOffset;
                bounds.left = canvasRect.width - tooltipWidth + xOffset;
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

        return bounds;
    }
}
