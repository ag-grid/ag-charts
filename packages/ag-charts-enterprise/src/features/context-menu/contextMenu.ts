import type {
    AgAxisContextMenuActionEvent,
    AgCaptionContextMenuActionEvent,
    AgContextMenuGetItemsParams,
    AgContextMenuGetItemsParamsAlways,
    AgContextMenuGetItemsParamsAxis,
    AgContextMenuGetItemsParamsCaption,
    AgContextMenuGetItemsParamsCrossLine,
    AgContextMenuGetItemsParamsLegendItem,
    AgContextMenuGetItemsParamsSeriesArea,
    AgContextMenuGetItemsParamsSeriesNode,
    AgContextMenuItem,
    AgContextMenuItemShowOn,
    AgContextMenuShowOnParams,
    AgCrossLineContextMenuActionEvent,
    ContextDefault,
    DatumDefault,
} from 'ag-charts-community';
import { _ModuleSupport, _Widget } from 'ag-charts-community';
import type { DynamicContext } from 'ag-charts-core';
import {
    AbstractModuleInstance,
    callWithContext,
    clamp,
    createElement,
    getIconClassNames,
    toPlainText,
} from 'ag-charts-core';

import { ContextMenuItem, expandBuiltinLists, expandItems } from './contextMenuItem';
import { DEFAULT_CONTEXT_MENU_CLASS } from './contextMenuStyles';

type ContextShowOnMap = _ModuleSupport.ContextShowOnMap;
type ContextMenuEvent<K extends AgContextMenuItemShowOn = AgContextMenuItemShowOn> = _ModuleSupport.ContextMenuEvent<K>;
type ContextMenuCallback<K extends AgContextMenuItemShowOn = AgContextMenuItemShowOn> =
    _ModuleSupport.ContextMenuCallback<K>;

const { getItemId, ContextMenuRegistry } = _ModuleSupport;
type UnknownSeries = _ModuleSupport.ISeries<
    _ModuleSupport.SeriesNodeDatum,
    _ModuleSupport.SeriesProperties<object>,
    unknown
>;
type Caller = { context?: unknown } | undefined;

const moduleId = 'context-menu';

// `contextMenuRegistry` is optional on _ModuleSupport.ChartRegistry, but the context-menu module
// registers it in its own `register()` hook, so it is guaranteed present whenever
// ContextMenu is instantiated. Narrow once here rather than asserting `!`.
export type ContextMenuCtx = Omit<DynamicContext<_ModuleSupport.ChartRegistry>, 'contextMenuRegistry'> & {
    readonly contextMenuRegistry: _ModuleSupport.ContextMenuRegistry;
};

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

type PickedNode = _ModuleSupport.SeriesNodeDatum & {
    [K in (typeof DATUM_KEYS)[number]]?: string;
} & {
    binIndex?: number;
    binRange?: [number, number];
    aggregatedValue?: number;
    frequency?: number;
};

type ShowOnParams = AgContextMenuShowOnParams<DatumDefault, ContextDefault>;
type SeriesNodeParams = Extract<ShowOnParams, { showOn: 'series-node' }>;
type AxisParams = Extract<ShowOnParams, { showOn: 'axis' }>;
type CrossLineParams = Extract<ShowOnParams, { showOn: 'cross-line' }>;
type CaptionParams = Extract<ShowOnParams, { showOn: 'caption' }>;
type LegendItemParams = Extract<ShowOnParams, { showOn: 'legend-item' }>;
type GetItemsParams = [AgContextMenuGetItemsParams, Caller[]];

export class ContextMenu extends AbstractModuleInstance {
    private get opts() {
        return this.ctx.chartState.getValue('options', 'contextMenu') ?? {};
    }

    // Module context
    private readonly interactionManager: _ModuleSupport.InteractionManager;

    // State
    private pickedNodes?: ContextShowOnMap['series-node']['context'];
    private pickedLegendItem?: _ModuleSupport.CategoryLegendDatum;
    private pickedCaptionCtx?: ContextShowOnMap['caption']['context'];
    private pickedAxisCtx?: _ModuleSupport.AxisValuePick;
    private pickedCrossLine?: ContextShowOnMap['cross-line']['context'];
    private x: number = 0;
    private y: number = 0;
    private collapsingSubMenus = 0;

    // HTML elements
    private readonly element: HTMLElement;
    private readonly menuWidget: _Widget.MenuWidget = new _Widget.MenuWidget();
    private readonly mutationObserver?: MutationObserver;

