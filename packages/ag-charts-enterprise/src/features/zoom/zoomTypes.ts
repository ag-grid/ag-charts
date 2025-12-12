import type { AgZoomAnchorPoint } from 'ag-charts-community';

export type ZoomCoords = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};

export interface ZoomProperties {
    anchorPointX: AgZoomAnchorPoint;
    anchorPointY: AgZoomAnchorPoint;
    enabled: boolean;
    independentAxes: boolean;
    isScalingX: boolean;
    isScalingY: boolean;
    keepAspectRatio: boolean;
    scrollingStep: number;
}
