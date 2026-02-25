import {
    ActionOnSet,
    BaseProperties,
    ChartUpdateType,
    FONT_SIZE,
    ObserveChanges,
    Property,
    clamp,
    createId,
} from 'ag-charts-core';
import type { AgChartLegendOrientation, AgMarkerShape, FontStyle, FontWeight } from 'ag-charts-types';

import { Group, TranslatableGroup } from '../../scene/group';
import { Text } from '../../scene/shape/text';
import { type RotatableType, Transformable } from '../../scene/transformable';
import { Marker } from '../marker/marker';

class PaginationLabel extends BaseProperties {
    @Property
    color: string = 'black';

    @Property
    fontStyle?: FontStyle = undefined;

    @Property
    fontWeight?: FontWeight = undefined;

    @Property
    fontSize: number = FONT_SIZE.SMALL;

    @Property
    fontFamily: string = 'Verdana, sans-serif';
}

class PaginationMarkerStyle extends BaseProperties {
    @Property
    size = 15;

    @Property
    fill?: string = undefined;

    @Property
    fillOpacity?: number = undefined;

    @Property
    stroke?: string = undefined;

    @Property
    strokeWidth: number = 1;

    @Property
    strokeOpacity: number = 1;
}

class PaginationMarker extends BaseProperties {
    @ActionOnSet<PaginationMarker>({
        changeValue() {
            if (this.parent.marker === this) {
                this.parent.onMarkerShapeChange();
            }
        },
    })
    shape: AgMarkerShape = 'triangle';

    @Property
    size = 15;

    /**
     * Inner padding between a pagination button and the label.
     */
    @Property
    padding: number = 8;

    constructor(readonly parent: Pagination) {
        super();
    }
}

export class Pagination extends BaseProperties {
    static readonly className = 'Pagination';

    readonly id = createId(this);

    @Property
    readonly marker = new PaginationMarker(this);

    @Property
    readonly activeStyle = new PaginationMarkerStyle();

    @Property
    readonly inactiveStyle = new PaginationMarkerStyle();

    @Property
    readonly highlightStyle = new PaginationMarkerStyle();

    @Property
    readonly label = new PaginationLabel();

    private readonly group = new TranslatableGroup({ name: 'pagination' });
    private readonly labelNode: Text = new Text();
    private highlightActive?: 'previous' | 'next';

    constructor(
        private readonly chartUpdateCallback: (type: ChartUpdateType) => void,
        private readonly pageUpdateCallback: (newPage: number) => void
    ) {
        super();

        this.labelNode.setProperties({
            textBaseline: 'middle',
            textAlign: 'left',
            fontSize: FONT_SIZE.SMALL,
            fontFamily: 'Verdana, sans-serif',
            fill: 'black',
            y: 1,
        });

        this.group.append([this.nextButton, this.previousButton, this.labelNode]);

        this.update();
        this.updateMarkers();
    }

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

    private updateGroupVisibility() {
        this.group.visible = this.enabled && this.visible;
    }

    private readonly nextButton: RotatableType<Marker> = new Marker();
    private readonly previousButton: RotatableType<Marker> = new Marker();

    @ObserveChanges<Pagination>((target) => {
        target.applyRotations();
        target.updatePositions();
    })
    isRtl: boolean = false;

    @ObserveChanges<Pagination>((target) => target.applyRotations())
    orientation: AgChartLegendOrientation = 'vertical';

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

    update() {
        this.updateLabel();
        this.updatePositions();
        this.enableOrDisableButtons();
    }

    private updatePositions() {
        this.group.translationX = this.translationX;
        this.group.translationY = this.translationY;

        this.updateLabelPosition();
        this.updateButtonPositions();
    }

    private updateLabelPosition() {
        const { size: markerSize, padding: markerPadding } = this.marker;

        this.nextButton.size = markerSize;
        this.previousButton.size = markerSize;

        this.labelNode.x = markerSize / 2 + markerPadding;
    }

    private updateButtonPositions() {
        const labelBBox = this.labelNode.getBBox();
        const endX = labelBBox.width + (this.marker.size / 2 + this.marker.padding) * 2;

        if (this.isRtl && this.orientation === 'horizontal') {
            this.nextButton.translationX = 0;
            this.previousButton.translationX = endX;
        } else {
            this.previousButton.translationX = 0;
            this.nextButton.translationX = endX;
        }
    }

    private updateLabel() {
        const {
            currentPage,
            totalPages: pages,
            labelNode,
            label: { color, fontStyle, fontWeight, fontSize, fontFamily },
        } = this;

        labelNode.text = `${currentPage + 1} / ${pages}`;
        labelNode.fill = color;
        labelNode.fontStyle = fontStyle;
        labelNode.fontWeight = fontWeight;
        labelNode.fontSize = fontSize;
        labelNode.fontFamily = fontFamily;
    }

    updateMarkers() {
        const {
            nextButton,
            previousButton,
            nextButtonDisabled,
            previousButtonDisabled,
            activeStyle,
            inactiveStyle,
            highlightStyle,
            highlightActive,
        } = this;

        const buttonStyle = (button: 'next' | 'previous', disabled: boolean) => {
            if (disabled) {
                return inactiveStyle;
            } else if (button === highlightActive) {
                return highlightStyle;
            }

            return activeStyle;
        };

        this.updateMarker(nextButton, buttonStyle('next', nextButtonDisabled));
        this.updateMarker(previousButton, buttonStyle('previous', previousButtonDisabled));
    }

    private updateMarker(marker: Marker, style: PaginationMarkerStyle) {
        const { shape, size } = this.marker;
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
        this.updateMarkers();
        this.chartUpdateCallback(ChartUpdateType.SCENE_RENDER);
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

    onMarkerShapeChange() {
        this.updatePositions();
        this.updateMarkers();
        this.chartUpdateCallback(ChartUpdateType.SCENE_RENDER);
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
