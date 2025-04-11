import type { AgContextMenuItem, AgContextMenuItemShowOn, AgContextMenuOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { Logger, clamp, createElement } from 'ag-charts-core';

import { ContextMenuItem, expandBuiltin } from './contextMenuItem';
import { DEFAULT_CONTEXT_MENU_CLASS, DEFAULT_CONTEXT_MENU_DARK_CLASS } from './contextMenuStyles';

type ContextMenuEvent = _ModuleSupport.ContextMenuEvent;
type ContextMenuCallback = _ModuleSupport.ContextMenuCallback<AgContextMenuItemShowOn>;
type DeprecatedOption = 'extraActions' | 'extraNodeActions' | 'extraSeriesAreaActions' | 'extraLegendItemActions';
type DeprecatedAction<T extends DeprecatedOption> = NonNullable<AgContextMenuOptions[T]>;
type DeprecatedMap = {
    readonly [K in DeprecatedOption]: {
        readonly items: DeprecatedAction<K>;
        readonly showOn: AgContextMenuItemShowOn;
    };
};

const { Property, initMenuKeyNav, makeAccessibleClickListener, ContextMenuRegistry } = _ModuleSupport;

const moduleId = 'context-menu';

function getChildrenOfType<TElem extends Element>(parent: Element, ctor: new () => TElem): TElem[] {
    const { children } = parent ?? {};
    if (!children) return [];

    const result: TElem[] = [];
    for (const child of Array.from(children)) {
        if (child instanceof ctor) {
            result.push(child);
        }
    }
    return result;
}

function cleanUpSeparators(items: ContextMenu['expandedItems']) {
    let count = 0;
    let dst = 0;
    let src = 0;
    for (src; src < items.length; src++) {
        const it = items[src];
        const isSep: boolean = it.type === 'separator';
        if (count > 0 || !isSep) {
            count++;
            items[dst++] = it;
        }
        if (isSep) count = 0;
    }
    if (items[dst - 1].type === 'separator') dst--;
    items.length = dst;
}

export class ContextMenu extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Property
    enabled = true;

    @Property
    darkTheme = false;

    @Property
    readonly items: readonly Readonly<AgContextMenuItem>[] = ['defaults'];

    public extraActions: DeprecatedAction<'extraActions'> = [];
    public extraNodeActions: DeprecatedAction<'extraNodeActions'> = [];
    public extraSeriesAreaActions: DeprecatedAction<'extraSeriesAreaActions'> = [];
    public extraLegendItemActions: DeprecatedAction<'extraLegendItemActions'> = [];
    private readonly deprecationMap: DeprecatedMap = {
        extraActions: { items: this.extraActions, showOn: 'always' },
        extraSeriesAreaActions: { items: this.extraSeriesAreaActions, showOn: 'series-area' },
        extraNodeActions: { items: this.extraNodeActions, showOn: 'series-node' },
        extraLegendItemActions: { items: this.extraLegendItemActions, showOn: 'legend-item' },
    };

    // Module context
    private readonly interactionManager: _ModuleSupport.InteractionManager;
    private readonly registry: _ModuleSupport.ContextMenuRegistry;

    // State
    private expandedItems: ContextMenuItem[] = [];
    private pickedNode: _ModuleSupport.SeriesNodeDatum<unknown> | undefined = undefined;
    private pickedLegendItem?: _ModuleSupport.CategoryLegendDatum;
    private showEvent: MouseEvent | undefined = undefined;
    private x: number = 0;
    private y: number = 0;

    // HTML elements
    private readonly element: HTMLElement;
    private menuElement?: HTMLDivElement;
    private menuCloser?: _ModuleSupport.MenuCloser;
    private readonly mutationObserver?: MutationObserver;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        // Module context
        this.interactionManager = ctx.interactionManager;
        this.registry = ctx.contextMenuRegistry;

        // State
        this.element = ctx.domManager.addChild('canvas-overlay', moduleId);
        this.element.classList.add(DEFAULT_CONTEXT_MENU_CLASS);
        this.element.addEventListener('contextmenu', (event) => event.preventDefault()); // AG-10223
        this.destroyFns.push(() => this.element.parentNode?.removeChild(this.element));

        this.doClose();

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

        this.ctx.contextMenuRegistry.builtins.items['download'].action = () => {
            const title = ctx.chartService.title;
            let fileName = 'image';
            if (title?.enabled && title?.text !== undefined) {
                fileName = title.text.replace(/\.+/, '');
            }
            this.ctx.chartService.publicApi?.download({ fileName }).catch((e) => {
                Logger.error('Unable to download chart', e);
            });
        };

        this.destroyFns.push(this.registry.addListener((e) => this.onContext(e)));
    }

    private expandItemsOptions() {
        const { builtins } = this.ctx.contextMenuRegistry;
        const { expandedItems, deprecationMap } = this;
        expandedItems.length = 0;

        for (const item of this.items) {
            if (typeof item === 'string') {
                expandBuiltin(builtins, item, expandedItems);
            }
        }

        for (const deprecatedKey of Object.keys(deprecationMap) as (keyof typeof deprecationMap)[]) {
            const { items, showOn } = deprecationMap[deprecatedKey];
            if (items.length > 0) {
                const type = 'action';
                const iconUrl = undefined;
                const enable = true;
                expandBuiltin(builtins, 'separator', expandedItems);
                for (const { action, label } of items) {
                    expandedItems.push(new ContextMenuItem({ type, showOn, iconUrl, enable, label, action }));
                }
            }
        }

        cleanUpSeparators(expandedItems);
    }

    private onContext(event: ContextMenuEvent) {
        if (!this.enabled) return;
        event.sourceEvent.preventDefault();

        this.showEvent = event.sourceEvent as MouseEvent;
        this.x = event.x;
        this.y = event.y;
        this.pickedNode = undefined;
        this.pickedLegendItem = undefined;
        this.expandItemsOptions();

        if (this.expandedItems.length === 0) return;
        this.show(event.sourceEvent);
    }

    private show(sourceEvent: _ModuleSupport.MouseEventWithPointerType) {
        this.interactionManager.pushState(_ModuleSupport.InteractionState.ContextMenu);
        this.element.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);

        const newMenuElement = this.renderMenu();

        this.menuCloser?.close();
        if (this.menuElement) {
            this.element.replaceChild(newMenuElement, this.menuElement);
        } else {
            this.element.appendChild(newMenuElement);
        }

        this.menuElement = newMenuElement;

        this.element.style.display = 'block';

        const overrideFocusVisible = sourceEvent.pointerType === 'touch' ? false : undefined;
        const buttons = getChildrenOfType(newMenuElement, HTMLButtonElement);
        this.menuCloser = initMenuKeyNav({
            menu: newMenuElement,
            buttons,
            orientation: 'vertical',
            sourceEvent,
            overrideFocusVisible,
            autoCloseOnBlur: true,
            closeCallback: () => this.doClose(),
        });
        if (sourceEvent.pointerType === 'touch') {
            this.ctx.chartService.overrideFocusVisible(false);
        }
    }

    private hide() {
        this.menuCloser?.close();
    }

    private doClose() {
        this.interactionManager.popState(_ModuleSupport.InteractionState.ContextMenu);

        if (this.menuElement) {
            this.element.removeChild(this.menuElement);
            this.menuElement = undefined;
            this.menuCloser = undefined;
        }

        this.element.style.display = 'none';
    }

    private renderMenu() {
        const menuElement = createElement('div');
        menuElement.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
        menuElement.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        menuElement.role = 'menu';

        for (const item of this.expandedItems) {
            switch (item.type) {
                case 'separator':
                    menuElement.append(this.createDividerElement());
                    break;
                case 'action':
                    menuElement.append(this.createActionElement(item));
                    break;
                case 'submenu':
                    break;
                default:
                    throw new Error('unhandled case');
            }
        }

        return menuElement;
    }

    private createDividerElement(): HTMLElement {
        const el = createElement('div');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__divider`);
        el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        el.role = 'separator';
        return el;
    }

    private createActionElement(item: ContextMenuItem): HTMLElement {
        const { showOn, label, action, enable } = item;
        return this.createButtonElement(showOn, label, action, !enable);
    }

    private createButtonOnClick(
        showOn: AgContextMenuItemShowOn,
        callback: ContextMenuCallback
    ): (event: MouseEvent) => void {
        if (ContextMenuRegistry.checkCallback('legend-item', showOn, callback)) {
            return (event: Event) => {
                if (this.pickedLegendItem) {
                    const { seriesId, itemId } = this.pickedLegendItem;
                    callback({ type: 'contextmenu', seriesId, itemId, event });
                    this.hide();
                }
            };
        } else if (ContextMenuRegistry.checkCallback('series-area', showOn, callback)) {
            return () => {
                callback({ type: 'seriesContextMenuAction', event: this.showEvent! });
                this.hide();
            };
        } else if (ContextMenuRegistry.checkCallback('series-node', showOn, callback)) {
            return () => {
                const { pickedNode, showEvent } = this;
                const event = pickedNode?.series.createNodeContextMenuActionEvent(showEvent!, pickedNode);

                if (event) {
                    callback(event);
                } else {
                    Logger.error('series node not found');
                }
                this.hide();
            };
        }
        return () => {
            callback({ type: 'contextMenuEvent', event: this.showEvent! });
            this.hide();
        };
    }

    private createButtonElement(
        showOn: AgContextMenuItemShowOn,
        label: string,
        callback: ContextMenuCallback | undefined,
        disabled: boolean
    ): HTMLElement {
        const el = createElement('button');
        el.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
        el.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        el.ariaDisabled = disabled.toString();
        el.textContent = this.ctx.localeManager.t(label);
        el.role = 'menuitem';
        if (callback != null) {
            el.onclick = makeAccessibleClickListener(el, this.createButtonOnClick(showOn, callback));
        }
        el.addEventListener('mouseover', () => el.focus({ preventScroll: true }));
        return el;
    }

    private reposition() {
        let { x, y } = this;

        this.element.style.top = 'unset';
        this.element.style.bottom = 'unset';

        const canvasRect = this.ctx.domManager.getBoundingClientRect();
        const { offsetWidth: width, offsetHeight: height } = this.element;

        x = clamp(0, x, canvasRect.width - width);
        y = clamp(0, y, canvasRect.height - height);

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
