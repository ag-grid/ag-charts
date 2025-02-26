import type { AgTooltipAnchorTo, AgTooltipMode, AgTooltipPlacement, InteractionRange, TextWrap } from 'ag-charts-types';

import { getWindow } from '../../core';
import type { DOMManager } from '../../dom/domManager';
import type { LocaleManager } from '../../locale/localeManager';
import { clamp } from '../../util/number';
import { type Bounds, type Placement, calculatePlacement } from '../../util/placement';
import { BaseProperties } from '../../util/properties';
import {
    ARRAY_OF,
    BOOLEAN,
    INTERACTION_RANGE,
    NUMBER,
    OBJECT,
    OR,
    POSITIVE_NUMBER,
    TEXT_WRAP,
    UNION,
    Validate,
} from '../../util/validation';
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
    type TooltipContent,
    type TooltipPaginationState,
    type TooltipContentDataRow,
    type TooltipStructuredContent,
} from './tooltipContent';

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

type TooltipOffsets = { canvasX: number; canvasY: number; nodeCanvasX?: number; nodeCanvasY?: number };
export type TooltipEventType = 'pointermove' | 'click' | 'dblclick' | 'keyboard';
export type TooltipPointerEvent<T extends TooltipEventType = TooltipEventType> = Readonly<TooltipOffsets> & {
    readonly type: T;
};

export interface TooltipMetaPosition {
    anchorTo?: AgTooltipAnchorTo;
    defaultAnchorTo?: AgTooltipAnchorTo;
    placement?: AgTooltipPlacement | AgTooltipPlacement[];
    defaultPlacement?: AgTooltipPlacement | AgTooltipPlacement[];
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

const TOOLTIP_MODE = UNION(['single', 'shared', 'compact']);

const POSITION_TYPE = UNION(
    ['pointer', 'node', 'top', 'right', 'bottom', 'left', 'top-left', 'top-right', 'bottom-right', 'bottom-left'],
    'a position type'
);

const ANCHOR_TO = UNION(['pointer', 'node', 'chart'], 'an anchorTo');

const PLACEMENT_UNION = UNION(
    ['top', 'right', 'bottom', 'left', 'top-right', 'bottom-right', 'bottom-left', 'top-left', 'center'],
    'a placement'
);
const PLACEMENT = OR(PLACEMENT_UNION, ARRAY_OF(PLACEMENT_UNION));

export class TooltipPosition extends BaseProperties {
    /**
     * @todo(AG-10870) - this should never be undefined, but there's something odd going on with
     * theming that doesn't look so easy to fix. This property will be removed in the next major,
     * so for now we'll just work around. It's marked as protected no code outside of this class
     * can use it, and all code will use the newer `placement` and `anchorTo` properties, which
     * derive their defaults from this property. Eventually those properties will be set via the
     * theme, and we'll make sure they are applied normally.
     */
    @Validate(POSITION_TYPE, { optional: true })
    /** The type of positioning for the tooltip. By default, the tooltip follows the pointer. */
    protected type?: TooltipPositionType;

    @Validate(NUMBER)
    /** The horizontal offset in pixels for the position of the tooltip. */
    xOffset: number = 0;

    @Validate(NUMBER)
    /** The vertical offset in pixels for the position of the tooltip. */
    yOffset: number = 0;

    @Validate(ANCHOR_TO, { optional: true })
    anchorTo?: AgTooltipAnchorTo;

    @Validate(PLACEMENT, { optional: true })
    placement?: AgTooltipPlacement | AgTooltipPlacement[];

    get defaultAnchorTo(): AgTooltipAnchorTo {
        const { type = 'pointer' } = this;
        if (type === 'node' || type === 'pointer') {
            return type;
        } else {
            return 'chart';
        }
    }

    get defaultPlacement(): AgTooltipPlacement {
        const { type = 'pointer' } = this;
        if (type === 'node' || type === 'pointer') {
            return 'top';
        } else {
            return type;
        }
    }
}

class TooltipPagination extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = false;
}

export class Tooltip extends BaseProperties {
    @Validate(BOOLEAN)
    enabled: boolean = true;

    @Validate(TOOLTIP_MODE)
    mode: AgTooltipMode = 'single';

    @Validate(BOOLEAN, { optional: true })
    showArrow?: boolean;

    @Validate(POSITIVE_NUMBER)
    delay: number = 0;

    @Validate(INTERACTION_RANGE, { optional: true })
    range?: InteractionRange = undefined;

