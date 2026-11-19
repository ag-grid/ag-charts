import type { _ModuleSupport } from 'ag-charts-community';
import {
    BBox,
    type ButtonWidget,
    CleanupRegistry,
    DescriptionWidget,
    type DynamicContext,
    type GroupWidget,
    type KeyboardWidgetEvent,
    type ListWidget,
    createElementId,
    setAttribute,
} from 'ag-charts-core';

const LIST_ID = 'annotations';
const MOVE_HANDLE_ID = 'annotations-move';
const LIVE_REGION_ID = 'annotations-live';

// Thin annotations, such as a horizontal line, would otherwise get a focus indicator too small to see.
const MIN_FOCUS_SIZE = 6;

export interface AnnotationsDOMProxyItem {
    readonly id: string;
    readonly label: string;
    /** The annotation's bounds on the canvas. */
    readonly bbox: BBox;
    readonly expanded: boolean;
}

export interface AnnotationsDOMProxyListener {
    onFocus(id: string): void;
    onActivate(id: string, sourceEvent: Event): void;
    onMoveKeyDown(sourceEvent: KeyboardEvent): void;
    onMoveKeyUp(sourceEvent: KeyboardEvent): void;
    onMoveEnd(): void;
    onMoveBlur(): void;
}

/**
 * The keyboard and screen reader view of the annotations: a list with a menu button per annotation, whose popup is the
 * Annotation Options Toolbar. Pointer events pass through it to the series area.
 */
export class AnnotationsDOMProxy {
    private readonly cleanup = new CleanupRegistry();
    private readonly list: ListWidget;
    private readonly moveGroup: GroupWidget;
    private readonly moveHandle: ButtonWidget;
    private readonly liveRegion: HTMLElement;
    private readonly buttons = new Map<string, ButtonWidget>();
    private readonly moveDescription = new DescriptionWidget();
    private readonly moveDescriptionId = createElementId();
    private hasPopup = true;
    private movingId?: string;

    constructor(
        private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>,
        private readonly listener: AnnotationsDOMProxyListener
    ) {
        this.list = ctx.proxyInteractionService.createProxyContainer({
            type: 'list',
            domManagerId: LIST_ID,
            classList: ['ag-charts-annotations'],
            ariaLabel: { id: 'ariaLabelAnnotationsList' },
            where: 'afterend',
        });

        this.moveDescription.id = this.moveDescriptionId;
        this.list.setDescription(this.moveDescription);
        this.updateMoveDescription();

        // A separate element takes the focus while an annotation moves, since the arrow keys move between the list items.
        this.moveGroup = ctx.proxyInteractionService.createProxyContainer({
            type: 'group',
            domManagerId: MOVE_HANDLE_ID,
            classList: [],
            ariaLabel: undefined,
            role: 'presentation',
            where: 'afterend',
        });
        this.moveHandle = ctx.proxyInteractionService.createProxyElement({
            type: 'button',
            textContent: '',
            tabIndex: -1,
            parent: this.moveGroup,
        });
        this.moveHandle.setPointerEvents('none');
        this.moveHandle.setHidden(true);
        this.moveHandle.setAriaDescribedBy(this.moveDescriptionId);
        this.moveHandle.addListener('keydown', this.onMoveKeyDown);
        this.moveHandle.addListener('keyup', ({ sourceEvent }) => this.listener.onMoveKeyUp(sourceEvent));
        this.moveHandle.addListener('blur', () => {
            if (this.movingId != null) this.listener.onMoveBlur();
        });

        this.liveRegion = ctx.domManager.addChild('canvas-proxy', LIVE_REGION_ID);
        this.liveRegion.classList.add('ag-charts-annotations__live-region');
        setAttribute(this.liveRegion, 'aria-live', 'polite');

        this.cleanup.register(
            ctx.eventsHub.on('locale:change', () => this.updateMoveDescription()),
            () => {
                this.list.destroy();
                this.moveGroup.destroy();
                ctx.domManager.removeChild('canvas-proxy', LIST_ID);
                ctx.domManager.removeChild('canvas-proxy', MOVE_HANDLE_ID);
                ctx.domManager.removeChild('canvas-proxy', LIVE_REGION_ID);
            }
        );
    }

    destroy() {
        this.cleanup.flush();
    }

    update(items: AnnotationsDOMProxyItem[], seriesRect: BBox) {
        this.syncButtons(items);
        this.list.setHidden(items.length === 0);

        this.list.setBounds(seriesRect);
        this.moveGroup.setBounds(seriesRect);
        for (const item of items) {
            const button = this.buttons.get(item.id);
            if (button == null) continue;
            if (button.getTextContent() !== item.label) {
                button.setTextContent(item.label);
            }
            button.setBounds(getButtonBounds(item.bbox, seriesRect));
            button.setAriaHasPopup(this.hasPopup ? 'dialog' : undefined);
            button.setAriaExpanded(this.hasPopup ? item.expanded : undefined);

            if (item.id === this.movingId) {
                this.moveHandle.setTextContent(item.label);
                this.moveHandle.setBounds(getButtonBounds(item.bbox, seriesRect));
            }
        }
    }

