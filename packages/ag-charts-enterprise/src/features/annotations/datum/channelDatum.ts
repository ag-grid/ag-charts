import { type Logger, isNumericValue, subtractValues } from 'ag-charts-core';
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
import type { AnnotationOptionsColorPickerType, DataPoint } from '../annotationTypes';
import { type StartEndDatum, createStartEndDatum } from './startEndDatum';

export interface ChannelTypeDatum extends StartEndDatum, StrokeFields, LineStyleFields, ExtendableFields {
    background: BackgroundDatum;
    text: ChannelTextDatum;
}

export function createChannelTypeDatum(): Omit<ChannelTypeDatum, 'type'> {
    return { ...createStartEndDatum(), background: createBackgroundDatum(), text: createChannelTextDatum() };
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

export function getChannelBottom(
    datum: ChannelTypeDatum,
    startHeight: AgNumericValue,
    endHeight: AgNumericValue,
    logger: Logger
): { start: DataPoint; end: DataPoint } {
    const bottom = {
        start: { x: datum.start.x, y: datum.start.y },
        end: { x: datum.end.x, y: datum.end.y },
    };

    if (isNumericValue(bottom.start.y) && isNumericValue(bottom.end.y)) {
        bottom.start.y = subtractValues(bottom.start.y, startHeight);
        bottom.end.y = subtractValues(bottom.end.y, endHeight);
    } else {
        logger.warnOnce(`Annotation [${datum.type}] can only be used with a numeric y-axis.`);
    }

    return bottom;
}
