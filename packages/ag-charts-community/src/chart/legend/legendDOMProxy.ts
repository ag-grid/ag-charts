import {
    BBox,
    type BoxBounds,
    DescriptionWidget,
    type DynamicContext,
    type ElementID,
    type NormalisedTextOrSegments,
    Transformable,
    createElementId,
    toPlainText,
} from 'ag-charts-core';
import type {
    ButtonWidget,
    ClickWidgetEvent,
    FocusWidgetEvent,
    GroupWidget,
    ListWidget,
    MouseWidgetEvent,
    Node,
    Selection,
    SwitchWidget,
} from 'ag-charts-core';

import type { ChartRegistry } from '../../module/moduleContext';
import type { Page } from '../gridLayout';
import type { Pagination } from '../pagination/pagination';
import type { CategoryLegendDatum } from './legendDatum';
import type { LegendMarkerLabel } from './legendMarkerLabel';

export type LegendHoverEvent = FocusWidgetEvent<'focus'> | MouseWidgetEvent<'mouseenter'>;
export type LegendLeaveEvent = FocusWidgetEvent | MouseWidgetEvent<'mouseleave'>;

type ItemSelection = Selection<CategoryLegendDatum, LegendMarkerLabel>;
type CategoryLegendDatumReader = { getItemLabel(datum: CategoryLegendDatum): NormalisedTextOrSegments | undefined };

interface ButtonListener {
    onClick(event: Event, datum: CategoryLegendDatum, proxyButton: SwitchWidget): void;
    onDoubleClick(event: Event, datum: CategoryLegendDatum): void;
    onHover(event: LegendHoverEvent, node: LegendMarkerLabel): void;
    onLeave(event: LegendLeaveEvent): void;
    onContextClick(widgetEvent: MouseWidgetEvent<'contextmenu'>, node: LegendMarkerLabel): void;
}

interface LegendDOMProxyUpdateParams {
    visible: boolean;
    interactive: boolean;
    contextMenuAvailable: boolean;
    ctx: Pick<ChartRegistry, 'proxyInteractionService' | 'localeManager'>;
    itemSelection: ItemSelection;
    group: Node;
    pagination: Pagination;
    oldPages: Page[] | undefined;
    newPages: Page[];
    datumReader: CategoryLegendDatumReader;
    itemListener: ButtonListener;
}

type LegendDOMProxyPageChangeParams = Pick<
    LegendDOMProxyUpdateParams,
    'itemSelection' | 'group' | 'pagination' | 'interactive' | 'contextMenuAvailable'
>;

export class LegendDOMProxy {
    private dirty = true;

    private readonly itemList: ListWidget;
    private readonly itemDescription = new DescriptionWidget();
    private readonly itemDescriptionId: ElementID = createElementId();
    private readonly paginationGroup: GroupWidget;
    private prevButton?: ButtonWidget;
    private nextButton?: ButtonWidget;

    private shouldApplyHoverOnFocus(button: SwitchWidget): boolean {
        // Check `:hover` first: jsdom rejects the `:focus-visible` selector.
        return button.isHovered() || button.isFocusVisible();
    }

    public constructor(
        private readonly ctx: DynamicContext<ChartRegistry>,
        idPrefix: string
    ) {
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
        this.itemDescription.id = this.itemDescriptionId;
        this.itemDescription.setTextContent(this.getItemAriaDescription());
        this.itemList.setDescription(this.itemDescription);
    }

    private initLegendList(params: LegendDOMProxyUpdateParams) {
        if (!this.dirty) return;

        const { itemSelection, datumReader, itemListener } = params;
        const count = itemSelection.length;
        // CRT-752 TODO: this can be optimised with something like this.itemList.replaceChildren(), rather than adding
        // and removing each button one-by-one.
        itemSelection.each((markerLabel, datum, index) => {
            // Create the hidden CSS button.
            markerLabel.proxyButton?.destroy();
            markerLabel.proxyButton = this.ctx.proxyInteractionService.createProxyElement({
                type: 'listswitch',
                textContent: this.getItemAriaText(toPlainText(datumReader.getItemLabel(datum)), index, count),
                ariaChecked: !!markerLabel.unsafeNonNullDatum.enabled,
                ariaDescribedBy: this.itemDescriptionId,
                parent: this.itemList,
            });
            // Read the datum from the node: the `each()` parameter is destroyed when Series.getLegendData()
            // refreshes the data, while the scene node persists.
            const button = markerLabel.proxyButton;
            button.addListener('click', (ev) => itemListener.onClick(ev.sourceEvent, markerLabel.datum!, button));
            button.addListener('dblclick', (ev) => itemListener.onDoubleClick(ev.sourceEvent, markerLabel.datum!));
            button.addListener('mouseenter', (ev) => itemListener.onHover(ev, markerLabel));
            button.addListener('mouseleave', (ev) => itemListener.onLeave(ev));
            button.addListener('contextmenu', (ev) => itemListener.onContextClick(ev, markerLabel));
            button.addListener('blur', (ev) => itemListener.onLeave(ev));
            button.addListener('focus', (ev) =>
                this.shouldApplyHoverOnFocus(button) ? itemListener.onHover(ev, markerLabel) : itemListener.onLeave(ev)
            );
        });
        this.dirty = false;
    }

