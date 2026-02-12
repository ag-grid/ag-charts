import { type BoxBounds, type StrictHTMLElement, createElement, createElementId, toPlainText } from 'ag-charts-core';
import type { TextOrSegments } from 'ag-charts-types';

import type { LocaleManager } from '../../locale/localeManager';
import type { ModuleContext } from '../../module/moduleContext';
import { BBox } from '../../scene/bbox';
import type { Node } from '../../scene/node';
import type { Selection } from '../../scene/selection';
import { Transformable } from '../../scene/transformable';
import type { ButtonWidget } from '../../widget/buttonWidget';
import type { GroupWidget } from '../../widget/groupWidget';
import type { ListWidget } from '../../widget/listWidget';
import type { SwitchWidget } from '../../widget/switchWidget';
import type { MouseWidgetEvent } from '../../widget/widgetEvents';
import type { Page } from '../gridLayout';
import type { Pagination } from '../pagination/pagination';
import type { CategoryLegendDatum } from './legendDatum';
import type { LegendMarkerLabel } from './legendMarkerLabel';

type ItemSelection = Selection<LegendMarkerLabel, CategoryLegendDatum>;
type CategoryLegendDatumReader = { getItemLabel(datum: CategoryLegendDatum): TextOrSegments | undefined };

interface ButtonListener {
    onClick(event: Event, datum: CategoryLegendDatum, proxyButton: SwitchWidget): void;
    onDoubleClick(event: Event, datum: CategoryLegendDatum): void;
    onHover(event: FocusEvent | MouseEvent, node: LegendMarkerLabel): void;
    onLeave(): void;
    onContextClick(widgetEvent: MouseWidgetEvent<'contextmenu'>, node: LegendMarkerLabel): void;
}

type LegendDOMProxyUpdateParams = {
    visible: boolean;
    interactive: boolean;
    ctx: Pick<ModuleContext, 'proxyInteractionService' | 'localeManager'>;
    itemSelection: ItemSelection;
    group: Node;
    pagination: Pagination;
    oldPages: Page[] | undefined;
    newPages: Page[];
    datumReader: CategoryLegendDatumReader;
    itemListener: ButtonListener;
};

type LegendDOMProxyPageChangeParams = Pick<
    LegendDOMProxyUpdateParams,
    'itemSelection' | 'group' | 'pagination' | 'interactive'
>;

export class LegendDOMProxy {
    private dirty = true;

    private readonly itemList: ListWidget;
    private readonly itemDescription: HTMLParagraphElement & StrictHTMLElement;
    private readonly paginationGroup: GroupWidget;
    private prevButton?: ButtonWidget;
    private nextButton?: ButtonWidget;

    private shouldApplyHoverOnFocus(button: SwitchWidget): boolean {
        const element = button.getElement();
        return [':hover', ':focus-visible'].some((selector) => element.matches(selector));
    }

    public constructor(ctx: Pick<ModuleContext, 'proxyInteractionService' | 'localeManager'>, idPrefix: string) {
        this.itemList = ctx.proxyInteractionService.createProxyContainer({
            type: 'list',
            domManagerId: `${idPrefix}-toolbar`,
            classList: ['ag-charts-proxy-legend-toolbar'],
            ariaLabel: { id: 'ariaLabelLegend' },
        });
        this.paginationGroup = ctx.proxyInteractionService.createProxyContainer({
            type: 'group',
            domManagerId: `${idPrefix}-pagination`,
            classList: ['ag-charts-proxy-legend-pagination'],
            ariaLabel: { id: 'ariaLabelLegendPagination' },
        });
        this.itemDescription = createElement('p');
        this.itemDescription.style.display = 'none';
        this.itemDescription.id = createElementId();
        this.itemDescription.textContent = this.getItemAriaDescription(ctx.localeManager);
        this.itemList.getElement().append(this.itemDescription);
    }