    constructor(readonly ctx: ContextMenuCtx) {
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
                this.ctx.logger.error('Unable to download chart', e);
            });
        };

        this.cleanup.register(
            this.ctx.eventsHub.on('context-menu:complete', (e) => this.onContext(e)),
            this.ctx.eventsHub.on('layout:complete', () => this.updateAxisDOMProxy())
        );
    }

    private updateAxisDOMProxy() {
        const enabled = this.opts.enabled ?? true;
        this.ctx.eventsHub.emit('axis-dom-proxy:update', {
            source: moduleId,
            enabled,
            enableDoubleClick: false,
            enableDragging: false,
            enableScrolling: false,
            enableContextMenu: enabled,
        });
    }

    private axisRegion(pick: _ModuleSupport.AxisValuePick): AxisParams {
        const { axisId, boundSeries, direction, domain, value, index } = pick;
        return { showOn: 'axis', axisId, boundSeries, direction, domain, value, index };
    }

    private crossLineRegions(picks: ContextShowOnMap['cross-line']['context']): CrossLineParams[] {
        const result: CrossLineParams[] = [];
        for (const pick of picks) {
            const { crossLineId, axisId, direction, type, value, range } = pick;
            result.push({
                showOn: 'cross-line',
                crossLineId,
                axisId,
                direction,
                crossLineType: type,
                value: value as CrossLineParams['value'],
                range: range as CrossLineParams['range'],
            });
        }
        return result;
    }

    // Scopes that can overlap the series area: the area itself, an axis positioned inside it (e.g. `crossAt`),
    // and a cross line. These appear both as a primary and as a non-primary overlap, so they live here.
    private plotOverlapRegions(active: ReadonlySet<AgContextMenuItemShowOn>): ShowOnParams[] {
        const params: ShowOnParams[] = [];
        if (active.has('series-area')) params.push({ showOn: 'series-area' });
        if (active.has('axis') && this.pickedAxisCtx != null) params.push(this.axisRegion(this.pickedAxisCtx));
        if (active.has('cross-line') && this.pickedCrossLine != null) {
            params.push(...this.crossLineRegions(this.pickedCrossLine));
        }
        return params;
    }

    private makeGetItemsParams(event: ContextMenuEvent, active: ReadonlySet<AgContextMenuItemShowOn>): GetItemsParams {
        const { showOn } = event;
        const items = this.opts.items ?? ['defaults'];
        const defaultItems: AgContextMenuItem[] = expandBuiltinLists(active, items, this.ctx.contextMenuRegistry);
        switch (showOn) {
            case 'always':
                return this.makeGetItemsParamsAlways(defaultItems, active);
            case 'series-area':
                return this.makeGetItemsParamsSeriesArea(defaultItems, active);
            case 'series-node':
                return this.makeGetItemsParamsSeriesNode(defaultItems, active);
            case 'axis':
                return this.makeGetItemsParamsAxis(defaultItems, active);
            case 'cross-line':
                return this.makeGetItemsParamsCrossLine(defaultItems, active);
            case 'caption':
                return this.makeGetItemsParamsCaption(defaultItems);
            case 'legend-item':
                return this.makeGetItemsParamsLegendItem(defaultItems);
            default:
                return showOn satisfies never; // unreachable
        }
    }

    private makeGetItemsParamsAlways(
        defaultItems: AgContextMenuItem[],
        active: ReadonlySet<AgContextMenuItemShowOn>
    ): GetItemsParams {
        const params: AgContextMenuGetItemsParamsAlways<unknown, unknown> = {
            showOn: 'always',
            defaultItems,
            allShowOnParams: this.plotOverlapRegions(active),
        };
        const callers: Caller[] = [this.ctx.chartService];
        return [params, callers];
    }

    private makeGetItemsParamsSeriesArea(
        defaultItems: AgContextMenuItem[],
        active: ReadonlySet<AgContextMenuItemShowOn>
    ): GetItemsParams {
        const params: AgContextMenuGetItemsParamsSeriesArea<unknown, unknown> = {
            showOn: 'series-area',
            defaultItems,
            allShowOnParams: this.plotOverlapRegions(active),
        };
        const callers: Caller[] = [this.ctx.chartService];
        return [params, callers];
    }

    private makeGetItemsParamsSeriesNode(
        defaultItems: AgContextMenuItem[],
        active: ReadonlySet<AgContextMenuItemShowOn>
    ): GetItemsParams {
        if (this.pickedNodes == null) throw new Error(`this.pickedNodes is null`);
        const regions = this.pickedNodes.map((node: PickedNode): SeriesNodeParams => {
            // FIXME: Some optional keys like dataIdKey are not set. Is that a concern?
            const itemId = getItemId(node, node.series.data?.dataIdKey);
            const region: SeriesNodeParams = {
                showOn: 'series-node',
                seriesId: node.series.id,
                itemId,
                datum: node.datum,
                selectionState: node.series.getSelectionStateString(node.datumIndex),
                isCollapsed: node.series.getCollapsedState(itemId),
            };

            for (const k of DATUM_KEYS) {
                if (node[k] !== undefined) {
                    region[k] = node[k];
                }
            }

            // Histogram bins carry standardised bin metadata; binIndex is always set for histogram nodes.
            if (node.binIndex !== undefined) {
                const { datums, binIndex, binRange, aggregatedValue, frequency } = node;
                Object.assign(region, { datums, binIndex, binRange, aggregatedValue, frequency });
            }
            return region;
        });
        if (regions.length === 0) throw new Error(`this.pickedNodes is empty`);

        // The topmost node (hit-test order) wins. Nodes overlapping it at this contextmenu point are broadcast in
        // the allShowOnParams property.
        const allShowOnParams: ShowOnParams[] = [...this.plotOverlapRegions(active), ...regions];
        const params: AgContextMenuGetItemsParamsSeriesNode = { ...regions[0], defaultItems, allShowOnParams };
        const callers: Caller[] = [this.pickedNodes[0].series.properties, this.ctx.chartService];
        return [params, callers];
    }

    private makeGetItemsParamsAxis(
        defaultItems: AgContextMenuItem[],
        active: ReadonlySet<AgContextMenuItemShowOn>
    ): GetItemsParams {
        if (this.pickedAxisCtx == null) throw new Error(`this.pickedAxisCtx is null`);
        const region = this.axisRegion(this.pickedAxisCtx);
        const allShowOnParams: ShowOnParams[] = [region];
        if (active.has('series-area')) allShowOnParams.push({ showOn: 'series-area' });
        if (active.has('cross-line') && this.pickedCrossLine != null) {
            allShowOnParams.push(...this.crossLineRegions(this.pickedCrossLine));
        }
        const params: AgContextMenuGetItemsParamsAxis<DatumDefault, ContextDefault> = {
            ...region,
            defaultItems,
            allShowOnParams,
        };
        const callers: Caller[] = [this.pickedAxisCtx.caller, this.ctx.chartService];
        return [params, callers];
    }

    private makeGetItemsParamsCrossLine(
        defaultItems: AgContextMenuItem[],
        active: ReadonlySet<AgContextMenuItemShowOn>
    ): GetItemsParams {
        if (this.pickedCrossLine == null) throw new Error(`this.pickedCrossLine is null`);
        const regions = this.crossLineRegions(this.pickedCrossLine);
        if (regions.length === 0) throw new Error(`this.pickedCrossLine is empty`);

        // The first crossline (rendering order) wins. Overlapping crosslines at this contextmenu point will be
        // broadcast in the allShowOnParams property.
        const allShowOnParams: ShowOnParams[] = [...regions];
        if (active.has('series-area')) allShowOnParams.push({ showOn: 'series-area' });
        if (active.has('axis') && this.pickedAxisCtx != null) allShowOnParams.push(this.axisRegion(this.pickedAxisCtx));
        const params: AgContextMenuGetItemsParamsCrossLine<DatumDefault, ContextDefault> = {
            ...regions[0],
            defaultItems,
            allShowOnParams,
        };
        const callers: Caller[] = [this.ctx.chartService];
        return [params, callers];
    }

    private makeGetItemsParamsCaption(defaultItems: AgContextMenuItem[]): GetItemsParams {
        const ctx = this.pickedCaptionCtx;
        if (ctx == null) throw new Error(`this.pickedCaptionCtx is null`);
        const region: CaptionParams = { showOn: 'caption', captionType: ctx.captionType, text: ctx.text };
        const params: AgContextMenuGetItemsParamsCaption<DatumDefault, ContextDefault> = {
            ...region,
            defaultItems,
            allShowOnParams: [region],
        };
        const callers: Caller[] = [this.ctx.chartService];
        return [params, callers];
    }

    private makeGetItemsParamsLegendItem(defaultItems: AgContextMenuItem[]): GetItemsParams {
        if (this.pickedLegendItem == null) throw new Error(`this.pickedLegendItem is null`);
        const { itemId, seriesId, label, enabled } = this.pickedLegendItem;
        const text = toPlainText(label.text);
        const region: LegendItemParams = {
            showOn: 'legend-item',
            itemId,
            seriesId,
            text,
            visible: enabled,
        };
        const params: AgContextMenuGetItemsParamsLegendItem<DatumDefault, ContextDefault> = {
            ...region,
            defaultItems,
            allShowOnParams: [region],
        };
        const callers: Caller[] = [this.ctx.chartService];
        return [params, callers];
    }

    private expandItemsOptions(event: ContextMenuEvent): ContextMenuItem[] {
        const result: ContextMenuItem[] = [];
        const opts = this.opts;
        const active = new Set(event.regions);

        let items: readonly Readonly<AgContextMenuItem>[] | undefined;
        if (opts.getItems) {
            const [params, callers] = this.makeGetItemsParams(event, active);
            items = callWithContext(callers, opts.getItems, params);
        }
        items ??= opts.items ?? ['defaults'];

        expandItems(active, this.ctx.contextMenuRegistry, items, result);

        return result;
    }

    private onContext(event: ContextMenuEvent) {
        if (!(this.opts.enabled ?? true)) return;

        event.widgetEvent.sourceEvent.preventDefault();
        this.x = event.canvasX;
        this.y = event.canvasY;

        // Regions can overlap (e.g. a datum node over a crossing axis), so populate every picked context the
        // event carries rather than a single mutually-exclusive one; item actions route by their own showOn.
        const { contexts } = event;
        this.pickedNodes = contexts['series-node'];
        this.pickedAxisCtx = contexts.axis;
        this.pickedCaptionCtx = contexts.caption;
        this.pickedLegendItem = contexts['legend-item']?.legendItem;
        this.pickedCrossLine = contexts['cross-line'];

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

        this.createMenu(widgetEvent.sourceEvent, expandedItems);
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

        const { isRtl } = this.ctx.domManager;
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

        const preferredSide = isRtl ? 'left' : 'right';
        const preferredSpace = preferredSide === 'right' ? remainingSpaceOnRight : remainingSpaceOnLeft;

        if (preferredSpace >= menuOffsetWidth) {
            // Preferred-side popout
            const x = preferredSide === 'right' ? bounds.x + bounds.width : bounds.x - menuOffsetWidth;
            menu.setBounds({ x, y });
        } else {
            // Fallback-side popout
            const x = preferredSide === 'right' ? bounds.x - menuOffsetWidth : bounds.x + bounds.width;
            const delta = (preferredSide === 'right' ? remainingSpaceOnLeft : remainingSpaceOnRight) - menuOffsetWidth;
            if (delta >= 0) {
                menu.setBounds({ x, y });
            } else {
                // Clipped to the edge of the canvas
                menu.setBounds({ x: x + (preferredSide === 'right' ? -delta : delta), y });
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

    private createMenu(showEvent: MouseEvent, expandedItems: ContextMenuItem[]) {
        const { menuWidget } = this;
        menuWidget.clear();
        menuWidget.setTabIndex(-1);
        this.createMenuItems(showEvent, menuWidget, expandedItems);
    }

    private createMenuItems(showEvent: MouseEvent, menuWidget: _Widget.MenuWidget, expandedItems: ContextMenuItem[]) {
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
                        this.initButtonElement(showEvent, btn, item);
                        menuWidget.addChild(btn);
                    } else {
                        const { subMenuButton, subMenu } = menuWidget.addSubMenu();
                        subMenu.addClass(`${DEFAULT_CONTEXT_MENU_CLASS}__menu`);
                        subMenu.addListener('expand-widget', () => this.onSubMenuExpand(subMenuButton, subMenu));
                        subMenu.addListener('collapse-widget', () => this.onSubMenuCollapse(subMenuButton, subMenu));
                        this.initButtonElement(showEvent, subMenuButton, item);
                        this.createMenuItems(showEvent, subMenu, item.items);
                    }
                    break;
                }
                default:
                    throw new Error('unhandled case');
            }
        }
    }
    private createButtonOnClick(
        showEvent: MouseEvent,
        showOn: AgContextMenuItemShowOn,
        callback: ContextMenuCallback
    ): (event: _Widget.WidgetEvent) => void {
        if (ContextMenuRegistry.checkCallback('legend-item', showOn, callback)) {
            return (widgetEvent: _ModuleSupport.WidgetEvent) => {
                const event: Event = widgetEvent.sourceEvent;
                if (this.pickedLegendItem) {
                    const { seriesId, itemId, label } = this.pickedLegendItem;
                    const { chartService: chart } = this.ctx;
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
                    this.ctx.logger.error('legend item not found');
                }
            };
        } else if (ContextMenuRegistry.checkCallback('series-area', showOn, callback)) {
            return () => {
                const caller: Caller = this.ctx.chartService;
                const apiEvent = { type: 'seriesContextMenuAction', event: showEvent } as const;
                callWithContext(caller, callback, apiEvent);
                this.hide();
            };
        } else if (ContextMenuRegistry.checkCallback('series-node', showOn, callback)) {
            return () => {
                const { chartService: chart } = this.ctx;

                const pickedNode = this.pickedNodes?.[0];
                const callers: (Caller | undefined)[] = [pickedNode?.series.properties, chart];
                const apiEvent = pickedNode?.series.createNodeContextMenuActionEvent(showEvent, pickedNode);
                if (apiEvent) {
                    callWithContext(callers, callback, apiEvent);
                } else {
                    this.ctx.logger.error('series node not found');
                }
                this.hide();
            };
        } else if (ContextMenuRegistry.checkCallback('axis', showOn, callback)) {
            return () => {
                if (this.pickedAxisCtx) {
                    const { axisId, direction, boundSeries, domain, value, index } = this.pickedAxisCtx;
                    const callers: Caller[] = [this.pickedAxisCtx.caller, this.ctx.chartService];
                    const apiEvent: Omit<AgAxisContextMenuActionEvent<never>, 'context'> = {
                        type: 'axisContextMenuAction',
                        event: showEvent,
                        axisId,
                        direction,
                        boundSeries,
                        domain,
                        value,
                        index,
                    };
                    callWithContext(callers, callback, apiEvent);
                } else {
                    this.ctx.logger.error('axis item not found');
                }
                this.hide();
            };
        } else if (ContextMenuRegistry.checkCallback('cross-line', showOn, callback)) {
            return () => {
                if (this.pickedCrossLine && this.pickedCrossLine.length > 0) {
                    const { crossLineId, axisId, direction, type, value, range } = this.pickedCrossLine[0];
                    const callers: Caller = this.ctx.chartService;
                    const apiEvent: Omit<AgCrossLineContextMenuActionEvent<never>, 'context'> = {
                        type: 'crossLineContextMenuAction',
                        event: showEvent,
                        crossLineId,
                        axisId,
                        direction,
                        crossLineType: type,
                        value: value as AgCrossLineContextMenuActionEvent<never>['value'],
                        range: range as AgCrossLineContextMenuActionEvent<never>['range'],
                    };
                    callWithContext(callers, callback, apiEvent);
                } else {
                    this.ctx.logger.error('cross line item not found');
                }
                this.hide();
            };
        } else if (ContextMenuRegistry.checkCallback('caption', showOn, callback)) {
            return () => {
                if (this.pickedCaptionCtx) {
                    const { captionType, text } = this.pickedCaptionCtx;
                    const callers: Caller = this.ctx.chartService;
                    const apiEvent: Omit<AgCaptionContextMenuActionEvent<never>, 'context'> = {
                        type: 'captionContextMenuAction',
                        captionType,
                        text,
                        event: showEvent,
                    };
                    callWithContext(callers, callback, apiEvent);
                } else {
                    this.ctx.logger.error('caption item not found');
                }
                this.hide();
            };
        } else {
            return () => {
                const caller: Caller = this.ctx.chartService;
                const apiEvent = { type: 'contextMenuEvent', event: showEvent } as const;
                // Use `satisfies` to check that all other callback types (those with additional context-based parameters)
                // have been accounted for.
                callWithContext(caller, callback satisfies ContextMenuCallback<'always'>, apiEvent);
                this.hide();
            };
        }
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

    private initButtonElement(showEvent: MouseEvent, button: _Widget.MenuItemWidget, item: ContextMenuItem) {
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
            button.addListener('click', this.createButtonOnClick(showEvent, showOn, action));
        }
        if (item.items.length === 0) {
            // AG-14807 Design clear hover state
            // TODO: move this logic into MenuWidget
            button.addListener('mouseleave', () => button.setFocusOverride(false));
            button.addListener('mouseenter', () => button.setFocusOverride(undefined));
        }
    }

    private reposition() {
        const { isRtl } = this.ctx.domManager;
        let { x, y } = this;

        this.element.style.top = 'unset';
        this.element.style.bottom = 'unset';

        const canvasRect = this.ctx.domManager.getBoundingClientRect();
        const { offsetWidth: width, offsetHeight: height } = this.element;

        x = clamp(0, isRtl ? x - width : x, canvasRect.width - width);
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
