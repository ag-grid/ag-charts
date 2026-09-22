import { type Logger, isObject } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import type { AnnotationDatumType } from '../annotationDatum';
import { AnnotationType } from '../annotationTypes';
import {
    type ChannelTypeDatum,
    createChannelTypeDatum,
    getChannelBottom,
    getChannelDefaultColor,
    getChannelDefaultOpacity,
} from '../datum/channelDatum';

export interface DisjointChannelDatum extends ChannelTypeDatum {
    type: AnnotationType.DisjointChannel;
    startHeight: AgNumericValue;
    endHeight: AgNumericValue;
}

export const disjointChannelDatum: AnnotationDatumType<DisjointChannelDatum> = {
    create: () => ({
        ...createChannelTypeDatum(),
        type: AnnotationType.DisjointChannel,
        startHeight: 0,
        endHeight: 0,
    }),
    is: (value): value is DisjointChannelDatum => isObject(value) && value.type === AnnotationType.DisjointChannel,
    getDefaultColor: getChannelDefaultColor,
    getDefaultOpacity: getChannelDefaultOpacity,
};

export function getDisjointChannelBottom(datum: DisjointChannelDatum, logger: Logger) {
    return getChannelBottom(datum, datum.startHeight, datum.endHeight, logger);
}