    private initLegendList(params: LegendDOMProxyUpdateParams) {
        if (!this.dirty) return;

        const { ctx, itemSelection, datumReader, itemListener } = params;
        const lm = ctx.localeManager;
        const count = itemSelection.length;
        // CRT-752 TODO: this can be optimised with something like this.itemList.replaceChildren(), rather than adding
        // and removing each button one-by-one.
        itemSelection.each((markerLabel, datum, index) => {
            // Create the hidden CSS button.
            markerLabel.proxyButton?.destroy();
            markerLabel.proxyButton = ctx.proxyInteractionService.createProxyElement({
                type: 'listswitch',
                textContent: this.getItemAriaText(lm, toPlainText(datumReader.getItemLabel(datum)), index, count),
                ariaChecked: !!markerLabel.datum.enabled,
                ariaDescribedBy: this.itemDescription.id,
                parent: this.itemList,
            });
            // Retrieve the datum from the node rather than from the each() parameter.
            // The method parameter `datum` gets destroyed when the data is refreshed
            // using Series.getLegendData(). But the scene node will stay the same.
            const button = markerLabel.proxyButton;
            button.addListener('click', (ev) => itemListener.onClick(ev.sourceEvent, markerLabel.datum, button));
            button.addListener('dblclick', (ev) => itemListener.onDoubleClick(ev.sourceEvent, markerLabel.datum));
            button.addListener('mouseenter', (ev) => itemListener.onHover(ev.sourceEvent, markerLabel));
            button.addListener('mouseleave', () => itemListener.onLeave());
            button.addListener('contextmenu', (ev) => itemListener.onContextClick(ev, markerLabel));
            button.addListener('blur', () => itemListener.onLeave());
            button.addListener('focus', (ev) =>
                this.shouldApplyHoverOnFocus(button)
                    ? itemListener.onHover(ev.sourceEvent, markerLabel)
                    : itemListener.onLeave()
            );
            // Enable touch long-tap context menus:
            //
            // We don't actually need to listen for drag events. However, on of the quirks of `Widget` is that it only
            // adds a 'touchstart' listener if the widget has 'drag-*' listener(s), it's this 'touchstart' listener that
            // handles both touch dragging and long-taps. Rather than adding 'touchstart' listeners to all HTMLElement
            // (of which most don't even need one), we just add a dummy 'drag-start' to enable long-taps on legend
            // buttons.
            button.addListener('drag-start', () => {});
        });
        this.dirty = false;
    }

    public update(params: LegendDOMProxyUpdateParams) {
        if (params.visible) {
            this.initLegendList(params);
            this.updateItemProxyButtons(params);
            this.updatePaginationProxyButtons(params, true);
        }
        this.updateVisibility(params.visible);
    }

    private updateVisibility(visible: boolean) {
        this.itemList.setHidden(!visible);
        this.paginationGroup.setHidden(!visible);
    }

    private updateItemProxyButtons({ itemSelection, group, pagination, interactive }: LegendDOMProxyPageChangeParams) {
        const groupBBox = Transformable.toCanvas(group);
        this.itemList.setBounds(groupBBox);

        const maxHeight = Math.max(...itemSelection.nodes().map((l) => l.getTextMeasureBBox().height));
        itemSelection.each((l, _datum) => {
            if (l.proxyButton) {
                const visible = l.pageIndex === pagination.currentPage;

                const { x, y, height, width } = Transformable.toCanvas(l, l.getTextMeasureBBox());
                const margin = (maxHeight - height) / 2; // CRT-543 Give the legend items the same heights for a better look.
                const bbox: BoxBounds = { x: x - groupBBox.x, y: y - margin - groupBBox.y, height: maxHeight, width };

                const enabled = interactive && visible;
                l.proxyButton.setCursor('pointer');
                l.proxyButton.setEnabled(enabled);
                l.proxyButton.setPointerEvents(enabled ? undefined : 'none');
                l.proxyButton.setBounds(bbox);
            }
        });
    }

