import { type RequireOptional, isPlainObject } from 'ag-charts-core';
import type {
    AgChartLabelFormatterParams,
    AgChartLabelOptions,
    AgChartLabelStyleOptions,
    AgChartLabelStylerParams,
    AgTimeInterval,
    AgTimeIntervalUnit,
    ContextDefault,
    FontStyle,
    FontWeight,
    Formatter,
    Padding,
    Styler,
} from 'ag-charts-types';

import type { ContextFormatter } from '../module/axisContext';
import { BBox } from '../scene/bbox';
import type { Matrix } from '../scene/matrix';
import type { PlacedLabelDatum } from '../scene/util/labelPlacement';
import { normalizeAngle360FromDegrees } from '../util/angle';
import { BaseProperties, Property } from '../util/properties';
import { type TextMeasurer } from '../util/textMeasurer';
import { intervalHierarchy, intervalRange, intervalUnit } from '../util/time';
import { buildDateFormatter } from '../util/timeFormat';
import type { ChartAxisLabel, ChartAxisLabelFlipFlag } from './chartAxis';
import { FormatManager } from './formatter/formatManager';

interface FormatterCache {
    type: string;
    format: string;
    formatter: ((value: any, fractionDigits?: number) => string) | undefined;
}

export class LabelBorder {
    @Property
    enabled: boolean = true;

    @Property
    stroke?: string;

    @Property
    strokeWidth?: number;

    @Property
    strokeOpacity?: number;
}

export class Label<TParams = never, TDatum = any>
    extends BaseProperties
    implements AgChartLabelOptions<TDatum, RequireOptional<TParams>>
{
    @Property
    enabled = true;

    @Property
    border = new LabelBorder();

    @Property
    color?: string;

    @Property
    cornerRadius?: number;

    @Property
    fill?: string;

    @Property
    fillOpacity?: number;

    @Property
    fontStyle?: FontStyle;

    @Property
    fontWeight?: FontWeight;

    @Property
    fontSize!: number;

    @Property
    fontFamily!: string;

    @Property
    formatter?: Formatter<AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>>;

    @Property
    format?: string;

    @Property
    padding?: Padding;

    @Property
    itemStyler?: Styler<AgChartLabelStylerParams<TDatum, ContextDefault>, AgChartLabelStyleOptions>;

    private _cachedFormatter: FormatterCache | undefined = undefined;
    formatValue(
        formatWithContext: ContextFormatter<AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>>,
        type: 'number' | 'date' | 'category',
        value: any,
        params: AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>
    ) {
        const { formatter, format } = this;

        let result: string | undefined;
        if (formatter != null) {
            result ??= formatWithContext(formatter, params);
        }

        if (format != null) {
            let cachedFormatter = this._cachedFormatter;
            if (cachedFormatter == null || cachedFormatter.type !== type || cachedFormatter.format !== format) {
                cachedFormatter = {
                    type,
                    format,
                    formatter: FormatManager.getFormatter(type, format),
                };
                this._cachedFormatter = cachedFormatter;
            }

            result ??= cachedFormatter.formatter?.(value);
        }

        return result != null ? String(result) : undefined;
    }
}

export function calculateLabelRotation(
    rotation?: number,
    parallel?: boolean,
    regularFlipRotation: number = 0,
    parallelFlipRotation: number = 0
): {
    configuredRotation: number;
    defaultRotation: number;
    parallelFlipFlag: ChartAxisLabelFlipFlag;
    regularFlipFlag: ChartAxisLabelFlipFlag;
} {
    const configuredRotation = normalizeAngle360FromDegrees(rotation);
    const parallelFlipFlag =
        !configuredRotation && parallelFlipRotation >= 0 && parallelFlipRotation <= Math.PI ? -1 : 1;
    // Flip if the axis rotation angle is in the top hemisphere.
    const regularFlipFlag = !configuredRotation && regularFlipRotation >= 0 && regularFlipRotation <= Math.PI ? -1 : 1;

    let defaultRotation = 0;
    if (parallel) {
        defaultRotation = (parallelFlipFlag * Math.PI) / 2;
    } else if (regularFlipFlag === -1) {
        defaultRotation = Math.PI;
    }

    return { configuredRotation, defaultRotation, parallelFlipFlag, regularFlipFlag };
}

export function getLabelSpacing(minSpacing?: number, rotated?: boolean): number {
    if (minSpacing != null) {
        return minSpacing;
    }
    return rotated ? 0 : 10;
}

export function getTextBaseline(
    parallel: boolean,
    labelRotation: number,
    sideFlag: ChartAxisLabelFlipFlag,
    parallelFlipFlag: ChartAxisLabelFlipFlag
): CanvasTextBaseline {
    if (parallel && !labelRotation) {
        return sideFlag * parallelFlipFlag === -1 ? 'top' : 'bottom';
    }
    return 'middle';
}

