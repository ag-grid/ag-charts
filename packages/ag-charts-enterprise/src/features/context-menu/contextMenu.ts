import type { AgContextMenuOptions, _Scene } from 'ag-charts-community';
import { _ModuleSupport, _Util } from 'ag-charts-community';

import {
    DEFAULT_CONTEXT_MENU_CLASS,
    DEFAULT_CONTEXT_MENU_DARK_CLASS,
    defaultContextMenuCss,
} from './contextMenuStyles';

type ContextMenuGroups = {
    default: Array<ContextMenuAction>;
    extra: Array<ContextMenuAction<'all'>>;
    extraNode: Array<ContextMenuAction<'series'>>;
    extraLegendItem: Array<ContextMenuAction<'legend'>>;
};
type ContextType = _ModuleSupport.ContextType;
type ContextMenuEvent = _ModuleSupport.ContextMenuEvent;
type ContextMenuAction<T extends ContextType = ContextType> = _ModuleSupport.ContextMenuAction<T>;
type ContextMenuCallback<T extends ContextType> = _ModuleSupport.ContextMenuCallback<T>;

const { BOOLEAN, Validate, createElement, initMenuKeyNav, makeAccessibleClickListener, ContextMenuRegistry } =
    _ModuleSupport;

const moduleId = 'context-menu';

function getChildrenOfType<TElem extends Element>(parent: Element, ctor: new () => TElem): TElem[] {
    const { children } = parent ?? {};
    if (!children) return [];

    const result: TElem[] = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child instanceof ctor) {
            result.push(child);
        }
    }
    return result;
}

