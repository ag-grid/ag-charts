import type { AgChartLegendContextMenuEvent, _Scene } from 'ag-charts-community';
import { _ModuleSupport, _Util } from 'ag-charts-community';

import {
    DEFAULT_CONTEXT_MENU_CLASS,
    DEFAULT_CONTEXT_MENU_DARK_CLASS,
    defaultContextMenuCss,
} from './contextMenuStyles';

type ContextMenuGroups = {
    default: Array<ContextMenuItem>;
    extra: Array<ContextMenuItem>;
    extraNode: Array<ContextMenuItem>;
    extraLegendItem: Array<ContextMenuItem>;
};
type ContextType = _ModuleSupport.ContextType;
type ContextMenuEvent = _ModuleSupport.ContextMenuEvent;
type ContextMenuAction = _ModuleSupport.ContextMenuAction;
type ContextMenuActionParams = _ModuleSupport.ContextMenuActionParams;
type ContextMenuItem = 'download' | ContextMenuAction;

const { BOOLEAN, Validate, createElement, getWindow, ContextMenuRegistry } = _ModuleSupport;

const moduleId = 'context-menu';

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

    /**
     * Extra menu actions that only appear when clicking on a legend item
     */
    public extraLegendItemActions: Array<ContextMenuAction> = [];

    // Module context
    private readonly scene: _Scene.Scene;
    private readonly highlightManager: _ModuleSupport.HighlightManager;
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
    private readonly mutationObserver?: MutationObserver;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        // Module context
        this.highlightManager = ctx.highlightManager;
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

        ctx.domManager.addListener('hidden', () => this.hide());

        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
                if (this.menuElement && this.element.contains(this.menuElement)) {
                    this.reposition();
                }
            });
            observer.observe(this.element, { childList: true });
            this.mutationObserver = observer;
        }

        ctx.domManager.addStyles(moduleId, defaultContextMenuCss);

        this.registry.registerDefaultAction({
            id: 'download',
            type: 'all',
            label: 'Download',
            action: () => {
                const title = ctx.chartService.title;
                let fileName = 'image';
                if (title?.enabled && title?.text !== undefined) {
                    fileName = title.text;
                }
                this.scene.download(fileName);
            },
        });
        this.registry.addListener((e) => this.onContext(e));
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
        event.consume();

        this.showEvent = event.sourceEvent.sourceEvent as MouseEvent;
        this.x = event.sourceEvent.pageX;
        this.y = event.sourceEvent.pageY;

        this.groups.default = this.registry.filterActions(event.type);

        this.pickedNode = this.highlightManager.getActivePicked();
        this.pickedLegendItem = this.highlightManager.getActiveLegendItem();

        if (this.extraActions.length > 0) {
            this.groups.extra = [...this.extraActions];
        }

        if (ContextMenuRegistry.check('series', event)) {
            if (this.extraNodeActions.length > 0 && this.pickedNode) {
                this.groups.extraNode = [...this.extraNodeActions];
            }
        }

        if (ContextMenuRegistry.check('legend', event)) {
            if (this.extraLegendItemActions.length > 0 && this.pickedLegendItem) {
                this.groups.extraLegendItem = [...this.extraLegendItemActions];
            }
        }

        const { default: def, extra, extraNode, extraLegendItem } = this.groups;
        const groupCount = [def, extra, extraNode, extraLegendItem].reduce((count, e) => {
            return e.length + count;
        }, 0);

        if (groupCount === 0) return;

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
        const menuElement = createElement('div');
        menuElement.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
        menuElement.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);

        this.appendMenuGroup(menuElement, this.groups.default, false);

        this.appendMenuGroup(menuElement, this.groups.extra);

        if (this.pickedNode) {
            this.appendMenuGroup(menuElement, this.groups.extraNode);
        }

        if (this.pickedLegendItem) {
            const extraLegendItem = this.groups.extraLegendItem
                .filter((value): value is ContextMenuAction => typeof value !== 'string')
                .map((contextMenuItem: ContextMenuAction) => {
                    return {
                        ...contextMenuItem,
                        region: 'legend' as const,
                    };
                });
            this.appendMenuGroup(menuElement, extraLegendItem);
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
        const el = createElement('div');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__divider`);
        el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        return el;
    }

    private createActionElement({ id, label, type, action }: ContextMenuAction): HTMLElement {
        if (id && this.registry.isDisabled(id)) {
            return this.createDisabledElement(label);
        }
        return this.createButtonElement(type, label, action);
    }

    private createButtonOnClick(type: ContextType, callback: (params: ContextMenuActionParams) => void): () => void {
        if (type === 'legend') {
            return () => {
                if (this.pickedLegendItem) {
                    const { seriesId, itemId, enabled } = this.pickedLegendItem;
                    const event: AgChartLegendContextMenuEvent & ContextMenuActionParams = {
                        type: 'contextmenu',
                        seriesId,
                        itemId,
                        enabled,
                        event: this.showEvent!,
                    };
                    callback(event);
                }
            };
        }
        return () => {
            const event = this.pickedNode?.series.createNodeContextMenuActionEvent(this.showEvent!, this.pickedNode);
            if (event) {
                callback(event);
            } else {
                callback({ event: this.showEvent! });
            }

            this.hide();
        };
    }

    private createButtonElement(
        type: ContextType,
        label: string,
        callback: (params: ContextMenuActionParams) => void
    ): HTMLElement {
        const el = createElement('button');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
        el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        el.innerHTML = label;
        el.onclick = this.createButtonOnClick(type, callback);
        return el;
    }

    private createDisabledElement(label: string): HTMLElement {
        const el = createElement('button');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
        el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        el.disabled = true;
        el.innerHTML = label;
        return el;
    }

    private reposition() {
        const { x, y } = this;

        this.element.style.top = 'unset';
        this.element.style.bottom = 'unset';
        this.element.style.left = 'unset';
        this.element.style.right = 'unset';

        if (x + this.element.offsetWidth > getWindow('innerWidth')) {
            this.element.style.right = `calc(100% - ${x - 1}px)`;
        } else {
            this.element.style.left = `${x + 1}px`;
        }

        if (y + this.element.offsetHeight > getWindow('innerHeight')) {
            this.element.style.bottom = `calc(100% - ${y}px - 0.5em)`;
        } else {
            this.element.style.top = `calc(${y}px - 0.5em)`;
        }
    }

    public override destroy() {
        super.destroy();

        this.mutationObserver?.disconnect();

        this.ctx.domManager.removeStyles(moduleId);
        this.ctx.domManager.removeChild('canvas-overlay', moduleId);
    }
}
