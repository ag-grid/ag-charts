import { type BoxBounds, FONT_SIZE } from 'ag-charts-core';
import type { AgChartLegendOrientation, AgMarkerShape, FontStyle, FontWeight } from 'ag-charts-types';

import { Group, TranslatableGroup } from '../../scene/group';
import { Text } from '../../scene/shape/text';
import { type RotatableType, Transformable } from '../../scene/transformable';
import { Marker } from '../marker/marker';

export interface PaginationMarkerStyleValues {
    fill?: string;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth: number;
    strokeOpacity: number;
}

export interface PaginationRenderState {
    currentPage: number;
    totalPages: number;
    translationX: number;
    translationY: number;
    visible: boolean;
    enabled: boolean;
    isRtl: boolean;
    orientation: AgChartLegendOrientation;
    marker: { shape: AgMarkerShape; size: number; padding: number };
    activeStyle: PaginationMarkerStyleValues;
    inactiveStyle: PaginationMarkerStyleValues;
    highlightStyle: PaginationMarkerStyleValues;
    label: { color: string; fontStyle?: FontStyle; fontWeight?: FontWeight; fontSize: number; fontFamily: string };
    highlightActive?: 'previous' | 'next';
}

export class Pagination {
    static readonly className = 'Pagination';

    private readonly group = new TranslatableGroup({ name: 'pagination' });
    private readonly labelNode = new Text();
    private readonly nextButton: RotatableType<Marker> = new Marker();
    private readonly previousButton: RotatableType<Marker> = new Marker();

    constructor() {
        this.labelNode.setProperties({
            textBaseline: 'middle',
            textAlign: 'left',
            fontSize: FONT_SIZE.SMALL,
            fontFamily: 'Verdana, sans-serif',
            fill: 'black',
            y: 1,
        });

        this.group.append([this.nextButton, this.previousButton, this.labelNode]);
    }

    update(state: PaginationRenderState) {
        this.updateGroupVisibility(state);
        this.applyRotations(state);
        this.updateLabel(state);
        this.updatePositions(state);
        this.enableOrDisableButtons(state);
    }

    updateMarkers(state: PaginationRenderState) {
        const { nextButton, previousButton } = this;
        const { activeStyle, inactiveStyle, highlightStyle, highlightActive, marker } = state;
        const nextDisabled = this.isNextDisabled(state);
        const prevDisabled = this.isPreviousDisabled(state);

        const buttonStyle = (button: 'next' | 'previous', disabled: boolean) => {
            if (disabled) {
                return inactiveStyle;
            } else if (button === highlightActive) {
                return highlightStyle;
            }
            return activeStyle;
        };

        this.applyMarkerStyle(nextButton, marker, buttonStyle('next', nextDisabled));
        this.applyMarkerStyle(previousButton, marker, buttonStyle('previous', prevDisabled));
    }

    getCursor(node: 'previous' | 'next', state: PaginationRenderState): 'pointer' | undefined {
        const disabled = node === 'next' ? this.isNextDisabled(state) : this.isPreviousDisabled(state);
        return disabled ? undefined : 'pointer';
    }

    attachPagination(node: Group) {
        node.append(this.group);
    }

    getBBox() {
        return this.group.getBBox();
    }

    computeCSSBounds(): { prev: BoxBounds; next: BoxBounds } {
        const prev = Transformable.toCanvas(this.previousButton);
        const next = Transformable.toCanvas(this.nextButton);
        return { prev, next };
    }

    isNextDisabled(state: PaginationRenderState): boolean {
        return state.currentPage >= state.totalPages - 1 || state.totalPages === 0;
    }

    isPreviousDisabled(state: PaginationRenderState): boolean {
        return state.currentPage === 0 || state.totalPages === 0;
    }

    private updateGroupVisibility(state: PaginationRenderState) {
        this.group.visible = state.enabled && state.visible;
    }

    private applyRotations(state: PaginationRenderState) {
        const { isRtl } = state;
        switch (state.orientation) {
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

    private updatePositions(state: PaginationRenderState) {
        this.group.translationX = state.translationX;
        this.group.translationY = state.translationY;

        const { size: markerSize, padding: markerPadding } = state.marker;

        this.nextButton.size = markerSize;
        this.previousButton.size = markerSize;
        this.labelNode.x = markerSize / 2 + markerPadding;

        const labelBBox = this.labelNode.getBBox();
        const endX = labelBBox.width + (markerSize / 2 + markerPadding) * 2;

        if (state.isRtl && state.orientation === 'horizontal') {
            this.nextButton.translationX = 0;
            this.previousButton.translationX = endX;
        } else {
            this.previousButton.translationX = 0;
            this.nextButton.translationX = endX;
        }
    }

    private updateLabel(state: PaginationRenderState) {
        const { isRtl, currentPage, totalPages, label } = state;
        const textLabels = [currentPage + 1, totalPages];
        if (isRtl) textLabels.reverse();

        this.labelNode.text = textLabels.join(' / ');
        this.labelNode.fill = label.color;
        this.labelNode.fontStyle = label.fontStyle;
        this.labelNode.fontWeight = label.fontWeight;
        this.labelNode.fontSize = label.fontSize;
        this.labelNode.fontFamily = label.fontFamily;
    }

    private enableOrDisableButtons(_state: PaginationRenderState) {
        // Button disabled state is handled via marker styling in updateMarkers
    }

    private applyMarkerStyle(
        marker: Marker,
        shape: { shape: AgMarkerShape; size: number },
        style: PaginationMarkerStyleValues
    ) {
        marker.shape = shape.shape;
        marker.size = shape.size;
        marker.fill = style.fill;
        marker.fillOpacity = style.fillOpacity ?? 1;
        marker.stroke = style.stroke;
        marker.strokeWidth = style.strokeWidth;
        marker.strokeOpacity = style.strokeOpacity;
    }
}
