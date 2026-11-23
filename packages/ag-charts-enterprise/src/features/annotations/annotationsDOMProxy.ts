import type { _ModuleSupport } from 'ag-charts-community';
import {
    BBox,
    ButtonWidget,
    CleanupRegistry,
    DescriptionWidget,
    type DynamicContext,
    type GroupWidget,
    type KeyboardWidgetEvent,
    ListWidget,
    createElementId,
} from 'ag-charts-core';

const ROOT_ID = 'annotations';

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

/** The root owns the other widgets, so destroying it destroys them all. */
class AnnotationsDOM {
    readonly root: GroupWidget;
    readonly mover = new ButtonWidget();
    readonly moveDescription = new DescriptionWidget();
    readonly list = new ListWidget();

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        this.root = ctx.proxyInteractionService.createProxyContainer({
            type: 'group',
            domManagerId: ROOT_ID,
            classList: ['ag-charts-annotations'],
            ariaLabel: undefined,
            role: 'presentation',
            where: 'afterend',
        });

        const moveDescriptionId = createElementId();
        this.moveDescription.id = moveDescriptionId;

        this.mover.addClass('ag-charts-annotations__mover');
        this.mover.setTabIndex(-1);
        this.mover.setAriaDescribedBy(moveDescriptionId);
        this.mover.setHidden(true);

        this.root.addChild(this.mover);
        this.root.addChild(this.moveDescription);
        this.root.addChild(this.list);
    }
}

/**
 * The keyboard and screen reader view of the annotations. Pointer events pass through it to the series area.
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
            ctx.eventsHub.on('locale:change', () => this.updateLocalisedText()),
            () => this.dom?.root.destroy()
        );
    }

    destroy() {
        this.cleanup.flush();
    }

    update(items: AnnotationsDOMProxyItem[], seriesRect: BBox) {
        if (this.dom == null && items.length === 0) return;

        const { root, list, mover } = this.getDOM();
        this.syncButtons(list, items);
        root.setBounds(seriesRect);

        for (const item of items) {
            const button = this.buttons.get(item.id);
            if (button == null) continue;
            if (button.getTextContent() !== item.label) {
                button.setTextContent(item.label);
            }
            const bounds = getButtonBounds(item.bbox, seriesRect);
            button.setBounds(bounds);
            button.setAriaHasPopup(this.hasPopup ? 'dialog' : undefined);
            button.setAriaExpanded(this.hasPopup ? item.expanded : undefined);

            if (item.id === this.movingId) {
                mover.setBounds(bounds);
            }
        }
    }

    clear() {
        if (this.dom == null) return;
        this.syncButtons(this.dom.list, []);
    }

    /** Whether the annotations open a popup, which is the Annotation Options Toolbar unless it is disabled. */
    setHasPopup(hasPopup: boolean) {
        this.hasPopup = hasPopup;
    }

    isListed(id: string) {
        return this.buttons.has(id);
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

    startMove(id: string) {
        const button = this.buttons.get(id);
        const mover = this.dom?.mover;
        if (button == null || mover == null) return;

        this.movingId = id;
        mover.setTextContent(this.ctx.localeManager.t('ariaLabelMovingAnnotation'));
        mover.setBounds(button.getBounds());
        mover.setHidden(false);
        mover.focus();
    }

    /** Hides the mover without moving the focus, which the caller must move on. */
    stopMove() {
        this.movingId = undefined;
        this.dom?.mover.setHidden(true);
    }

    announceMove(text: string) {
        this.dom?.mover.setTextContent(text);
    }

    private getDOM() {
        if (this.dom != null) return this.dom;

        const dom = new AnnotationsDOM(this.ctx);
        dom.mover.addListener('keydown', this.onMoveKeyDown);
        dom.mover.addListener('keyup', ({ sourceEvent }) => this.listener.onMoveKeyUp(sourceEvent));
        dom.mover.addListener('blur', () => {
            if (this.movingId != null) this.listener.onMoveBlur();
        });
        this.dom = dom;
        this.updateLocalisedText();
        return dom;
    }

    private updateLocalisedText() {
        const { dom } = this;
        if (dom == null) return;
        const { localeManager } = this.ctx;
        dom.list.setAriaLabel(localeManager.t('ariaLabelAnnotationsList'));
        dom.moveDescription.setTextContent(localeManager.t('ariaDescriptionMoveAnnotation'));
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

        if (this.isInOrder(items)) {
            this.createButtons(list, items);
        } else {
            const focusedId = this.getFocusedId();
            for (const button of buttons.values()) {
                button.destroy();
            }
            buttons.clear();
            this.createButtons(list, items);
            if (focusedId != null) this.focus(focusedId);
        }
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
        const button = new ButtonWidget();
        button.addClass('ag-charts-annotations__item');
        button.setTextContent(label);
        button.addListener('focus', () => this.listener.onFocus(id));
        button.addListener('click', (event) => this.listener.onActivate(id, event.sourceEvent));
        list.addChild(button);
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