    public update(params: LegendDOMProxyUpdateParams) {
        if (params.visible) {
            this.initLegendList(params);
            this.syncItemLabels(params);
            this.updateItemProxyButtons(params);
            this.updatePaginationProxyButtons(params, true);
        }
        this.updateVisibility(params.visible);
    }

    private syncItemLabels({ itemSelection, datumReader }: LegendDOMProxyUpdateParams) {
        const count = itemSelection.length;
        itemSelection.each(({ proxyButton }, datum, index) => {
            if (proxyButton != null) {
                const text = this.getItemAriaText(toPlainText(datumReader.getItemLabel(datum)), index, count);
                if (proxyButton.getTextContent() !== text) {
                    proxyButton.setTextContent(text);
                }
            }
        });
    }

    private updateVisibility(visible: boolean) {
        this.itemList.setHidden(!visible);
        this.paginationGroup.setHidden(!visible);
    }

    private updateItemProxyButtons({
        itemSelection,
        group,
        pagination,
        interactive,
        contextMenuAvailable,
    }: LegendDOMProxyPageChangeParams) {
        const groupBBox = Transformable.toCanvas(group);
        this.itemList.setBounds(groupBBox);

        const maxHeight = Math.max(...itemSelection.nodes().map((l) => l.getTextMeasureBBox().height));
        itemSelection.each((l, datum) => {
            if (l.proxyButton) {
                const visible = l.pageIndex === pagination.currentPage;

                const { x, y, height, width } = Transformable.toCanvas(l, l.getTextMeasureBBox());
                const margin = (maxHeight - height) / 2; // Give the legend items the same heights for a better look.
                const bbox: BoxBounds = { x: x - groupBBox.x, y: y - margin - groupBBox.y, height: maxHeight, width };

                const enabled = interactive && visible;
                const pointerEnabled = (interactive || contextMenuAvailable) && visible;
                // Discrete colour-scale bin items don't toggle and don't drive series highlight, so the
                // pointer cursor is misleading — see `suppressHighlight` on CategoryLegendDatum.
                l.proxyButton.setCursor(datum.suppressHighlight ? 'default' : 'pointer');
                l.proxyButton.setEnabled(enabled);
                l.proxyButton.setPointerEvents(pointerEnabled ? undefined : 'none');
                l.proxyButton.setBounds(bbox);
                l.proxyButton.setAriaDescribedBy(enabled ? this.itemDescriptionId : undefined);
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

    private onPageButton(params: LegendDOMProxyUpdateParams, ev: ClickWidgetEvent, node: 'previous' | 'next') {
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

    public onLocaleChanged(itemSelection: ItemSelection, datumReader: CategoryLegendDatumReader) {
        const count = itemSelection.length;
        itemSelection.each(({ proxyButton }, datum, index) => {
            if (proxyButton != null) {
                const label = toPlainText(datumReader.getItemLabel(datum));
                proxyButton.setTextContent(this.getItemAriaText(label, index, count));
            }
        });
        this.itemDescription.setTextContent(this.getItemAriaDescription());
    }

    public onPageChange(params: LegendDOMProxyPageChangeParams) {
        this.updateItemProxyButtons(params);
        this.updatePaginationProxyButtons(params, false);
    }

    private getItemAriaText(label: string | undefined, index: number, count: number): string {
        if (index >= 0 && label != null && label !== '') {
            index++;
            return this.ctx.localeManager.t('ariaLabelLegendItem', { label, index, count });
        }
        return this.ctx.localeManager.t('ariaLabelLegendItemUnknown');
    }

    private getItemAriaDescription(): string {
        return this.ctx.localeManager.t('ariaDescriptionLegendItem');
    }
}
