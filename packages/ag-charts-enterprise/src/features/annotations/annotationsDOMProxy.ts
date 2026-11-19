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

/** The widgets of the annotations' keyboard view, which are created only once there is an annotation to list. */
class AnnotationsDOM {
    readonly list: ListWidget;
    readonly moveGroup: GroupWidget;
    readonly moveHandle: ButtonWidget;
    readonly liveRegion: GroupWidget;
    readonly moveDescription = new DescriptionWidget();
    readonly moveDescriptionId = createElementId();

    constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        const { proxyInteractionService } = ctx;
        this.list = proxyInteractionService.createProxyContainer({
            type: 'list',
            domManagerId: LIST_ID,
            classList: ['ag-charts-annotations'],
            ariaLabel: { id: 'ariaLabelAnnotationsList' },
            where: 'afterend',
        });

        this.moveDescription.id = this.moveDescriptionId;
        this.list.setDescription(this.moveDescription);

        // A separate element takes the focus while an annotation moves, since the arrow keys move between the list items.
        this.moveGroup = proxyInteractionService.createProxyContainer({
            type: 'group',
            domManagerId: MOVE_HANDLE_ID,
            classList: [],
            ariaLabel: undefined,
            role: 'presentation',
            where: 'afterend',
        });
        this.moveHandle = proxyInteractionService.createProxyElement({
            type: 'button',
            textContent: '',
            tabIndex: -1,
            parent: this.moveGroup,
        });
        this.moveHandle.setPointerEvents('none');
        this.moveHandle.setHidden(true);
        this.moveHandle.setAriaDescribedBy(this.moveDescriptionId);

        this.liveRegion = proxyInteractionService.createProxyContainer({
            type: 'group',
            domManagerId: LIVE_REGION_ID,
            classList: ['ag-charts-annotations__live-region'],
            ariaLabel: undefined,
            role: 'status',
        });
    }

    destroy() {
        const { ctx } = this;
        this.list.destroy();
        this.moveGroup.destroy();
        this.liveRegion.destroy();
        ctx.domManager.removeChild('canvas-proxy', LIST_ID);
        ctx.domManager.removeChild('canvas-proxy', MOVE_HANDLE_ID);
        ctx.domManager.removeChild('canvas-proxy', LIVE_REGION_ID);
    }
}

/**
 * The keyboard and screen reader view of the annotations: a list with a menu button per annotation, whose popup is the
 * Annotation Options Toolbar. Pointer events pass through it to the series area.
 */
export class AnnotationsDOMProxy {
    private readonly cleanup = new CleanupRegistry();
    // OPTIMIZATION: created on first use, as every chart with the annotations module creates this, such as a sparkline.
    private dom?: AnnotationsDOM;
    private readonly buttons = new Map<string, ButtonWidget>();
    private hasPopup = true;
    private movingId?: string;

    constructor(
        private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>,
        private readonly listener: AnnotationsDOMProxyListener
    ) {
        this.cleanup.register(
            ctx.eventsHub.on('locale:change', () => this.updateMoveDescription()),
            () => this.dom?.destroy()
        );
    }

    destroy() {
        this.cleanup.flush();
    }

    update(items: AnnotationsDOMProxyItem[], seriesRect: BBox) {
        if (this.dom == null && items.length === 0) return;

        const { list, moveGroup, moveHandle } = this.getDOM();
        this.syncButtons(list, items);
        list.setHidden(items.length === 0);

        list.setBounds(seriesRect);
        moveGroup.setBounds(seriesRect);
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
                moveHandle.setTextContent(item.label);
                moveHandle.setBounds(getButtonBounds(item.bbox, seriesRect));
            }
        }
    }

    clear() {
        const { dom } = this;
        if (dom == null) return;
        this.syncButtons(dom.list, []);
        dom.list.setHidden(true);
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
        if (this.dom == null || this.buttons.size === 0) return false;
        this.dom.list.focus();
        return true;
    }

    /**
     * While an annotation moves, a handle over it takes the focus and the arrow keys, and describes how to use them.
     * Ending the move hides the handle without moving the focus, which the caller then moves on.
     */
    startMove(id: string) {
        const button = this.buttons.get(id);
        const moveHandle = this.dom?.moveHandle;
        if (button == null || moveHandle == null) return;

        this.movingId = id;
        moveHandle.setTextContent(button.getTextContent());
        moveHandle.setBounds(button.getBounds());
        moveHandle.setHidden(false);
        moveHandle.focus();
    }

    stopMove() {
        this.movingId = undefined;
        this.dom?.moveHandle.setHidden(true);
    }

    announce(text: string) {
        const liveRegion = this.dom?.liveRegion;
        if (liveRegion == null) return;
        // A live region announces only a change, so the same text twice needs to differ.
        liveRegion.setTextContent(liveRegion.getTextContent() === text ? `${text}\u00A0` : text);
    }

    private getDOM() {
        if (this.dom != null) return this.dom;

        const dom = new AnnotationsDOM(this.ctx);
        dom.moveHandle.addListener('keydown', this.onMoveKeyDown);
        dom.moveHandle.addListener('keyup', ({ sourceEvent }) => this.listener.onMoveKeyUp(sourceEvent));
        dom.moveHandle.addListener('blur', () => {
            if (this.movingId != null) this.listener.onMoveBlur();
        });
        this.dom = dom;
        this.updateMoveDescription();
        return dom;
    }

    private updateMoveDescription() {
        this.dom?.moveDescription.setTextContent(this.ctx.localeManager.t('ariaDescriptionMoveAnnotation'));
    }

    private syncButtons(list: ListWidget, items: AnnotationsDOMProxyItem[]) {
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
            this.createButtons(list, items);
            if (focusedId != null) this.focus(focusedId);
            return;
        }

        this.createButtons(list, items);
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

    private createButtons(list: ListWidget, items: AnnotationsDOMProxyItem[]) {
        for (const { id, label } of items) {
            if (this.buttons.has(id)) continue;
            this.buttons.set(id, this.createButton(list, id, label));
        }
    }

    private createButton(list: ListWidget, id: string, label: string) {
        const button = this.ctx.proxyInteractionService.createProxyElement({
            type: 'button',
            textContent: label,
            parent: list,
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
