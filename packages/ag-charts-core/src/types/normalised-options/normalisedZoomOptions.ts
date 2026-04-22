import type { AgZoomAutoScaling, AgZoomButtons, AgZoomOnDataChange, AgZoomOptions } from 'ag-charts-types';

import type { Normalised } from './normalise';

export type NormalisedZoomAutoScaling = Required<AgZoomAutoScaling>;
export type NormalisedZoomOnDataChange = Required<AgZoomOnDataChange>;
export type NormalisedZoomButtons = Normalised<
    AgZoomButtons,
    'enabled' | 'visible',
    { buttons: NonNullable<AgZoomButtons['buttons']> }
>;

export type NormalisedZoomOptions = Normalised<
    AgZoomOptions,
    | 'enabled'
    | 'enableAxisDragging'
    | 'enableAxisScrolling'
    | 'enableDoubleClickToReset'
    | 'enablePanning'
    | 'enableScrolling'
    | 'enableSelecting'
    | 'enableTwoFingerZoom'
    | 'deceleration'
    | 'minVisibleItems'
    | 'panKey'
    | 'scrollingStep'
    | 'anchorPointX'
    | 'anchorPointY'
    | 'axes'
    | 'autoScaling'
    | 'onDataChange'
    | 'buttons',
    {
        autoScaling: NormalisedZoomAutoScaling;
        onDataChange: NormalisedZoomOnDataChange;
        buttons: NormalisedZoomButtons;
    }
>;