export function getTextAlign(
    parallel: boolean,
    labelRotation: number,
    labelAutoRotation: number,
    sideFlag: ChartAxisLabelFlipFlag,
    regularFlipFlag: ChartAxisLabelFlipFlag
): CanvasTextAlign {
    const labelRotated = labelRotation > 0 && labelRotation <= Math.PI;
    const labelAutoRotated = labelAutoRotation > 0 && labelAutoRotation <= Math.PI;
    const alignFlag = labelRotated || labelAutoRotated ? -1 : 1;

    if (parallel) {
        if (labelRotation || labelAutoRotation) {
            if (sideFlag * alignFlag === -1) {
                return 'end';
            }
        } else {
            return 'center';
        }
    } else if (sideFlag * regularFlipFlag === -1) {
        return 'end';
    }

    return 'start';
}

export function labelSpecifier(
    format: ChartAxisLabel['format'] | undefined,
    timeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined
): string | undefined {
    if (format == null) return;

    if (typeof format === 'string') {
        return format;
    } else if (isPlainObject(format) && timeInterval != null) {
        return format[intervalUnit(timeInterval)];
    }
}

export function timeIntervalMaxLabelSize(
    label: ChartAxisLabel,
    primaryLabel: ChartAxisLabel | undefined,
    domain: Date[],
    timeInterval: AgTimeInterval | AgTimeIntervalUnit,
    textMeasurer: TextMeasurer
) {
    const specifier =
        labelSpecifier(label.format, timeInterval) ?? (typeof label.format === 'string' ? label.format : undefined);
    if (specifier == null) return { width: 0, height: 0 };

    const labelFormatter = buildDateFormatter(specifier);
    const hierarchy = timeInterval ? intervalHierarchy(timeInterval) : undefined;
    const primarySpecifier = labelSpecifier(primaryLabel?.format, hierarchy);
    const primaryLabelFormatter = primarySpecifier ? buildDateFormatter(primarySpecifier) : labelFormatter;

    const d0 = new Date(domain[0] as any);
    const d1 = new Date(domain[domain.length - 1] as any);

    const hierarchyRange = hierarchy
        ? intervalRange(hierarchy, new Date(domain[0] as any), new Date(domain[domain.length - 1] as any), {
              extend: true,
          })
        : undefined;

    let maxWidth = 0;
    let maxHeight = 0;
    if (labelFormatter != null) {
        let l0: Date;
        let l1: Date;
        if (hierarchyRange != null && hierarchyRange.length > 1) {
            l0 = hierarchyRange[0];
            l1 = hierarchyRange[1];
        } else {
            l0 = d0;
            l1 = d1;
        }
        const labelRange = intervalRange(timeInterval, l0, l1, { limit: 50 });
        for (const date of labelRange) {
            const text = labelFormatter(date);
            const { width, height } = textMeasurer.measureLines(text);
            maxWidth = Math.max(maxWidth, width);
            maxHeight = Math.max(maxHeight, height);
        }
    }

    if (primaryLabelFormatter != null && hierarchyRange != null) {
        for (const date of hierarchyRange) {
            const text = primaryLabelFormatter(date);
            const { width, height } = textMeasurer.measureLines(text);
            maxWidth = Math.max(maxWidth, width);
            maxHeight = Math.max(maxHeight, height);
        }
    }

    return {
        width: Math.ceil(maxWidth),
        height: Math.ceil(maxHeight),
    };
}

export function createLabelData(
    tickData: { tickLabel: string | undefined; translation: number }[],
    labelX: number,
    labelMatrix: Matrix,
    textMeasurer: TextMeasurer
) {
    const labelData: PlacedLabelDatum[] = [];

    for (const { tickLabel: text, translation } of tickData) {
        if (!text) continue;

        const { x, y } = labelMatrix.transformBBox(new BBox(labelX, translation, 0, 0));
        const { width, height } = textMeasurer.measureLines(text);
        labelData.push({
            point: { x, y },
            label: { text, width, height },
        });
    }

    return labelData;
}

export function createFixedLabelData(
    { width, height, spacing }: { width: number; height: number; spacing: number },
    labelX: number,
    labelMatrix: Matrix
): PlacedLabelDatum[] {
    const labelData: PlacedLabelDatum[] = [];

    for (const translationY of [0, spacing]) {
        const { x, y } = labelMatrix.transformBBox(new BBox(labelX, translationY, 0, 0));
        labelData.push({
            point: { x, y },
            label: { text: undefined!, width, height },
        });
    }

    return labelData;
}
