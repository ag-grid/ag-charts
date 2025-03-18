import type {
    AgGradientColor,
    AgGradientColorBounds,
    AgGradientColorStop,
    AgGradientType,
    InteractionRange,
} from 'ag-charts-types';

import { BaseProperties } from '../../util/properties';
import {
    ARRAY,
    BOOLEAN,
    COLOR_STRING,
    INTERACTION_RANGE,
    LINE_DASH,
    NUMBER,
    OBJECT,
    POSITIVE_NUMBER,
    RATIO,
    REAL_NUMBER,
    STRING,
    TempValidate,
} from '../../util/validation';
import type { SeriesTooltip } from './seriesTooltip';

export class SeriesItemHighlightStyle extends BaseProperties {
    @TempValidate(COLOR_STRING, { optional: true })
    fill?: string = 'rgba(255,255,255, 0.33)';

    @TempValidate(RATIO, { optional: true })
    fillOpacity?: number;

    @TempValidate(COLOR_STRING, { optional: true })
    stroke?: string = `rgba(0, 0, 0, 0.4)`;

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number = 2;

    @TempValidate(RATIO, { optional: true })
    strokeOpacity?: number;

    @TempValidate(LINE_DASH, { optional: true })
    lineDash?: number[];

    @TempValidate(POSITIVE_NUMBER, { optional: true })
    lineDashOffset?: number;
}

class SeriesHighlightStyle extends BaseProperties {
    @TempValidate(POSITIVE_NUMBER, { optional: true })
    strokeWidth?: number;

    @TempValidate(RATIO, { optional: true })
    dimOpacity?: number;

    @TempValidate(BOOLEAN, { optional: true })
    enabled?: boolean;
}

class TextHighlightStyle extends BaseProperties {
    @TempValidate(COLOR_STRING, { optional: true })
    color?: string = 'black';
}

export class HighlightProperties extends BaseProperties {
    @TempValidate(BOOLEAN, { optional: true })
    enabled = true;
}

export class FillGradientDefaults
    extends BaseProperties<Required<AgGradientColor>>
    implements Required<AgGradientColor>
{
    @TempValidate(STRING)
    type: 'gradient' = 'gradient' as const;

    @TempValidate(ARRAY)
    colorStops: AgGradientColorStop[] = [];

    @TempValidate(STRING)
    bounds: AgGradientColorBounds = 'item';

    @TempValidate(STRING)
    gradient: AgGradientType = 'linear';

    @TempValidate(NUMBER)
    rotation: number = 0;

    @TempValidate(BOOLEAN)
    reverse: boolean = false;
}

export class HighlightStyle extends BaseProperties {
    @TempValidate(OBJECT)
    readonly item = new SeriesItemHighlightStyle();

    @TempValidate(OBJECT)
    readonly series = new SeriesHighlightStyle();

    @TempValidate(OBJECT)
    readonly text = new TextHighlightStyle();
}

export abstract class SeriesProperties<T extends object> extends BaseProperties<T> {
    @TempValidate(STRING, { optional: true })
    id?: string;

    // Private - use series.visible
    @TempValidate(BOOLEAN)
    protected readonly visible: boolean = true;

    @TempValidate(REAL_NUMBER, { optional: true })
    focusPriority?: number = Infinity;

    @TempValidate(BOOLEAN)
    showInLegend: boolean = true;

    @TempValidate(STRING)
    cursor = 'default';

    @TempValidate(INTERACTION_RANGE)
    nodeClickRange: InteractionRange = 'exact';

    @TempValidate(OBJECT)
    readonly highlight = new HighlightProperties();

    @TempValidate(OBJECT)
    readonly highlightStyle = new HighlightStyle();

    abstract tooltip: SeriesTooltip<never>;

    // user pass-through option: no validation-decorator required.
    context?: unknown;

    override handleUnknownProperties(unknownKeys: Set<string>, properties: T) {
        if ('context' in properties) {
            this.context = properties.context;
            unknownKeys.delete('context');
        }
    }
}
