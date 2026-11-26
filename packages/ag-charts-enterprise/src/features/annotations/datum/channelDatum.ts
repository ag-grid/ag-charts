import { BandScale, isNumericValue, subtractValues } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import {
    type BackgroundDatum,
    type ChannelTextDatum,
    type ExtendableFields,
    type LineStyleFields,
    type StrokeFields,
    createBackgroundDatum,
    createChannelTextDatum,
} from '../annotationDatum';
import type { AnnotationContext, AnnotationOptionsColorPickerType, DataPoint } from '../annotationTypes';
import { type StartEndDatum, createStartEndDatum } from './startEndDatum';

export interface ChannelTypeDatum extends StartEndDatum, StrokeFields, LineStyleFields, ExtendableFields {
    background: BackgroundDatum;
    text: ChannelTextDatum;
}

export function createChannelTypeDatum(): Omit<ChannelTypeDatum, 'type'> {
    return {
        ...createStartEndDatum(),
        background: createBackgroundDatum(),
        text: createChannelTextDatum(),
    };
}

export function getChannelDefaultColor(datum: ChannelTypeDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    switch (colorPickerType) {
        case 'fill-color':
            return datum.background.fill;
        case 'line-color':
            return datum.stroke;
        case 'text-color':
            return datum.text.color;
    }
}

export function getChannelDefaultOpacity(datum: ChannelTypeDatum, colorPickerType: AnnotationOptionsColorPickerType) {
    switch (colorPickerType) {
        case 'fill-color':
            return datum.background.fillOpacity;
        case 'line-color':
            return datum.strokeOpacity;
    }
}

/** The bottom edge, or `undefined` when the y-axis is a category axis or the values are not numeric. */
export function getChannelBottom(
    datum: ChannelTypeDatum,
    startHeight: AgNumericValue,
    endHeight: AgNumericValue,
    { logger, yAxis }: AnnotationContext
): { start: DataPoint; end: DataPoint } | undefined {
    const { start, end } = datum;

    if (BandScale.is(yAxis.scale) || !isNumericValue(start.y) || !isNumericValue(end.y)) {
        logger.warnOnce(`Annotation [${datum.type}] can only be used with a numeric y-axis.`);
        return;
    }

    return {
        start: { x: start.x, y: subtractValues(start.y, startHeight) },
        end: { x: end.x, y: subtractValues(end.y, endHeight) },
    };
}
