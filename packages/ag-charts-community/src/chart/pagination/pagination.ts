import { type NormalisedLegendPaginationOptions, clamp, createId } from 'ag-charts-core';
import type { AgChartLegendOrientation } from 'ag-charts-types';

import { Group, TranslatableGroup } from '../../scene/group';
import { Text } from '../../scene/shape/text';
import { type RotatableType, Transformable } from '../../scene/transformable';
import { Marker } from '../marker/marker';

export type PaginationMarkerStyleValues = NormalisedLegendPaginationOptions['activeStyle'];

export class Pagination {
    static readonly className = 'Pagination';

    readonly id = createId(this);

    private readonly group = new TranslatableGroup({ name: 'pagination' });
    private readonly labelNode = new Text();
    private highlightActive?: 'previous' | 'next';

    private readonly nextButton: RotatableType<Marker> = new Marker();
    private readonly previousButton: RotatableType<Marker> = new Marker();

    totalPages: number = 0;
    currentPage: number = 0;
    translationX: number = 0;
    translationY: number = 0;

    private nextButtonDisabled = false;
    private previousButtonDisabled = false;

    private _visible: boolean = true;
    set visible(value: boolean) {
        this._visible = value;
        this.updateGroupVisibility();
    }
    get visible() {
        return this._visible;
    }

    private _enabled = true;
    set enabled(value: boolean) {
        this._enabled = value;
        this.updateGroupVisibility();
    }
    get enabled() {
        return this._enabled;
    }

    isRtl: boolean = false;
    orientation: AgChartLegendOrientation = 'vertical';

    constructor(
        private readonly chartUpdateCallback: () => void,
        private readonly pageUpdateCallback: (newPage: number) => void
    ) {
        this.labelNode.setProperties({
            textBaseline: 'middle',
            textAlign: 'left',
            text: '1 / 0',
            y: 1,
        });

        this.group.append([this.nextButton, this.previousButton, this.labelNode]);
    }

    private updateGroupVisibility() {
        this.group.visible = this.enabled && this.visible;
    }

    private applyRotations() {
        const { isRtl } = this;
        switch (this.orientation) {
            case 'horizontal': {
                this.previousButton.rotation = isRtl ? Math.PI / 2 : -Math.PI / 2;
                this.nextButton.rotation = isRtl ? -Math.PI / 2 : Math.PI / 2;
                break;
            }
            case 'vertical':
            default: {
                this.previousButton.rotation = 0;
                this.nextButton.rotation = Math.PI;
            }
        }
    }

    private lastOpts?: NormalisedLegendPaginationOptions;

    update(opts: NormalisedLegendPaginationOptions) {
        this.lastOpts = opts;
        this.applyRotations();
        this.updateLabel(opts);
        this.updatePositions(opts);
        this.enableOrDisableButtons();
    }

    private updatePositions(opts: NormalisedLegendPaginationOptions) {
        this.group.translationX = this.translationX;
        this.group.translationY = this.translationY;

        this.updateLabelPosition(opts);
        this.updateButtonPositions(opts);
    }

    private updateLabelPosition(opts: NormalisedLegendPaginationOptions) {
        const { size: markerSize, padding: markerPadding } = opts.marker;

        this.nextButton.size = markerSize;
        this.previousButton.size = markerSize;

        this.labelNode.x = markerSize / 2 + markerPadding.right;
    }

    private updateButtonPositions(opts: NormalisedLegendPaginationOptions) {
        const labelBBox = this.labelNode.getBBox();
        const endX = labelBBox.width + opts.marker.size + opts.marker.padding.left + opts.marker.padding.right;

        if (this.isRtl && this.orientation === 'horizontal') {
            this.nextButton.translationX = 0;
            this.previousButton.translationX = endX;
        } else {
            this.previousButton.translationX = 0;
            this.nextButton.translationX = endX;
        }
    }

    private updateLabel(opts: NormalisedLegendPaginationOptions) {
        const { isRtl, labelNode, currentPage, totalPages } = this;
        const { color, fontStyle, fontWeight, fontSize, fontFamily } = opts.label;
        const textLabels = [currentPage + 1, totalPages];
        if (isRtl) textLabels.reverse();

        labelNode.text = textLabels.join(' / ');
        labelNode.fill = color;
        labelNode.fontStyle = fontStyle;
        labelNode.fontWeight = fontWeight;
        labelNode.fontSize = fontSize;
        labelNode.fontFamily = fontFamily;
    }

    updateMarkers(opts: NormalisedLegendPaginationOptions) {
        const { nextButton, previousButton, nextButtonDisabled, previousButtonDisabled, highlightActive } = this;

        const buttonStyle = (button: 'next' | 'previous', disabled: boolean) => {
            if (disabled) {
                return opts.inactiveStyle;
            } else if (button === highlightActive) {
                return opts.highlightStyle;
            }
            return opts.activeStyle;
        };

        this.updateMarker(nextButton, opts, buttonStyle('next', nextButtonDisabled));
        this.updateMarker(previousButton, opts, buttonStyle('previous', previousButtonDisabled));
    }

    private updateMarker(marker: Marker, opts: NormalisedLegendPaginationOptions, style: PaginationMarkerStyleValues) {
        const { shape, size } = opts.marker;
        marker.shape = shape;
        marker.size = size;
        marker.fill = style.fill;
        marker.fillOpacity = style.fillOpacity ?? 1;
        marker.stroke = style.stroke;
        marker.strokeWidth = style.strokeWidth;
        marker.strokeOpacity = style.strokeOpacity;
    }

    private enableOrDisableButtons() {
        const { currentPage, totalPages } = this;
        const zeroPagesToDisplay = totalPages === 0;
        const onLastPage = currentPage === totalPages - 1;
        const onFirstPage = currentPage === 0;

        this.nextButtonDisabled = onLastPage || zeroPagesToDisplay;
        this.previousButtonDisabled = onFirstPage || zeroPagesToDisplay;
    }

    public setPage(pageNumber: number) {
        pageNumber = clamp(0, pageNumber, Math.max(0, this.totalPages - 1));
        if (this.currentPage !== pageNumber) {
            this.currentPage = pageNumber;
            this.onPaginationChanged();
        }
    }

    public getCursor(node: 'previous' | 'next') {
        return { previous: this.previousButtonDisabled, next: this.nextButtonDisabled }[node] ? undefined : 'pointer';
    }

    public onClick(event: MouseEvent | TouchEvent | KeyboardEvent, node: 'previous' | 'next') {
        event.preventDefault();
        if (node === 'next' && !this.nextButtonDisabled) {
            this.incrementPage();
            this.onPaginationChanged();
        } else if (node === 'previous' && !this.previousButtonDisabled) {
            this.decrementPage();
            this.onPaginationChanged();
        }
    }

    public onMouseHover(node: 'previous' | 'next' | undefined) {
        this.highlightActive = node;
        if (this.lastOpts) {
            this.updateMarkers(this.lastOpts);
        }
        this.chartUpdateCallback();
    }

    private onPaginationChanged() {
        this.pageUpdateCallback(this.currentPage);
    }

    private incrementPage() {
        this.currentPage = Math.min(this.currentPage + 1, this.totalPages - 1);
    }

    private decrementPage() {
        this.currentPage = Math.max(this.currentPage - 1, 0);
    }

    attachPagination(node: Group) {
        node.append(this.group);
    }

    getBBox() {
        return this.group.getBBox();
    }

    computeCSSBounds() {
        const prev = Transformable.toCanvas(this.previousButton);
        const next = Transformable.toCanvas(this.nextButton);
        return { prev, next };
    }
}
