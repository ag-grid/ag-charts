import type {
    AgContextMenuGetItemsCallback,
    AgContextMenuGetItemsParams,
    AgContextMenuGetItemsParamsSeriesNode,
    AgContextMenuItem,
    AgContextMenuItemShowOn,
} from 'ag-charts-community';
import { _ModuleSupport, _Widget } from 'ag-charts-community';
import {
    AbstractModuleInstance,
    Logger,
    Property,
    callWithContext,
    clamp,
    createElement,
    deepClone,
    getIconClassNames,
    toPlainText,
} from 'ag-charts-core';

import { ContextMenuItem, expandItems } from './contextMenuItem';
import { DEFAULT_CONTEXT_MENU_CLASS } from './contextMenuStyles';

type ContextMenuEvent = _ModuleSupport.ContextMenuEvent;
type ContextMenuCallback = _ModuleSupport.ContextMenuCallback<AgContextMenuItemShowOn>;

const { ContextMenuRegistry } = _ModuleSupport;
type UnknownSeries = _ModuleSupport.ISeries<
    _ModuleSupport.DatumIndexType,
    unknown,
    _ModuleSupport.SeriesProperties<object>,
    unknown
>;
type Caller = { context?: unknown } | undefined;

const moduleId = 'context-menu';

const DATUM_KEYS = [
    'angleKey',
    'calloutLabelKey',
    'colorKey',
    'labelKey',
    'radiusKey',
    'sectorLabelKey',
    'sizeKey',
    'xKey',
    'yKey',
] as const satisfies readonly (keyof AgContextMenuGetItemsParamsSeriesNode)[];

type PickedNode = _ModuleSupport.SeriesNodeDatum<_ModuleSupport.DatumIndexType> & {
    [K in (typeof DATUM_KEYS)[number]]?: string;
};

export class ContextMenu extends AbstractModuleInstance {
    @Property
    enabled = true;

    @Property
    darkTheme = false;

    @Property
    readonly items: readonly Readonly<AgContextMenuItem>[] = ['defaults'];

    @Property
    readonly getItems?: AgContextMenuGetItemsCallback;

    // Module context
    private readonly interactionManager: _ModuleSupport.InteractionManager;

    // State
    private pickedNode: PickedNode | undefined = undefined;
    private pickedLegendItem?: _ModuleSupport.CategoryLegendDatum;
    private showEvent: MouseEvent | undefined = undefined;
    private x: number = 0;
    private y: number = 0;
    private collapsingSubMenus = 0;

    // HTML elements
    private readonly element: HTMLElement;
    private readonly menuWidget: _Widget.MenuWidget = new _Widget.MenuWidget();
    private readonly mutationObserver?: MutationObserver;

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        super();

        // Module context
        this.interactionManager = ctx.interactionManager;

        // State
        this.element = ctx.domManager.addChild('canvas-overlay', moduleId);
        this.element.classList.add(DEFAULT_CONTEXT_MENU_CLASS);
        this.element.style.display = 'none';
        this.element.addEventListener('contextmenu', (event) => event.preventDefault()); // AG-10223
        // CRT-481 Automatically close the context menu when change focus with TAB / Shift+TAB
        this.element.addEventListener('focusout', ({ relatedTarget }) => {
            if (this.collapsingSubMenus > 0) return;
            if (relatedTarget == null || (relatedTarget instanceof Node && !this.element.contains(relatedTarget))) {
                this.hide();
            }
        });
        this.cleanup.register(
            () => this.element.remove(),
            () => this.menuWidget.destroy(),
            ctx.eventsHub.on('dom:hidden', () => this.hide()),
            this.menuWidget.addListener('collapse-widget', () => this.onCollapse())
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
            this.cleanup.register(() => observer.disconnect());
        }

        this.ctx.contextMenuRegistry.builtins.items['download'].action = () => {
            const title = ctx.chartService.title;
            let fileName = 'image';
            if (title?.enabled) {
                fileName = title.node.getPlainText().replace(/\.+/, '');
            }
            this.ctx.chartService.publicApi?.download({ fileName }).catch((e) => {
                Logger.error('Unable to download chart', e);
            });
        };

