import type { AgChartLegendOrientation, FontStyle, FontWeight } from 'ag-charts-types';

import { TranslatableGroup } from '../../scene/group';
import type { Node } from '../../scene/node';
import { Text } from '../../scene/shape/text';
import { Rotatable, type RotatableType, Transformable } from '../../scene/transformable';
import { createId } from '../../util/id';
import { clamp } from '../../util/number';
import { BaseProperties } from '../../util/properties';
import { ActionOnSet } from '../../util/proxy';
import {
    COLOR_STRING,
    FONT_STYLE,
    FONT_WEIGHT,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} from '../../util/validation';
import { ChartUpdateType } from '../chartUpdateType';
import type { CursorManager } from '../interaction/cursorManager';
import type { RegionEvent, RegionManager } from '../interaction/regionManager';
import type { Marker } from '../marker/marker';
import { Triangle } from '../marker/triangle';
import { type MarkerShape, getMarker } from '../marker/util';

class PaginationLabel extends BaseProperties {
    @Validate(COLOR_STRING)
    color: string = 'black';

    @Validate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle = undefined;

    @Validate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight = undefined;

    @Validate(POSITIVE_NUMBER)
    fontSize: number = 12;

    @Validate(STRING)
    fontFamily: string = 'Verdana, sans-serif';
}

class PaginationMarkerStyle extends BaseProperties {
    @Validate(POSITIVE_NUMBER)
    size = 15;

    @Validate(COLOR_STRING, { optional: true })
    fill?: string = undefined;

    @Validate(RATIO, { optional: true })
    fillOpacity?: number = undefined;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string = undefined;

    @Validate(POSITIVE_NUMBER)
    strokeWidth: number = 1;

    @Validate(RATIO)
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
    shape: MarkerShape = Triangle;

    @Validate(POSITIVE_NUMBER)
    size = 15;

    /**
     * Inner padding between a pagination button and the label.
     */
    @Validate(POSITIVE_NUMBER)
    padding: number = 8;

    constructor(readonly parent: Pagination) {
        super();
    }
}

export class Pagination extends BaseProperties {
    static readonly className = 'Pagination';

    readonly id = createId(this);

    @Validate(OBJECT)
    readonly marker = new PaginationMarker(this);

    @Validate(OBJECT)
    readonly activeStyle = new PaginationMarkerStyle();

    @Validate(OBJECT)
    readonly inactiveStyle = new PaginationMarkerStyle();

    @Validate(OBJECT)
    readonly highlightStyle = new PaginationMarkerStyle();

    @Validate(OBJECT)
    readonly label = new PaginationLabel();

    private readonly group = new TranslatableGroup({ name: 'pagination' });
    private readonly labelNode: Text = new Text();
    private highlightActive?: 'previous' | 'next';
    private readonly destroyFns: (() => void)[] = [];

    constructor(
        private readonly chartUpdateCallback: (type: ChartUpdateType) => void,
        private readonly pageUpdateCallback: (newPage: number) => void,
        private readonly regionManager: RegionManager,
        private readonly cursorManager: CursorManager
    ) {
        super();

        this.labelNode.setProperties({
            textBaseline: 'middle',
            fontSize: 12,
            fontFamily: 'Verdana, sans-serif',
            fill: 'black',
            y: 1,
        });

        this.group.append([this.nextButton, this.previousButton, this.labelNode]);

        const region = this.regionManager.addRegion('pagination', this.group);
        this.destroyFns.push(
            region.addListener('click', (event) => this.onPaginationClick(event)),
            region.addListener('hover', (event) => this.onPaginationMouseMove(event))
        );

        this.update();
        this.updateMarkers();
    }

    destroy() {
        this.destroyFns.forEach((f) => f());
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

    private _orientation: AgChartLegendOrientation = 'vertical';
    set orientation(value: AgChartLegendOrientation) {
        this._orientation = value;

        switch (value) {
            case 'horizontal': {
                this.previousButton.rotation = -Math.PI / 2;
                this.nextButton.rotation = Math.PI / 2;
                break;
            }
            case 'vertical':
            default: {
                this.previousButton.rotation = 0;
                this.nextButton.rotation = Math.PI;
            }
        }
    }
    get orientation() {
        return this._orientation;
    }

    private _nextButton: RotatableType<Marker> = new Triangle();
    set nextButton(value: RotatableType<Marker>) {
        if (this._nextButton !== value) {
            this.group.removeChild(this._nextButton);
            this._nextButton = value;
            this.group.appendChild(value);
        }
    }
    get nextButton() {
        return this._nextButton;
    }

    private _previousButton: RotatableType<Marker> = new Triangle();
    set previousButton(value: RotatableType<Marker>) {
        if (this._previousButton !== value) {
            this.group.removeChild(this._previousButton);
            this._previousButton = value;
            this.group.appendChild(value);
        }
    }
    get previousButton() {
        return this._previousButton;
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
        this.updateNextButtonPosition();
    }

    private updateLabelPosition() {
        const { size: markerSize, padding: markerPadding } = this.marker;

        this.nextButton.size = markerSize;
        this.previousButton.size = markerSize;

        this.labelNode.x = markerSize / 2 + markerPadding;
    }

    private updateNextButtonPosition() {
        const labelBBox = this.labelNode.getBBox();
        this.nextButton.translationX = labelBBox.width + (this.marker.size / 2 + this.marker.padding) * 2;
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
        const { size } = this.marker;
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

    public clickNext() {
        this.incrementPage();
        this.onPaginationChanged();
    }

    public clickPrevious() {
        this.decrementPage();
        this.onPaginationChanged();
    }

    public setPage(pageNumber: number) {
        pageNumber = clamp(0, pageNumber, this.totalPages - 1);
        if (this.currentPage !== pageNumber) {
            this.currentPage = pageNumber;
            this.onPaginationChanged();
        }
    }

    private onPaginationClick(event: RegionEvent<'click'>) {
        const { regionOffsetX, regionOffsetY } = event;
        event.preventDefault();

        const node = this.group.pickNode(regionOffsetX, regionOffsetY, true);
        if (node === this.nextButton && !this.nextButtonDisabled) {
            this.clickNext();
        } else if (node === this.previousButton && !this.previousButtonDisabled) {
            this.clickPrevious();
        }
    }

    private onPaginationMouseMove(event: RegionEvent<'hover'>) {
        const { regionOffsetX, regionOffsetY } = event;

        const node = this.group.pickNode(regionOffsetX, regionOffsetY, true);
        if (node === this.nextButton && !this.nextButtonDisabled) {
            this.cursorManager.updateCursor(this.id, 'pointer');
            this.highlightActive = 'next';
        } else if (node === this.previousButton && !this.previousButtonDisabled) {
            this.cursorManager.updateCursor(this.id, 'pointer');
            this.highlightActive = 'previous';
        } else {
            this.cursorManager.updateCursor(this.id);
            this.highlightActive = undefined;
        }

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
        const Marker = Rotatable(getMarker(this.marker.shape || Triangle));
        this.previousButton = new Marker();
        this.nextButton = new Marker();
        this.updatePositions();
        this.updateMarkers();
        this.chartUpdateCallback(ChartUpdateType.SCENE_RENDER);
    }

    attachPagination(node: Node) {
        node.append(this.group);
    }

    getBBox() {
        return this.group.getBBox(true);
    }

    computeCSSBounds() {
        const prev = Transformable.toCanvas(this.previousButton);
        const next = Transformable.toCanvas(this.nextButton);
        return { prev, next };
    }
}
