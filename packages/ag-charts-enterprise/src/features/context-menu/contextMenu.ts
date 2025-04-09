import type { AgContextMenuItemShowOn, AgContextMenuOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { Logger, clamp, createElement } from 'ag-charts-core';

import { DEFAULT_CONTEXT_MENU_CLASS, DEFAULT_CONTEXT_MENU_DARK_CLASS } from './contextMenuStyles';

type ContextMenuGroups = {
    default: Array<ContextMenuAction<AgContextMenuItemShowOn>>;
    extra: Array<ContextMenuAction<'always'>>;
    extraSeriesArea: Array<ContextMenuAction<'series-area'>>;
    extraNode: Array<ContextMenuAction<'series-node'>>;
    extraLegendItem: Array<ContextMenuAction<'legend-item'>>;
};
type ContextMenuEvent = _ModuleSupport.ContextMenuEvent;
type ContextMenuAction<T extends AgContextMenuItemShowOn> = _ModuleSupport.ContextMenuAction<T>;
type ContextMenuCallback<T extends AgContextMenuItemShowOn> = _ModuleSupport.ContextMenuCallback<T>;

type DeprecatedOption = 'extraActions' | 'extraNodeActions' | 'extraSeriesAreaActions' | 'extraLegendItemActions';
type DeprecatedAction<T extends DeprecatedOption> = NonNullable<AgContextMenuOptions[T]>;

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

export class ContextMenu extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Property
    enabled = true;

    @Property
    darkTheme = false;

    @Property
    items? = [];

    public extraActions: DeprecatedAction<'extraActions'> = [];
    public extraNodeActions: DeprecatedAction<'extraNodeActions'> = [];
    public extraSeriesAreaActions: DeprecatedAction<'extraSeriesAreaActions'> = [];
    public extraLegendItemActions: DeprecatedAction<'extraLegendItemActions'> = [];

    // Module context
    private readonly interactionManager: _ModuleSupport.InteractionManager;
    private readonly registry: _ModuleSupport.ContextMenuRegistry;

    // State
    private readonly groups: ContextMenuGroups;
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
        this.groups = { default: [], extra: [], extraSeriesArea: [], extraNode: [], extraLegendItem: [] };

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

        this.destroyFns.push(
            this.registry.registerDefaultAction({
                id: 'download',
                type: 'always',
                label: 'contextMenuDownload',
                action: () => {
                    const title = ctx.chartService.title;
                    let fileName = 'image';
                    if (title?.enabled && title?.text !== undefined) {
                        fileName = title.text.replace(/\.+/, '');
                    }
                    this.ctx.chartService.publicApi?.download({ fileName }).catch((e) => {
                        Logger.error('Unable to download chart', e);
                    });
                },
            })
        );

        this.destroyFns.push(this.registry.addListener((e) => this.onContext(e)));
    }

    private onContext(event: ContextMenuEvent) {
        if (!this.enabled) return;
        event.sourceEvent.preventDefault();

        this.showEvent = event.sourceEvent as MouseEvent;
        this.x = event.x;
        this.y = event.y;

        this.groups.default = this.registry.filterActions(event.type);

        for (const action of this.groups.default) {
            if (action.id == null || action.toggleEnabledOnShow == null) continue;
            if (action.toggleEnabledOnShow(event)) {
                this.registry.enableAction(action.id);
            } else {
                this.registry.disableAction(action.id);
            }
        }

        this.pickedNode = undefined;
        this.pickedLegendItem = undefined;

        this.groups.extra = this.extraActions.map(({ label, action }) => {
            return { type: 'always', label, action };
        });

        this.groups.extraSeriesArea = [];
        this.groups.extraNode = [];
        if (ContextMenuRegistry.check('series-area', event)) {
            this.pickedNode = event.context.pickedNode;

            this.groups.extraSeriesArea = this.extraSeriesAreaActions.map(({ label, action }) => {
                return { type: 'series-area', label, action };
            });

            if (this.pickedNode) {
                this.groups.extraNode = this.extraNodeActions.map(({ label, action }) => {
                    return { type: 'series-node', label, action };
                });
            }
        }

        this.groups.extraLegendItem = [];
        if (ContextMenuRegistry.check('legend-item', event)) {
            this.pickedLegendItem = event.context.legendItem;
            if (this.pickedLegendItem) {
                this.groups.extraLegendItem = this.extraLegendItemActions.map(({ label, action }) => {
                    return { type: 'legend-item', label, action };
                });
            }
        }

        const { default: def, extra, extraSeriesArea, extraNode, extraLegendItem } = this.groups;
        const groupCount = [def, extra, extraSeriesArea, extraNode, extraLegendItem].reduce((count, e) => {
            return e.length + count;
        }, 0);

        if (groupCount === 0) return;

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

        this.appendMenuGroup(menuElement, this.groups.default, false);

        this.appendMenuGroup(menuElement, this.groups.extra);

        this.appendMenuGroup(menuElement, this.groups.extraSeriesArea);

        if (this.pickedNode) {
            this.appendMenuGroup(menuElement, this.groups.extraNode);
        }

        if (this.pickedLegendItem) {
            this.appendMenuGroup(menuElement, this.groups.extraLegendItem);
        }

        return menuElement;
    }

    private appendMenuGroup<T extends AgContextMenuItemShowOn>(
        menuElement: HTMLElement,
        group: ContextMenuAction<T>[],
        divider = true
    ) {
        if (group.length === 0) return;
        if (divider) menuElement.appendChild(this.createDividerElement());
        group.forEach((i) => {
            const item = this.renderItem(i);
            if (item) menuElement.appendChild(item);
        });
    }

    private renderItem<T extends AgContextMenuItemShowOn>(item: ContextMenuAction<T>): HTMLElement | void {
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

    private createActionElement<T extends AgContextMenuItemShowOn>({
        id,
        label,
        type,
        action,
    }: ContextMenuAction<T>): HTMLElement {
        const disabled = !!(id && this.registry.isDisabled(id));
        return this.createButtonElement(type, label, action, disabled);
    }

    private createButtonOnClick<T extends AgContextMenuItemShowOn>(
        type: T,
        callback: ContextMenuCallback<AgContextMenuItemShowOn>
    ): (event: MouseEvent) => void {
        if (ContextMenuRegistry.checkCallback('legend-item', type, callback)) {
            return (event: Event) => {
                if (this.pickedLegendItem) {
                    const { seriesId, itemId } = this.pickedLegendItem;
                    callback({ type: 'contextmenu', seriesId, itemId, event });
                    this.hide();
                }
            };
        } else if (ContextMenuRegistry.checkCallback('series-area', type, callback)) {
            return () => {
                callback({ type: 'seriesContextMenuAction', event: this.showEvent! });
                this.hide();
            };
        } else if (ContextMenuRegistry.checkCallback('series-node', type, callback)) {
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

    private createButtonElement<T extends AgContextMenuItemShowOn>(
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