    clear() {
        this.syncButtons([]);
        this.list.setHidden(true);
    }

    /** Whether the annotations open a popup, which is the Annotation Options Toolbar unless it is disabled. */
    setHasPopup(hasPopup: boolean) {
        this.hasPopup = hasPopup;
    }

    focus(id: string) {
        this.buttons.get(id)?.focus();
    }

    /** Focuses the annotation that the arrow keys last moved to, if any annotation is listed. */
    focusList() {
        if (this.buttons.size === 0) return false;
        this.list.focus();
        return true;
    }

    /**
     * While an annotation moves, a handle over it takes the focus and the arrow keys, and describes how to use them.
     * Ending the move hides the handle without moving the focus, which the caller then moves on.
     */
    startMove(id: string) {
        const button = this.buttons.get(id);
        if (button == null) return;

        this.movingId = id;
        this.moveHandle.setTextContent(button.getTextContent());
        this.moveHandle.setBounds(button.getBounds());
        this.moveHandle.setHidden(false);
        this.moveHandle.focus();
    }

    stopMove() {
        this.movingId = undefined;
        this.moveHandle.setHidden(true);
    }

    announce(text: string) {
        // A live region announces only a change, so the same text twice needs to differ.
        this.liveRegion.textContent = this.liveRegion.textContent === text ? `${text}\u00A0` : text;
    }

    private updateMoveDescription() {
        this.moveDescription.setTextContent(this.ctx.localeManager.t('ariaDescriptionMoveAnnotation'));
    }

    private syncButtons(items: AnnotationsDOMProxyItem[]) {
        const { buttons } = this;
        const ids = new Set(items.map((item) => item.id));
        for (const [id, button] of buttons) {
            if (!ids.has(id)) {
                button.destroy();
                buttons.delete(id);
            }
        }

        if (!this.isInOrder(items)) {
            const focusedId = this.getFocusedId();
            for (const button of buttons.values()) {
                button.destroy();
            }
            buttons.clear();
            this.createButtons(items);
            if (focusedId != null) this.focus(focusedId);
            return;
        }

        this.createButtons(items);
    }

    /** Whether the listed annotations are in the order of `items`, so any new ones can be appended. */
    private isInOrder(items: AnnotationsDOMProxyItem[]) {
        let previousIndex = -1;
        let appending = false;
        for (const { id } of items) {
            const button = this.buttons.get(id);
            if (button == null) {
                appending = true;
            } else if (appending || button.index < previousIndex) {
                return false;
            } else {
                previousIndex = button.index;
            }
        }
        return true;
    }

    private createButtons(items: AnnotationsDOMProxyItem[]) {
        for (const { id, label } of items) {
            if (this.buttons.has(id)) continue;
            this.buttons.set(id, this.createButton(id, label));
        }
    }

    private createButton(id: string, label: string) {
        const button = this.ctx.proxyInteractionService.createProxyElement({
            type: 'button',
            textContent: label,
            parent: this.list,
        });
        button.setPointerEvents('none');
        button.addListener('focus', () => this.listener.onFocus(id));
        button.addListener('click', (event) => this.listener.onActivate(id, event.sourceEvent));
        return button;
    }

    private getFocusedId() {
        for (const [id, button] of this.buttons) {
            if (button.isFocused()) return id;
        }
    }

    private readonly onMoveKeyDown = ({ sourceEvent }: KeyboardWidgetEvent<'keydown'>) => {
        switch (sourceEvent.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                this.listener.onMoveKeyDown(sourceEvent);
                break;
            case 'Escape':
                this.listener.onMoveEnd();
                break;
            case 'Enter':
            case ' ':
                // TODO: the design leaves Space and Enter open while moving: firing an annotation click,
                // or saving and returning to the toolbar. Ignore them until that is decided.
                break;
            default:
                return;
        }
        sourceEvent.preventDefault();
    };
}

function getButtonBounds(bbox: BBox, seriesRect: BBox) {
    const x1 = Math.max(bbox.x, seriesRect.x);
    const y1 = Math.max(bbox.y, seriesRect.y);
    const x2 = Math.min(bbox.x + bbox.width, seriesRect.x + seriesRect.width);
    const y2 = Math.min(bbox.y + bbox.height, seriesRect.y + seriesRect.height);
    const width = Math.max(x2 - x1, MIN_FOCUS_SIZE);
    const height = Math.max(y2 - y1, MIN_FOCUS_SIZE);
    const x = (x1 + x2 - width) / 2 - seriesRect.x;
    const y = (y1 + y2 - height) / 2 - seriesRect.y;
    return new BBox(x, y, width, height);
}