    @Validate(TEXT_WRAP)
    wrapping: TextWrap = 'hyphenate';

    @Validate(OBJECT)
    readonly position = new TooltipPosition();

    @Validate(OBJECT)
    readonly pagination = new TooltipPagination();

    @Validate(BOOLEAN)
    darkTheme = false;

    /** Escape-hatch for changes in AG-11645. */
    @Validate(UNION(['extended', 'canvas']))
    bounds: 'extended' | 'canvas' = 'extended';

    private readonly destroyFns: Array<() => void> = [];
    private readonly springAnimation = new SpringAnimation();

    private enableInteraction: boolean = false;
    private readonly wrapTypes = ['always', 'hyphenate', 'on-space', 'never'];

    private element?: HTMLElement;

    // Reading the element size is expensive, so cache the result
    private _elementSize: { width: number; height: number } | undefined = undefined;
    private _showTimeout: NodeJS.Timeout | number = 0;
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

    constructor() {
        super();

        this.destroyFns.push(this.springAnimation.addListener('update', this.updateTooltipPosition.bind(this)));
    }

    private localeManager: LocaleManager | undefined = undefined;
    setup(localeManager: LocaleManager, domManager: DOMManager) {
        if ('togglePopover' in getWindow<any>().HTMLElement.prototype) {
            this.element = domManager.addChild('canvas-overlay', DEFAULT_TOOLTIP_CLASS);
            this.element.setAttribute('popover', 'manual');
            this.element.className = DEFAULT_TOOLTIP_CLASS;
            // @ts-expect-error Typings need updating
            this.element.style.positionAnchor = domManager.anchorName;
        }
        this.localeManager = localeManager;

        return () => {
            domManager.removeChild('canvas-overlay', DEFAULT_TOOLTIP_CLASS);
            this.destroyFns.forEach((f) => f());
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

        let placements =
            meta.position?.placement ??
            this.position.placement ??
            meta.position?.defaultPlacement ??
            this.position.defaultPlacement;
        if (!Array.isArray(placements)) {
            placements = [placements];
        }
        const anchorTo =
            meta.position?.anchorTo ??
            this.position.anchorTo ??
            meta.position?.defaultAnchorTo ??
            this.position.defaultAnchorTo;
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
            const html = tooltipHtml(
                this.localeManager,
                content,
                this.mode,
                this.pagination.enabled ? pagination : undefined
            );
            if (html == null) {
                this.toggle(false);
                return;
            }

            element.innerHTML = html;
            this._elementSize = { width: element.clientWidth, height: element.clientHeight };
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

        const anchorTo =
            meta.position?.anchorTo ??
            this.position.anchorTo ??
            meta.position?.defaultAnchorTo ??
            this.position.defaultAnchorTo;
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
        } else {
            this.enableInteraction = false;
            element.style.pointerEvents = 'none';
            element.setAttribute('aria-hidden', 'true');
        }

        element.style.setProperty('--top', `${canvasRect.top}px`);
        element.style.setProperty('--left', `${canvasRect.left}px`);
        this.updateClassModifiers();

        if (this.delay > 0 && !instantly) {
            this.toggle(false);
            this._showTimeout = setTimeout(() => {
                this.toggle(true);
            }, this.delay);
        } else {
            this.toggle(true);
        }
    }

    hide() {
        this.toggle(false);
    }

    private toggle(visible: boolean) {
        if (!this.element?.isConnected) return;

        // Avoid touching the DOM if invisible and visibility status hasn't changed.
        if (!this._visible && !visible) return;

        const changed = this._visible !== visible;
        this._visible = visible;

        if (!visible) {
            this.springAnimation.reset();
            clearTimeout(this._showTimeout);
        }

        if (changed) {
            this.element.togglePopover(visible);
        }

        if (visible) {
            // We can only measure the element when it's actually visible
            // This removes a possible jump for the tooltip
            this.updateTooltipPosition();
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
        anchorTo: AgTooltipAnchorTo;
        placement: AgTooltipPlacement;
        canvasX: number;
        canvasY: number;
        yOffset: number;
        xOffset: number;
        canvasRect: DOMRect;
    }): Bounds {
        if (!this.element || !this._elementSize) return {};

        const { anchorTo, placement, canvasX, canvasY, yOffset, xOffset, canvasRect } = opts;

        const { width: tooltipWidth, height: tooltipHeight } = this._elementSize;
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

        return bounds;
    }
}
