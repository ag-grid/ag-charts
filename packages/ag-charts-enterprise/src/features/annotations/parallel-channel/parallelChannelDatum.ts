import type { Logger } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { type ChannelMiddleDatum, createChannelMiddleDatum, defineAnnotationDatum } from '../annotationDatum';
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

export const parallelChannelDatum = defineAnnotationDatum<ParallelChannelDatum>(
    AnnotationType.ParallelChannel,
    () => ({ ...createChannelTypeDatum(), height: 0, middle: createChannelMiddleDatum() }),
    {
        getDefaultColor: getChannelDefaultColor,
        getDefaultOpacity: getChannelDefaultOpacity,
    }
);

export function getParallelChannelBottom(datum: ParallelChannelDatum, logger: Logger) {
    return getChannelBottom(datum, datum.height, datum.height, logger);
}
