import type { AgContextMenuItem, AgContextMenuItemShowOn, AgContextMenuOptions } from 'ag-charts-community';
import { _ModuleSupport, _Widget } from 'ag-charts-community';
import { type AnyFn, Logger, clamp, createElement } from 'ag-charts-core';

import { ContextMenuItem, expandItems } from './contextMenuItem';
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

const { Deprecated, Property, ContextMenuRegistry } = _ModuleSupport;

const moduleId = 'context-menu';
const DEPRECATION_MESSAGE = 'Use [items] instead';

export class ContextMenu extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @Property
    enabled = true;

    @Property
    darkTheme = false;

    @Property
    readonly items: readonly Readonly<AgContextMenuItem>[] = ['defaults'];

    @Deprecated(DEPRECATION_MESSAGE)
    public extraActions?: DeprecatedAction<'extraActions'>;
    @Deprecated(DEPRECATION_MESSAGE)
    public extraNodeActions?: DeprecatedAction<'extraNodeActions'>;
    @Deprecated(DEPRECATION_MESSAGE)
    public extraSeriesAreaActions?: DeprecatedAction<'extraSeriesAreaActions'>;
    @Deprecated(DEPRECATION_MESSAGE)
    public extraLegendItemActions?: DeprecatedAction<'extraLegendItemActions'>;

    private readonly deprecationMap: DeprecatedMap;

    // Module context
    private readonly interactionManager: _ModuleSupport.InteractionManager;
    private readonly registry: _ModuleSupport.ContextMenuRegistry;

    // State
    private pickedNode: _ModuleSupport.SeriesNodeDatum<unknown> | undefined = undefined;
    private pickedLegendItem?: _ModuleSupport.CategoryLegendDatum;
    private showEvent: MouseEvent | undefined = undefined;
    private x: number = 0;
    private y: number = 0;

    // HTML elements
    private readonly element: HTMLElement;
    private readonly menuWidget: _Widget.MenuWidget = new _Widget.MenuWidget();
    private readonly mutationObserver?: MutationObserver;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();
        const that = this;
        this.deprecationMap = {
            extraActions: {
                get items() {
                    return that.extraActions ?? [];
                },
                showOn: 'always',
            },
            extraSeriesAreaActions: {
                get items() {
                    return that.extraSeriesAreaActions ?? [];
                },
                showOn: 'series-area',
            },
            extraNodeActions: {
                get items() {
                    return that.extraNodeActions ?? [];
                },
                showOn: 'series-node',
            },
            extraLegendItemActions: {
                get items() {
                    return that.extraLegendItemActions ?? [];
                },
                showOn: 'legend-item',
            },
        };

        // Module context
        this.interactionManager = ctx.interactionManager;
        this.registry = ctx.contextMenuRegistry;

        // State
        this.element = ctx.domManager.addChild('canvas-overlay', moduleId);
        this.element.classList.add(DEFAULT_CONTEXT_MENU_CLASS);
        this.element.style.display = 'none';
        this.element.addEventListener('contextmenu', (event) => event.preventDefault()); // AG-10223
        // CRT-481 Automatically close the context menu when change focus with TAB / Shift+TAB
        this.element.addEventListener('focusout', ({ relatedTarget }) => {
            if (relatedTarget == null || (relatedTarget instanceof Node && !this.element.contains(relatedTarget))) {
                this.hide();
            }
        });
        this.destroyFns.push(
            () => this.element.parentNode?.removeChild(this.element),
            () => this.menuWidget.destroy(),
            ctx.domManager.addListener('hidden', () => this.hide()),
            this.menuWidget.addListener('close-widget', () => this.onClose())
        );
        this.menuWidget.addClass(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);

        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver(() => {
                if (this.element.contains(this.menuWidget.getElement())) {
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

        this.destroyFns.push(this.registry.addListener('context-complete', (e) => this.onContext(e)));
    }

    private createDeprecatedAdaptorItems(): typeof this.items {
        const result: AgContextMenuItem[] = [] satisfies typeof this.items;
        for (const deprecatedKey of Object.keys(this.deprecationMap) as (keyof typeof this.deprecationMap)[]) {
            const { items, showOn } = this.deprecationMap[deprecatedKey];
            result.push('separator');
            for (const { action, label } of items) {
                const type = 'action';
                const enabled = true;
                // Signature typing cannot be verified at compile, because callbacks in api options are just JS
                // functions assigned at runtime (typing info is lost).
                action satisfies AnyFn;
                result.push({ type, showOn, enabled, label, action: action as AnyFn });
            }
        }
        return result;
    }

    private expandItemsOptions(showing: AgContextMenuItemShowOn): ContextMenuItem[] {
        const result: ContextMenuItem[] = [];
        const deprecatedItems = this.createDeprecatedAdaptorItems();

        expandItems(showing, this.ctx.contextMenuRegistry, this.items, result);
        expandItems(showing, this.ctx.contextMenuRegistry, deprecatedItems, result);

        return result;
    }

    private onContext(event: ContextMenuEvent) {
        if (!this.enabled) return;

        event.widgetEvent.sourceEvent.preventDefault();
        this.showEvent = event.widgetEvent.sourceEvent;
        this.x = event.x;
        this.y = event.y;
        this.pickedNode = undefined;
        this.pickedLegendItem = undefined;
        if (ContextMenuRegistry.check('series-node', event)) {
            this.pickedNode = event.context.pickedNode;
        } else if (ContextMenuRegistry.check('legend-item', event)) {
            this.pickedLegendItem = event.context.legendItem;
        }

        const expandedItems = this.expandItemsOptions(event.showOn);
        if (expandedItems.length === 0) return;

        this.show(event.widgetEvent, expandedItems);
    }

    private show(widgetEvent: ContextMenuEvent['widgetEvent'], expandedItems: ContextMenuItem[]) {
        this.interactionManager.pushState(_ModuleSupport.InteractionState.ContextMenu);
        this.element.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        this.element.style.display = 'block';

        const overrideFocusVisible = widgetEvent.sourceEvent.pointerType === 'touch' ? false : undefined;
        if (overrideFocusVisible !== undefined) {
            this.ctx.chartService.overrideFocusVisible(overrideFocusVisible);
        }

        this.createMenu(expandedItems);
        this.element.appendChild(this.menuWidget.getElement());
        this.menuWidget.open(widgetEvent, { overrideFocusVisible });
    }

    private hide() {
        this.menuWidget.close();
    }

    private onClose() {
        this.interactionManager.popState(_ModuleSupport.InteractionState.ContextMenu);
        this.element.removeChild(this.menuWidget.getElement());
        this.element.style.display = 'none';
    }

    private onSubMenuOpen(button: _Widget.MenuItemWidget, menu: _Widget.MenuWidget) {
        const bounds = button.getBounds();
        button.setFocusOverride(true);
        button.getElement().insertAdjacentElement('afterend', menu.getElement());
        menu.getElement().style.position = 'absolute';

        const canvasRect = this.ctx.domManager.getBoundingClientRect();
        const buttonClientRect = button.getBoundingClientRect();
        const remainingSpaceOnRight = canvasRect.right - buttonClientRect.right;
        const remainingSpaceOnLeft = buttonClientRect.left - canvasRect.left;
        const { offsetWidth: menuOffsetWidth, offsetHeight: menuOffsetHeight } = menu.getElement();

        let y: number = bounds.y;
        // Clip the Y-position (if the submenu fits in the canvas).
        if (canvasRect.height > menuOffsetHeight) {
            const remainingSpaceOnBottom = canvasRect.bottom - buttonClientRect.top;
            if (remainingSpaceOnBottom < menuOffsetHeight) {
                y -= menuOffsetHeight - remainingSpaceOnBottom;
            }
        }

        if (remainingSpaceOnRight >= menuOffsetWidth) {
            // Right-side Popout
            menu.setBounds({ x: bounds.x + bounds.width, y });
        } else {
            // Left-side Popout
            const x = bounds.x - menuOffsetWidth;
            const leftDelta = remainingSpaceOnLeft + x;
            if (leftDelta >= 0) {
                // Regular Left-side Popout
                menu.setBounds({ x, y });
            } else {
                // Left-side Popout (clipped to the left edge of the canvas)
                menu.setBounds({ x: x - leftDelta, y });
            }
        }
    }
    private onSubMenuClose(button: _Widget.MenuItemWidget, menu: _Widget.MenuWidget) {
        button.setFocusOverride(undefined);
        menu.remove();
    }

    private createMenu(expandedItems: ContextMenuItem[]) {
        const { menuWidget } = this;
        menuWidget.clear();
        menuWidget.toggleClass(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        menuWidget.setTabIndex(-1);
        this.createMenuItems(menuWidget, expandedItems);
    }

    private createMenuItems(menuWidget: _Widget.MenuWidget, expandedItems: ContextMenuItem[]) {
        for (const item of expandedItems) {
            switch (item.type) {
                case 'separator':
                    const sep = menuWidget.addSeparator();
                    sep.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__divider`);
                    sep.classList.toggle(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
                    this.initTableCells(sep);
                    break;
                case 'action':
                    if (item.items.length === 0) {
                        const btn = new _Widget.MenuItemWidget();
                        this.initButtonElement(btn, item);
                        menuWidget.addChild(btn);
                    } else {
                        const { subMenuButton, subMenu } = menuWidget.addSubMenu();
                        subMenu.addClass(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
                        subMenu.addListener('open-widget', () => this.onSubMenuOpen(subMenuButton, subMenu));
                        subMenu.addListener('close-widget', () => this.onSubMenuClose(subMenuButton, subMenu));
                        this.initButtonElement(subMenuButton, item);
                        this.createMenuItems(subMenu, item.items);
                    }
                    break;
                default:
                    throw new Error('unhandled case');
            }
        }
    }
    private createButtonOnClick(
        showOn: AgContextMenuItemShowOn,
        callback: ContextMenuCallback
    ): (event: _Widget.MouseWidgetEvent) => void {
        if (ContextMenuRegistry.checkCallback('legend-item', showOn, callback)) {
            return (widgetEvent: _ModuleSupport.MouseWidgetEvent) => {
                const event: Event = widgetEvent.sourceEvent;
                if (this.pickedLegendItem) {
                    const { seriesId, itemId } = this.pickedLegendItem;
                    callback({ type: 'contextmenu', seriesId, itemId, event });
                    this.hide();
                } else {
                    Logger.error('legend item not found');
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

    private initTableCells(elem: Element) {
        const cellIcon = createElement('div');
        const cellLabel = createElement('div');
        const cellArrow = createElement('div');
        cellIcon.classList.toggle('ag-charts-context-menu__icon', true);
        cellLabel.classList.toggle('ag-charts-context-menu__label', true);
        cellArrow.classList.toggle('ag-charts-context-menu__rightarrowhead', true);
        cellIcon.ariaHidden = 'true';
        cellArrow.ariaHidden = 'true';
        elem.append(cellIcon, cellLabel, cellArrow);
        return { cellIcon, cellLabel, cellArrow };
    }

    private initButtonElement(button: _Widget.MenuItemWidget, item: ContextMenuItem) {
        button.addClass(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
        button.toggleClass(DEFAULT_CONTEXT_MENU_DARK_CLASS, this.darkTheme);
        button.setEnabled(item.enabled);
        const label = this.ctx.localeManager.t(item.label);

        const cellPaddingClass = `${DEFAULT_CONTEXT_MENU_CLASS}__cellpadding`;
        const { cellIcon, cellLabel, cellArrow } = this.initTableCells(button.getElement());
        cellLabel.textContent = label;
        cellLabel.classList.add(cellPaddingClass);
        if (item.iconUrl != null) {
            const img = createElement('img');
            img.src = item.iconUrl;
            cellIcon.append(img);
            cellIcon.classList.add(cellPaddingClass);
        }
        if (item.items.length > 0) {
            cellArrow.textContent = '❯';
            cellArrow.classList.add(cellPaddingClass);
        }

        const { showOn, action } = item;
        if (action != null) {
            button.addListener('click', this.createButtonOnClick(showOn, action));
        }
        button.addListener('mousemove', () => button.focus({ preventScroll: true }));
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
