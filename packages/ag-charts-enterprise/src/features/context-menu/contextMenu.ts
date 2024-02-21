import type { _Scene } from 'ag-charts-community';
import { _ModuleSupport, _Util } from 'ag-charts-community';

import {
    DEFAULT_CONTEXT_MENU_CLASS,
    DEFAULT_CONTEXT_MENU_DARK_CLASS,
    defaultContextMenuCss,
} from './contextMenuStyles';

type ContextMenuGroups = {
    default: Array<ContextMenuItem>;
    node: Array<ContextMenuItem>;
    extra: Array<ContextMenuItem>;
    extraNode: Array<ContextMenuItem>;
};
type ContextMenuAction = _ModuleSupport.ContextMenuAction;
type ContextMenuActionParams = _ModuleSupport.ContextMenuActionParams;
type ContextMenuItem = 'download' | ContextMenuAction;

const { BOOLEAN, Validate } = _ModuleSupport;

export class ContextMenu extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(BOOLEAN)
    darkTheme = false;

    /**
     * Extra menu actions with a label and callback.
     */
    public extraActions: Array<ContextMenuAction> = [];

    /**
     * Extra menu actions that only appear when clicking on a node.
     */
    public extraNodeActions: Array<ContextMenuAction> = [];

    // Module context
    private scene: _Scene.Scene;
    private highlightManager: _ModuleSupport.HighlightManager;
    private interactionManager: _ModuleSupport.InteractionManager;
    private registry: _ModuleSupport.ContextMenuRegistry;

    // State
    private groups: ContextMenuGroups;
    private pickedNode?: _ModuleSupport.SeriesNodeDatum;
    private showEvent?: MouseEvent;
    private x: number = 0;
    private y: number = 0;

    // HTML elements
    private canvasElement: HTMLElement;
    private container: HTMLElement;
    private element: HTMLDivElement;
    private menuElement?: HTMLDivElement;
    private intersectionObserver?: IntersectionObserver;
    private mutationObserver?: MutationObserver;

    // Global shared state
    private static contextMenuDocuments: Document[] = [];

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        // Module context
        this.highlightManager = ctx.highlightManager;
        this.interactionManager = ctx.interactionManager;
        this.registry = ctx.contextMenuRegistry;
        this.scene = ctx.scene;

        const { Default, ContextMenu: ContextMenuState, All } = _ModuleSupport.InteractionState;
        const contextState = Default | ContextMenuState;
        this.destroyFns.push(
            ctx.interactionManager.addListener('contextmenu', (event) => this.onContextMenu(event), contextState),
            ctx.interactionManager.addListener('click', () => this.onClick(), All)
        );

        // State
        this.groups = { default: [], node: [], extra: [], extraNode: [] };

        // HTML elements
        this.canvasElement = ctx.scene.canvas.element;
        this.container = ctx.document.body;

        this.element = this.container.appendChild(ctx.document.createElement('div'));
        this.element.classList.add(DEFAULT_CONTEXT_MENU_CLASS);
        this.element.addEventListener('contextmenu', (event) => event.preventDefault()); // AG-10223
        this.destroyFns.push(() => this.element.parentNode?.removeChild(this.element));

        this.hide();

        if (typeof IntersectionObserver !== 'undefined') {
            // Detect when the chart becomes invisible and hide the context menu as well.
            const observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (entry.target === this.canvasElement && entry.intersectionRatio === 0) {
                            this.hide();
                        }
                    }
                },
                { root: this.container }
            );

            observer.observe(this.canvasElement);
            this.intersectionObserver = observer;
        }

        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
                if (this.menuElement && this.element.contains(this.menuElement)) {
                    this.reposition();
                }
            });
            observer.observe(this.element, { childList: true });
            this.mutationObserver = observer;
        }

        // Global shared state
        if (ContextMenu.contextMenuDocuments.indexOf(ctx.document) < 0) {
            const styleElement = ctx.document.createElement('style');
            styleElement.innerHTML = defaultContextMenuCss;
            // Make sure the default context menu style goes before other styles so it can be overridden.
            ctx.document.head.insertBefore(styleElement, ctx.document.head.querySelector('style'));
            ContextMenu.contextMenuDocuments.push(ctx.document);
        }

        this.registry.registerDefaultAction({
            id: 'download',
            label: 'Download',
            action: () => {
                const title = ctx.chartService.title;
                let fileName = 'image';
                if (title !== undefined && title.enabled && title.text !== undefined) {
                    fileName = title.text;
                }
                this.scene.download(fileName);
            },
        });
    }

    private isShown(): boolean {
        return this.menuElement !== undefined;
    }

    private onClick() {
        if (this.isShown()) {
            this.hide();
        }
    }

    private onContextMenu(event: _ModuleSupport.InteractionEvent<'contextmenu'>) {
        if (!this.enabled) return;

        this.showEvent = event.sourceEvent as MouseEvent;
        this.x = event.pageX;
        this.y = event.pageY;

        this.groups.default = this.registry.copyDefaultActions();

        this.pickedNode = this.highlightManager.getActivePicked();
        if (this.extraActions.length > 0) {
            this.groups.extra = [...this.extraActions];
        }

        if (this.extraNodeActions.length > 0 && this.pickedNode) {
            this.groups.extraNode = [...this.extraNodeActions];
        }

        const { default: def, node, extra, extraNode } = this.groups;
        const groupCount = def.length + node.length + extra.length + extraNode.length;

        if (groupCount === 0) return;

        event.consume();
        event.sourceEvent.preventDefault();

        this.show();
    }

    public show() {
        this.interactionManager.pushState(_ModuleSupport.InteractionState.ContextMenu);
        this.element.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);

        const newMenuElement = this.renderMenu();

        if (this.menuElement) {
            this.element.replaceChild(newMenuElement, this.menuElement);
        } else {
            this.element.appendChild(newMenuElement);
        }

        this.menuElement = newMenuElement;

        this.element.style.display = 'block';
    }

    public hide() {
        this.interactionManager.popState(_ModuleSupport.InteractionState.ContextMenu);

        if (this.menuElement) {
            this.element.removeChild(this.menuElement);
            this.menuElement = undefined;
        }

        this.element.style.display = 'none';
    }

    public renderMenu() {
        const menuElement = this.ctx.document.createElement('div');
        menuElement.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
        menuElement.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);

        this.appendMenuGroup(menuElement, this.groups.default, false);

        if (this.pickedNode) {
            this.appendMenuGroup(menuElement, this.groups.node);
        }

        this.appendMenuGroup(menuElement, this.groups.extra);

        if (this.pickedNode) {
            this.appendMenuGroup(menuElement, this.groups.extraNode);
        }

        return menuElement;
    }

    public appendMenuGroup(menuElement: HTMLElement, group: ContextMenuItem[], divider = true) {
        if (group.length === 0) return;
        if (divider) menuElement.appendChild(this.createDividerElement());
        group.forEach((i) => {
            const item = this.renderItem(i);
            if (item) menuElement.appendChild(item);
        });
    }

    public renderItem(item: ContextMenuItem): HTMLElement | void {
        if (item && typeof item === 'object' && item.constructor === Object) {
            return this.createActionElement(item);
        }
    }

    private createDividerElement(): HTMLElement {
        const el = this.ctx.document.createElement('div');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__divider`);
        el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        return el;
    }

    private createActionElement({ id, label, action }: ContextMenuAction): HTMLElement {
        if (id && this.registry.isDisabled(id)) {
            return this.createDisabledElement(label);
        }
        return this.createButtonElement(label, action);
    }

    private createButtonElement(label: string, callback: (params: ContextMenuActionParams) => void): HTMLElement {
        const el = this.ctx.document.createElement('button');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
        el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        el.innerHTML = label;
        el.onclick = () => {
            const event = this.pickedNode?.series.createNodeContextMenuActionEvent(this.showEvent!, this.pickedNode);
            if (event) {
                Object.defineProperty(event, 'itemId', {
                    enumerable: false,
                    get: () => {
                        _Util.Logger.warnOnce(
                            `Property [AgNodeContextMenuActionEvent.itemId] is deprecated. Use [yKey], [angleKey] and others instead.`
                        );
                        return this.pickedNode?.itemId;
                    },
                });
                callback(event);
            } else {
                callback({ event: this.showEvent! });
            }

            this.hide();
        };
        return el;
    }

    private createDisabledElement(label: string): HTMLElement {
        const el = this.ctx.document.createElement('button');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
        el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        el.disabled = true;
        el.innerHTML = label;
        return el;
    }

    private reposition() {
        const {
            x,
            y,
            ctx: { window },
        } = this;

        this.element.style.top = 'unset';
        this.element.style.bottom = 'unset';
        this.element.style.left = 'unset';
        this.element.style.right = 'unset';

        if (x + this.element.offsetWidth > window.innerWidth) {
            this.element.style.right = `calc(100% - ${x - 1}px)`;
        } else {
            this.element.style.left = `${x + 1}px`;
        }

        if (y + this.element.offsetHeight > window.innerHeight) {
            this.element.style.bottom = `calc(100% - ${y}px - 0.5em)`;
        } else {
            this.element.style.top = `calc(${y}px - 0.5em)`;
        }
    }

    public override destroy() {
        super.destroy();

        this.destroyFns.forEach((f) => f());

        this.intersectionObserver?.unobserve(this.canvasElement);
        this.mutationObserver?.disconnect();
    }
}
