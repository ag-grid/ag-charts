import type { AgNumericValue } from 'ag-charts-types';

import { defineAnnotationDatum } from '../annotationDatum';
import { type AnnotationContext, AnnotationType } from '../annotationTypes';
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

export const disjointChannelDatum = defineAnnotationDatum<DisjointChannelDatum>(
    AnnotationType.DisjointChannel,
    () => ({ ...createChannelTypeDatum(), startHeight: 0, endHeight: 0 }),
    {
        getDefaultColor: getChannelDefaultColor,
        getDefaultOpacity: getChannelDefaultOpacity,
    }
);

export function getDisjointChannelBottom(datum: DisjointChannelDatum, context: AnnotationContext) {
    return getChannelBottom(datum, datum.startHeight, datum.endHeight, context);
}
