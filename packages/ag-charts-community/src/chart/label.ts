import type {
    AgChartLabelFormatterParams,
    AgChartLabelOptions,
    FontStyle,
    FontWeight,
    Formatter,
} from 'ag-charts-types';

import { BBox } from '../scene/bbox';
import type { Matrix } from '../scene/matrix';
import type { PlacedLabelDatum } from '../scene/util/labelPlacement';
import { normalizeAngle360, toRadians } from '../util/angle';
import { BaseProperties } from '../util/properties';
import { type TextMeasurer, TextUtils } from '../util/textMeasurer';
import type { RequireOptional } from '../util/types';
import {
    BOOLEAN,
    COLOR_STRING,
    FONT_STYLE,
    FONT_WEIGHT,
    FUNCTION,
    POSITIVE_NUMBER,
    STRING,
    Validate,
} from '../util/validation';
import type { ChartAxisLabelFlipFlag } from './chartAxis';

export class Label<TParams = never, TDatum = any>
    extends BaseProperties
    implements AgChartLabelOptions<TDatum, RequireOptional<TParams>>
{
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(COLOR_STRING, { optional: true })
    color?: string;

    @Validate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle;

    @Validate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight;

    @Validate(POSITIVE_NUMBER)
    fontSize: number = 12;

    @Validate(STRING)
    fontFamily: string = 'Verdana, sans-serif';

    @Validate(FUNCTION, { optional: true })
    formatter?: Formatter<AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>>;

    getFont(): string {
        return TextUtils.toFontString(this);
    }
}

export function calculateLabelRotation(opts: {
    rotation?: number;
    parallel?: boolean;
    regularFlipRotation?: number;
    parallelFlipRotation?: number;
}): {
    configuredRotation: number;
    defaultRotation: number;
    parallelFlipFlag: ChartAxisLabelFlipFlag;
    regularFlipFlag: ChartAxisLabelFlipFlag;
} {
    const { parallelFlipRotation = 0, regularFlipRotation = 0 } = opts;
    const configuredRotation = opts.rotation ? normalizeAngle360(toRadians(opts.rotation)) : 0;
    const parallelFlipFlag =
        !configuredRotation && parallelFlipRotation >= 0 && parallelFlipRotation <= Math.PI ? -1 : 1;
    // Flip if the axis rotation angle is in the top hemisphere.
    const regularFlipFlag = !configuredRotation && regularFlipRotation >= 0 && regularFlipRotation <= Math.PI ? -1 : 1;

    let defaultRotation = 0;
    if (opts.parallel) {
        defaultRotation = (parallelFlipFlag * Math.PI) / 2;
    } else if (regularFlipFlag === -1) {
        defaultRotation = Math.PI;
    }

    return { configuredRotation, defaultRotation, parallelFlipFlag, regularFlipFlag };
}

export function getLabelSpacing(minSpacing: number, rotated?: boolean): number {
    if (!isNaN(minSpacing)) {
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
        return sideFlag * parallelFlipFlag === -1 ? 'hanging' : 'bottom';
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

export function createLabelData(
    tickData: { tickLabel: string; translationY: number }[],
    labelX: number,
    labelMatrix: Matrix,
    textMeasurer: TextMeasurer
) {
    const labelData: PlacedLabelDatum[] = [];

    for (const { tickLabel: text, translationY } of tickData) {
        if (!text) continue;

        const { width, height } = textMeasurer.measureLines(text);
        const bbox = new BBox(labelX, translationY, width, height);
        const translatedBBox = new BBox(labelX, translationY, 0, 0);

        labelMatrix.transformBBox(translatedBBox, bbox);

        const { x, y } = bbox;

        labelData.push({
            point: { x, y },
            label: { text, width, height },
        });
    }

    return labelData;
}
