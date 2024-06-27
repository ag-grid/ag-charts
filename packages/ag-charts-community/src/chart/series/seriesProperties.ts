import type { InteractionRange } from 'ag-charts-types';

import { BaseProperties } from '../../util/properties';
import {
    BOOLEAN,
    COLOR_STRING,
    INTERACTION_RANGE,
    LINE_DASH,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    STRING,
    Validate,
} from '../../util/validation';
import type { SeriesTooltip } from './seriesTooltip';

export class SeriesItemHighlightStyle extends BaseProperties {
    @Validate(COLOR_STRING, { optional: true })
    fill?: string = 'rgba(255,255,255, 0.33)';

    @Validate(RATIO, { optional: true })
    fillOpacity?: number;

    @Validate(COLOR_STRING, { optional: true })
    stroke?: string = `rgba(0, 0, 0, 0.4)`;

    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number = 2;

    @Validate(RATIO, { optional: true })
    strokeOpacity?: number;

    @Validate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @Validate(POSITIVE_NUMBER, { optional: true })
    lineDashOffset?: number;
}

class SeriesHighlightStyle extends BaseProperties {
    @Validate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number;

    @Validate(RATIO, { optional: true })
    dimOpacity?: number;

    @Validate(BOOLEAN, { optional: true })
    enabled?: boolean;
}

class TextHighlightStyle extends BaseProperties {
    @Validate(COLOR_STRING, { optional: true })
    color?: string = 'black';
}

export class HighlightStyle extends BaseProperties {
    @Validate(OBJECT)
    readonly item = new SeriesItemHighlightStyle();

    @Validate(OBJECT)
    readonly series = new SeriesHighlightStyle();

    @Validate(OBJECT)
    readonly text = new TextHighlightStyle();
}

export abstract class SeriesProperties<T extends object> extends BaseProperties<T> {
    @Validate(STRING, { optional: true })
    id?: string;

    @Validate(BOOLEAN)
    visible: boolean = true;

    @Validate(BOOLEAN)
    showInLegend: boolean = true;

    @Validate(STRING)
    cursor = 'default';

    @Validate(INTERACTION_RANGE)
    nodeClickRange: InteractionRange = 'exact';

    @Validate(OBJECT)
    readonly highlightStyle = new HighlightStyle();

    abstract tooltip: SeriesTooltip<never>;
}
