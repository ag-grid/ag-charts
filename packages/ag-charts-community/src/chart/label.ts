import { type RequireOptional, isPlainObject } from 'ag-charts-core';
import type {
    AgChartLabelFormatterParams,
    AgChartLabelOptions,
    FontStyle,
    FontWeight,
    Formatter,
    TimeIntervalUnit,
} from 'ag-charts-types';

import type { Scale, ScaleFormatParams } from '../scale/scale';
import { BBox } from '../scene/bbox';
import type { Matrix } from '../scene/matrix';
import type { PlacedLabelDatum } from '../scene/util/labelPlacement';
import { normalizeAngle360FromDegrees } from '../util/angle';
import { BaseProperties, Property } from '../util/properties';
import { type TextMeasurer, TextUtils } from '../util/textMeasurer';
import type { TimeInterval } from '../util/time';
import { intervalHierarchy, intervalRange, intervalUnit } from '../util/timeInterop';
import type { ChartAxisLabel, ChartAxisLabelFlipFlag } from './chartAxis';

export class Label<TParams = never, TDatum = any>
    extends BaseProperties
    implements AgChartLabelOptions<TDatum, RequireOptional<TParams>>
{
    @Property
    enabled = true;

    @Property
    color?: string;

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

    getFont(): string {
        return TextUtils.toFontString(this);
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
    parallelFlipFlag: ChartAxisLabelFlipFlag,
    backwardsCompatibleTopBaseline: boolean
): CanvasTextBaseline {
    if (parallel && !labelRotation) {
        const topBaseline = backwardsCompatibleTopBaseline ? 'hanging' : 'top';
        return sideFlag * parallelFlipFlag === -1 ? topBaseline : 'bottom';
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
    timeInterval: TimeInterval | TimeIntervalUnit | undefined
): string | undefined {
    if (format == null) return;

    if (typeof format === 'string') {
        return format;
    } else if (isPlainObject(format) && timeInterval != null) {
        return format[intervalUnit(timeInterval)];
    }
}

export function timeIntervalMaxLabelSize(
    scale: Scale<Date, number>,
    label: ChartAxisLabel,
    primaryLabel: ChartAxisLabel | undefined,
    domain: Date[],
    ticks: Date[],
    timeInterval: TimeInterval | TimeIntervalUnit,
    textMeasurer: TextMeasurer
) {
    const specifier =
        labelSpecifier(label.format, timeInterval) ?? (typeof label.format === 'string' ? label.format : undefined);

    const formatParams: ScaleFormatParams<Date> = {
        domain,
        ticks,
        fractionDigits: 0,
        specifier,
    };
    const labelFormatter = scale.tickFormatter(formatParams as ScaleFormatParams<any>);

    const hierarchy = timeInterval ? intervalHierarchy(timeInterval) : undefined;
    const primarySpecifier = labelSpecifier(primaryLabel?.format, hierarchy);
    const primaryLabelFormatter = primarySpecifier
        ? scale.tickFormatter({
              ...formatParams,
              specifier: primarySpecifier,
          } as ScaleFormatParams<any>)
        : labelFormatter;

    const d0 = new Date(scale.domain[0] as any);
    const d1 = new Date(scale.domain[scale.domain.length - 1] as any);

    const hierarchyRange = hierarchy?.range(
        new Date(scale.domain[0] as any),
        new Date(scale.domain[scale.domain.length - 1] as any),
        { extend: true }
    );

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
    tickData: { tickLabel: string | undefined; translationY: number }[],
    labelX: number,
    labelMatrix: Matrix,
    textMeasurer: TextMeasurer
) {
    const labelData: PlacedLabelDatum[] = [];

    for (const { tickLabel: text, translationY } of tickData) {
        if (!text) continue;

        const { x, y } = labelMatrix.transformBBox(new BBox(labelX, translationY, 0, 0));
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