export class ContextMenu extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(BOOLEAN)
    darkTheme = false;

    /**
     * Extra menu actions with a label and callback.
     */
    public extraActions: NonNullable<AgContextMenuOptions['extraActions']> = [];

    /**
     * Extra menu actions that only appear when clicking on a node.
     */
    public extraNodeActions: NonNullable<AgContextMenuOptions['extraNodeActions']> = [];

    /**
     * Extra menu actions that only appear when clicking on a legend item
     */
    public extraLegendItemActions: NonNullable<AgContextMenuOptions['extraLegendItemActions']> = [];

    // Module context
    private readonly scene: _Scene.Scene;
    private readonly interactionManager: _ModuleSupport.InteractionManager;
    private readonly registry: _ModuleSupport.ContextMenuRegistry;

    // State
    private readonly groups: ContextMenuGroups;
    private pickedNode?: _ModuleSupport.SeriesNodeDatum;
    private pickedLegendItem?: _ModuleSupport.CategoryLegendDatum;
    private showEvent?: MouseEvent;
    private x: number = 0;
    private y: number = 0;

    // HTML elements
    private readonly element: HTMLElement;
    private menuElement?: HTMLDivElement;
    private menuElementDestroyFns: (() => void)[] = [];
    private lastFocus?: HTMLElement;
    private readonly mutationObserver?: MutationObserver;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        // Module context
        this.interactionManager = ctx.interactionManager;
        this.registry = ctx.contextMenuRegistry;
        this.scene = ctx.scene;

        const { All } = _ModuleSupport.InteractionState;
        this.destroyFns.push(ctx.regionManager.listenAll('click', (_region) => this.onClick(), All));

        // State
        this.groups = { default: [], extra: [], extraNode: [], extraLegendItem: [] };

        this.element = ctx.domManager.addChild('canvas-overlay', moduleId);
        this.element.classList.add(DEFAULT_CONTEXT_MENU_CLASS);
        this.element.addEventListener('contextmenu', (event) => event.preventDefault()); // AG-10223
        this.destroyFns.push(() => this.element.parentNode?.removeChild(this.element));

        this.hide();

        this.destroyFns.push(ctx.domManager.addListener('hidden', () => this.hide()));

        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
                if (this.menuElement && this.element.contains(this.menuElement)) {
                    this.reposition();
                }
            });
            observer.observe(this.element, { childList: true });
            this.mutationObserver = observer;
            this.destroyFns.push(() => observer.disconnect());
        }

        ctx.domManager.addStyles(moduleId, defaultContextMenuCss);

        this.registry.registerDefaultAction({
            id: 'download',
            type: 'all',
            label: 'context-menu.download',
            action: () => {
                const title = ctx.chartService.title;
                let fileName = 'image';
                if (title?.enabled && title?.text !== undefined) {
                    fileName = title.text;
                }
                this.scene.download(fileName);
            },
        });

        this.destroyFns.push(this.registry.addListener((e) => this.onContext(e)));
    }

    private isShown(): boolean {
        return this.menuElement !== undefined;
    }

    private onClick() {
        if (this.isShown()) {
            this.hide();
        }
    }

    private onContext(event: ContextMenuEvent) {
        if (!this.enabled) return;
        event.preventDefault();

        this.showEvent = event.sourceEvent as MouseEvent;
        this.x = event.x;
        this.y = event.y;

        this.groups.default = this.registry.filterActions(event.type);

        this.pickedNode = undefined;
        this.pickedLegendItem = undefined;

        this.groups.extra = this.extraActions.map(({ label, action }) => {
            return { type: 'all', label, action };
        });

        if (ContextMenuRegistry.check('series', event)) {
            this.pickedNode = event.context.pickedNode;
            if (this.pickedNode) {
                this.groups.extraNode = this.extraNodeActions.map(({ label, action }) => {
                    return { type: 'series', label, action };
                });
            }
        }

        if (ContextMenuRegistry.check('legend', event)) {
            this.pickedLegendItem = event.context.legendItem;
            if (this.pickedLegendItem) {
                this.groups.extraLegendItem = this.extraLegendItemActions.map(({ label, action }) => {
                    return { type: 'legend', label, action };
                });
            }
        }

        const { default: def, extra, extraNode, extraLegendItem } = this.groups;
        const groupCount = [def, extra, extraNode, extraLegendItem].reduce((count, e) => {
            return e.length + count;
        }, 0);

        if (groupCount === 0) return;

        if (event.sourceEvent.target instanceof HTMLElement) {
            this.lastFocus = event.sourceEvent.target;
        }
        this.show();
    }

    private show() {
        this.interactionManager.pushState(_ModuleSupport.InteractionState.ContextMenu);
        this.element.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);

        const newMenuElement = this.renderMenu();

        if (this.menuElement) {
            this.element.replaceChild(newMenuElement, this.menuElement);
            this.menuElementDestroyFns.forEach((d) => d());
        } else {
            this.element.appendChild(newMenuElement);
        }

        this.menuElement = newMenuElement;

        this.element.style.display = 'block';

        const buttons = getChildrenOfType(newMenuElement, HTMLButtonElement);
        this.menuElementDestroyFns = initMenuKeyNav({
            menu: newMenuElement,
            buttons,
            orientation: 'vertical',
            onEscape: () => this.hide(),
        });
        buttons[0]?.focus();
    }

    private hide() {
        this.interactionManager.popState(_ModuleSupport.InteractionState.ContextMenu);

        if (this.menuElement) {
            this.element.removeChild(this.menuElement);
            this.menuElement = undefined;
            this.menuElementDestroyFns.forEach((d) => d());
            this.menuElementDestroyFns.length = 0;
        }

        this.element.style.display = 'none';
        this.lastFocus?.focus();
        this.lastFocus = undefined;
    }

    private renderMenu() {
        const menuElement = createElement('div');
        menuElement.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
        menuElement.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        menuElement.role = 'menu';

        this.appendMenuGroup(menuElement, this.groups.default, false);

        this.appendMenuGroup(menuElement, this.groups.extra);

        if (this.pickedNode) {
            this.appendMenuGroup(menuElement, this.groups.extraNode);
        }

        if (this.pickedLegendItem) {
            this.appendMenuGroup(menuElement, this.groups.extraLegendItem);
        }

        return menuElement;
    }

    private appendMenuGroup(menuElement: HTMLElement, group: ContextMenuAction[], divider = true) {
        if (group.length === 0) return;
        if (divider) menuElement.appendChild(this.createDividerElement());
        group.forEach((i) => {
            const item = this.renderItem(i);
            if (item) menuElement.appendChild(item);
        });
    }

    private renderItem(item: ContextMenuAction): HTMLElement | void {
        if (item && typeof item === 'object' && item.constructor === Object) {
            return this.createActionElement(item);
        }
    }

    private createDividerElement(): HTMLElement {
        const el = createElement('div');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__divider`);
        el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        el.role = 'separator';
        return el;
    }

    private createActionElement({ id, label, type, action }: ContextMenuAction): HTMLElement {
        const disabled = !!(id && this.registry.isDisabled(id));
        return this.createButtonElement(type, label, action, disabled);
    }

    private createButtonOnClick<T extends ContextType>(type: T, callback: ContextMenuCallback<T>) {
        if (ContextMenuRegistry.checkCallback('legend', type, callback)) {
            return () => {
                if (this.pickedLegendItem) {
                    const { seriesId, itemId, enabled } = this.pickedLegendItem;
                    callback({ type: 'contextmenu', seriesId, itemId, enabled });
                    this.hide();
                }
            };
        } else if (ContextMenuRegistry.checkCallback('series', type, callback)) {
            return () => {
                const { pickedNode, showEvent } = this;
                const event = pickedNode?.series.createNodeContextMenuActionEvent(showEvent!, pickedNode);

                if (event) {
                    callback(event);
                } else {
                    _Util.Logger.error('series node not found');
                }
                this.hide();
            };
        }
        return () => {
            callback({ type: 'contextMenuEvent', event: this.showEvent! });
            this.hide();
        };
    }

    private createButtonElement<T extends ContextType>(
        type: T,
        label: string,
        callback: ContextMenuCallback<T>,
        disabled: boolean
    ): HTMLElement {
        const el = createElement('button');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
        el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        el.ariaDisabled = disabled.toString();
        el.textContent = this.ctx.localeManager.t(label);
        el.role = 'menuitem';
        el.onclick = makeAccessibleClickListener(el, this.createButtonOnClick(type, callback));
        return el;
    }

    private reposition() {
        let { x, y } = this;

        this.element.style.top = 'unset';
        this.element.style.bottom = 'unset';

        const canvasRect = this.ctx.domManager.getBoundingClientRect();
        const { offsetWidth: width, offsetHeight: height } = this.element;

        x = _ModuleSupport.clamp(0, x, canvasRect.width - width);
        y = _ModuleSupport.clamp(0, y, canvasRect.height - height);

        this.element.style.left = `${x}px`;
        this.element.style.top = `calc(${y}px - 0.5em)`;
    }

    public override destroy() {
        super.destroy();

        this.mutationObserver?.disconnect();

        this.ctx.domManager.removeStyles(moduleId);
        this.ctx.domManager.removeChild('canvas-overlay', moduleId);
    }
}
