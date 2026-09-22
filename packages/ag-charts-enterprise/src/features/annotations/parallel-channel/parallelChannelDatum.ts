import { type Logger, isObject } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { type AnnotationDatumType, type ChannelMiddleDatum, createChannelMiddleDatum } from '../annotationDatum';
import { AnnotationType } from '../annotationTypes';
import {
    type ChannelTypeDatum,
    createChannelTypeDatum,
    getChannelBottom,
    getChannelDefaultColor,
    getChannelDefaultOpacity,
} from '../datum/channelDatum';

export interface ParallelChannelDatum extends ChannelTypeDatum {
    type: AnnotationType.ParallelChannel;
    height: AgNumericValue;
    middle: ChannelMiddleDatum;
}

export const parallelChannelDatum: AnnotationDatumType<ParallelChannelDatum> = {
    create: () => ({
        ...createChannelTypeDatum(),
        type: AnnotationType.ParallelChannel,
        height: 0,
        middle: createChannelMiddleDatum(),
    }),
    is: (value): value is ParallelChannelDatum => isObject(value) && value.type === AnnotationType.ParallelChannel,
    getDefaultColor: getChannelDefaultColor,
    getDefaultOpacity: getChannelDefaultOpacity,
};

export function getParallelChannelBottom(datum: ParallelChannelDatum, logger: Logger) {
    return getChannelBottom(datum, datum.height, datum.height, logger);
}