    private updatePaginationProxyButtons(
        params: LegendDOMProxyUpdateParams | LegendDOMProxyPageChangeParams,
        init: boolean
    ) {
        const { pagination } = params;
        this.paginationGroup.setHidden(!pagination.visible);

        if (init && 'ctx' in params) {
            const { oldPages, newPages } = params;
            const oldNeedsButtons = (oldPages?.length ?? newPages.length) > 1;
            const newNeedsButtons = newPages.length > 1;
            if (oldNeedsButtons !== newNeedsButtons) {
                if (newNeedsButtons) {
                    this.createPaginationButtons(params);
                } else {
                    this.destroyPaginationButtons();
                }
            }
            this.paginationGroup.setAriaHidden(newNeedsButtons ? undefined : true);
        }

        if (this.prevButton && this.nextButton) {
            const { prev, next } = pagination.computeCSSBounds();
            const group: BBox = BBox.merge([prev, next]);
            prev.x -= group.x;
            prev.y -= group.y;
            next.x -= group.x;
            next.y -= group.y;
            this.paginationGroup.setBounds(group);
            this.prevButton.setBounds(prev);
            this.nextButton.setBounds(next);
            this.prevButton.setEnabled(pagination.currentPage !== 0);
            this.nextButton.setEnabled(pagination.currentPage !== pagination.totalPages - 1);
            this.nextButton.setCursor(pagination.getCursor('next'));
            this.prevButton.setCursor(pagination.getCursor('previous'));
        }
    }

    private createPaginationButtons(params: LegendDOMProxyUpdateParams) {
        const { ctx, pagination } = params;

        // Only create buttons if they don't exist to prevent duplicate event listeners
        if (!this.prevButton) {
            this.prevButton = ctx.proxyInteractionService.createProxyElement({
                type: 'button',
                textContent: { id: 'ariaLabelLegendPagePrevious' },
                tabIndex: 0,
                parent: this.paginationGroup,
            });
            this.prevButton.addListener('click', (ev) => this.onPageButton(params, ev, 'previous'));
            this.prevButton.addListener('mouseenter', () => pagination.onMouseHover('previous'));
            this.prevButton.addListener('mouseleave', () => pagination.onMouseHover(undefined));
        }

        if (!this.nextButton) {
            this.nextButton = ctx.proxyInteractionService.createProxyElement({
                type: 'button',
                textContent: { id: 'ariaLabelLegendPageNext' },
                tabIndex: 0,
                parent: this.paginationGroup,
            });
            this.nextButton.addListener('click', (ev) => this.onPageButton(params, ev, 'next'));
            this.nextButton.addListener('mouseenter', () => pagination.onMouseHover('next'));
            this.nextButton.addListener('mouseleave', () => pagination.onMouseHover(undefined));
        }
    }

    private destroyPaginationButtons() {
        this.nextButton?.destroy();
        this.prevButton?.destroy();
        this.nextButton = undefined;
        this.prevButton = undefined;
    }

    private onPageButton(params: LegendDOMProxyUpdateParams, ev: MouseWidgetEvent<'click'>, node: 'previous' | 'next') {
        params.pagination.onClick(ev.sourceEvent, node);
        this.updatePaginationProxyButtons(params, false);
    }

    public onDataUpdate(oldData: CategoryLegendDatum[], newData: CategoryLegendDatum[]) {
        this.dirty =
            oldData.length !== newData.length ||
            oldData.some((_v, index, _a) => {
                const [newValue, oldValue] = [newData[index], oldData[index]];
                return newValue.id !== oldValue.id;
            });
    }

    public onLocaleChanged(
        localeManager: LocaleManager,
        itemSelection: ItemSelection,
        datumReader: CategoryLegendDatumReader
    ) {
        const count = itemSelection.length;
        itemSelection.each(({ proxyButton }, datum, index) => {
            const button = proxyButton?.getElement();
            if (button != null) {
                const label = toPlainText(datumReader.getItemLabel(datum));
                button.textContent = this.getItemAriaText(localeManager, label, index, count);
            }
        });
        this.itemDescription.textContent = this.getItemAriaDescription(localeManager);
    }

    public onPageChange(params: LegendDOMProxyPageChangeParams) {
        this.updateItemProxyButtons(params);
        this.updatePaginationProxyButtons(params, false);
    }

    private getItemAriaText(
        localeManager: LocaleManager,
        label: string | undefined,
        index: number,
        count: number
    ): string {
        if (index >= 0 && label) {
            index++;
            return localeManager.t('ariaLabelLegendItem', { label, index, count });
        }
        return localeManager.t('ariaLabelLegendItemUnknown');
    }

    private getItemAriaDescription(localeManager: LocaleManager): string {
        return localeManager.t('ariaDescriptionLegendItem');
    }
}
