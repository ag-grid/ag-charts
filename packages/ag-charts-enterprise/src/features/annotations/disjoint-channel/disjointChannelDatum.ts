import type { Logger } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { defineAnnotationDatum } from '../annotationDatum';
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

export const disjointChannelDatum = defineAnnotationDatum<DisjointChannelDatum>(
    AnnotationType.DisjointChannel,
    () => ({ ...createChannelTypeDatum(), startHeight: 0, endHeight: 0 }),
    {
        getDefaultColor: getChannelDefaultColor,
        getDefaultOpacity: getChannelDefaultOpacity,
    }
);

export function getDisjointChannelBottom(datum: DisjointChannelDatum, logger: Logger) {
    return getChannelBottom(datum, datum.startHeight, datum.endHeight, logger);
}
