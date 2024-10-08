import { _ModuleSupport } from 'ag-charts-community';

import { arrowDownConfig } from './arrow-down/arrowDownConfig';
import { arrowUpConfig } from './arrow-up/arrowUpConfig';
import { calloutConfig } from './callout/calloutConfig';
import { commentConfig } from './comment/commentConfig';
import { horizontalLineConfig, verticalLineConfig } from './cross-line/crossLineConfig';
import { disjointChannelConfig } from './disjoint-channel/disjointChannelConfig';
import { arrowConfig, lineConfig } from './line/lineConfig';
import { datePriceRangeConfig, dateRangeConfig, priceRangeConfig } from './measurer/measurerConfig';
import { noteConfig } from './note/noteConfig';
import { parallelChannelConfig } from './parallel-channel/parallelChannelConfig';
import { textConfig } from './text/textConfig';

export const annotationConfigs = {
    // Lines
    [lineConfig.type]: lineConfig,
    [horizontalLineConfig.type]: horizontalLineConfig,
    [verticalLineConfig.type]: verticalLineConfig,

    // Channels
    [parallelChannelConfig.type]: parallelChannelConfig,
    [disjointChannelConfig.type]: disjointChannelConfig,

    // Texts
    [calloutConfig.type]: calloutConfig,
    [commentConfig.type]: commentConfig,
    [noteConfig.type]: noteConfig,
    [textConfig.type]: textConfig,

    // Shapes
    [arrowConfig.type]: arrowConfig,
    [arrowUpConfig.type]: arrowUpConfig,
    [arrowDownConfig.type]: arrowDownConfig,

    // Measurers
    [dateRangeConfig.type]: dateRangeConfig,
    [priceRangeConfig.type]: priceRangeConfig,
    [datePriceRangeConfig.type]: datePriceRangeConfig,
};

export function getTypedDatum(datum: unknown) {
    for (const { isDatum } of Object.values(annotationConfigs)) {
        if (isDatum(datum)) {
            return datum;
        }
    }
}