        this.cleanup.register(this.ctx.eventsHub.on('context-menu:complete', (e) => this.onContext(e)));
    }

    private makeGetItemsParams(event: ContextMenuEvent): AgContextMenuGetItemsParams {
        const { showOn } = event;
        const { context } = this.ctx.chartService; // TODO: callWithContext
        const defaultItems: AgContextMenuItem[] = deepClone([...this.items]);
        switch (showOn) {
            case 'always':
            case 'series-area':
                return { showOn, context, defaultItems };

            case 'series-node': {
                if (this.pickedNode == null) throw new Error(`this.pickedNode is null`);
                const params: AgContextMenuGetItemsParamsSeriesNode = {
                    showOn,
                    context,
                    seriesId: this.pickedNode.series.id,
                    datum: this.pickedNode.datum,
                    defaultItems,
                };

                for (const k of DATUM_KEYS) {
                    if (this.pickedNode[k] !== undefined) {
                        params[k] = this.pickedNode[k];
                    }
                }
                return params;
            }

            case 'legend-item':
                if (this.pickedLegendItem == null) throw new Error(`this.pickedLegendItem is null`);
                const { itemId, seriesId, label, enabled } = this.pickedLegendItem;
                const text = toPlainText(label.text);

                if (typeof itemId !== 'string') {
                    throw new Error(`unexpected itemId type: [${typeof itemId}] (expected [string])`);
                }

                return { showOn, context, itemId, seriesId, text, visible: enabled, defaultItems };

            default:
                return showOn satisfies never; // unreachable
        }
    }

    private expandItemsOptions(event: ContextMenuEvent): ContextMenuItem[] {
        const result: ContextMenuItem[] = [];

        let items: readonly Readonly<AgContextMenuItem>[] | undefined;
        if (this.getItems) {
            const cbParams = this.makeGetItemsParams(event);
            items = this.getItems(cbParams);
        }
        items ??= this.items;

        expandItems(event.showOn, this.ctx.contextMenuRegistry, items, result);

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

        const expandedItems = this.expandItemsOptions(event);
        if (expandedItems.length === 0) return;

        this.show(event.widgetEvent, expandedItems);
    }

    private show(widgetEvent: ContextMenuEvent['widgetEvent'], expandedItems: ContextMenuItem[]) {
        const { sourceEvent } = widgetEvent;
        this.interactionManager.pushState(_ModuleSupport.InteractionState.ContextMenu);
        this.element.style.display = 'block';

        const overrideFocusVisible = sourceEvent.pointerType === 'touch' ? false : undefined;
        if (overrideFocusVisible !== undefined) {
            this.ctx.chartService.overrideFocusVisible(overrideFocusVisible);
        }

        this.createMenu(expandedItems);
        this.element.appendChild(this.menuWidget.getElement());
        this.menuWidget.expand({ sourceEvent, overrideFocusVisible });
    }

    private hide() {
        this.menuWidget.collapse();
    }

    private onCollapse() {
        this.interactionManager.popState(_ModuleSupport.InteractionState.ContextMenu);
        this.menuWidget.getElement().remove();
        this.element.style.display = 'none';
    }

    private onSubMenuExpand(button: _Widget.MenuItemWidget, menu: _Widget.MenuWidget) {
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
    private onSubMenuCollapse(button: _Widget.MenuItemWidget, menu: _Widget.MenuWidget) {
        button.setFocusOverride(undefined);
        // AG-14931 Removing HTML elements can fire a 'focusout' event with `relatedTarget: null` and dismiss the whole
        // context menu, we want to avoid that.
        this.collapsingSubMenus++;
        menu.remove();
        this.collapsingSubMenus--;
    }

    private createMenu(expandedItems: ContextMenuItem[]) {
        const { menuWidget } = this;
        menuWidget.clear();
        menuWidget.setTabIndex(-1);
        this.createMenuItems(menuWidget, expandedItems);
    }

    private createMenuItems(menuWidget: _Widget.MenuWidget, expandedItems: ContextMenuItem[]) {
        for (const item of expandedItems) {
            switch (item.type) {
                case 'separator': {
                    const sep = menuWidget.addSeparator();
                    sep.classList.add(`${DEFAULT_CONTEXT_MENU_CLASS}__divider`);
                    break;
                }
                case 'action': {
                    if (item.items.length === 0) {
                        const btn = new _Widget.MenuItemWidget();
                        this.initButtonElement(btn, item);
                        menuWidget.addChild(btn);
                    } else {
                        const { subMenuButton, subMenu } = menuWidget.addSubMenu();
                        subMenu.addClass(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
                        subMenu.addListener('expand-widget', () => this.onSubMenuExpand(subMenuButton, subMenu));
                        subMenu.addListener('collapse-widget', () => this.onSubMenuCollapse(subMenuButton, subMenu));
                        this.initButtonElement(subMenuButton, item);
                        this.createMenuItems(subMenu, item.items);
                    }
                    break;
                }
                default:
                    throw new Error('unhandled case');
            }
        }
    }
    private createButtonOnClick(
        showOn: AgContextMenuItemShowOn,
        callback: ContextMenuCallback
    ): (event: _Widget.WidgetEvent) => void {
        if (ContextMenuRegistry.checkCallback('legend-item', showOn, callback)) {
            return (widgetEvent: _ModuleSupport.WidgetEvent) => {
                const event: Event = widgetEvent.sourceEvent;
                if (this.pickedLegendItem) {
                    const { seriesId, itemId, label } = this.pickedLegendItem;
                    const { chartService: chart } = this.ctx;
                    if (typeof itemId !== 'string') {
                        Logger.error(`unexpected itemId type: [${typeof itemId}] (expected [string])`);
                        return;
                    }

                    const series: UnknownSeries | undefined = chart.series.find((s) => s.id === seriesId);
                    const callers: Caller[] = [series?.properties, chart];
                    const apiEvent = {
                        type: 'contextmenu',
                        seriesId,
                        itemId,
                        text: toPlainText(label.text),
                        event,
                    } as const;
                    callWithContext(callers, callback, apiEvent);
                    this.hide();
                } else {
                    Logger.error('legend item not found');
                }
            };
        } else if (ContextMenuRegistry.checkCallback('series-area', showOn, callback)) {
            return () => {
                const caller: Caller = this.ctx.chartService;
                const apiEvent = { type: 'seriesContextMenuAction', event: this.showEvent! } as const;
                callWithContext(caller, callback, apiEvent);
                this.hide();
            };
        } else if (ContextMenuRegistry.checkCallback('series-node', showOn, callback)) {
            return () => {
                const { showEvent } = this;
                const { chartService: chart } = this.ctx;

                const pickedNode: undefined | { series: UnknownSeries } = this.pickedNode;
                const callers: Caller[] = [pickedNode?.series.properties, chart];
                const apiEvent = pickedNode?.series.createNodeContextMenuActionEvent(showEvent!, pickedNode);
                if (apiEvent) {
                    callWithContext(callers, callback, apiEvent);
                } else {
                    Logger.error('series node not found');
                }
                this.hide();
            };
        }
        return () => {
            const caller: Caller = this.ctx.chartService;
            const apiEvent = { type: 'contextMenuEvent', event: this.showEvent! } as const;
            callWithContext(caller, callback, apiEvent);
            this.hide();
        };
    }

    private initTableCells(elem: Element) {
        const cellIcon = createElement('div');
        const cellLabel = createElement('div');
        const cellArrow = createElement('div');
        cellIcon.classList.toggle(`${DEFAULT_CONTEXT_MENU_CLASS}__icon`, true);
        cellLabel.classList.toggle(`${DEFAULT_CONTEXT_MENU_CLASS}__cell`, true);
        cellArrow.classList.toggle(`${DEFAULT_CONTEXT_MENU_CLASS}__cell`, true);
        cellIcon.ariaHidden = 'true';
        cellLabel.role = 'presentation';
        cellArrow.ariaHidden = 'true';
        elem.append(cellIcon, cellLabel, cellArrow);
        return { cellIcon, cellLabel, cellArrow };
    }

    private initButtonElement(button: _Widget.MenuItemWidget, item: ContextMenuItem) {
        button.addClass(`${DEFAULT_CONTEXT_MENU_CLASS}__item`);
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
            const span = createElement('span', getIconClassNames('chevron-right'));
            cellArrow.append(span);
            cellArrow.classList.add(cellPaddingClass);
        }

        const { showOn, action } = item;
        if (action != null) {
            button.addListener('click', this.createButtonOnClick(showOn, action));
        }
        if (item.items.length === 0) {
            // AG-14807 Design clear hover state
            // TODO: move this logic into MenuWidget
            button.addListener('mouseleave', () => button.setFocusOverride(false));
            button.addListener('mouseenter', () => button.setFocusOverride(undefined));
        }
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
