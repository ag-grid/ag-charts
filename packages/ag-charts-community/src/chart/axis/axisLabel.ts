import type { AgAxisLabelFormatterParams, FontStyle, FontWeight, Formatter } from 'ag-charts-types';

import { Default } from '../../util/default';
import { BaseProperties } from '../../util/properties';
import {
    BOOLEAN,
    COLOR_STRING,
    DEGREE,
    FONT_STYLE,
    FONT_WEIGHT,
    FUNCTION,
    NUMBER,
    NUMBER_OR_NAN,
    POSITIVE_NUMBER,
    STRING,
    Validate,
} from '../../util/validation';
import type { ChartAxisLabel, ChartAxisLabelFlipFlag } from '../chartAxis';

export class AxisLabel extends BaseProperties implements ChartAxisLabel {
    @Validate(BOOLEAN)
    enabled = true;

    /** If set to `false`, axis labels will not be wrapped on multiple lines. */
    @Validate(BOOLEAN, { optional: true })
    autoWrap: boolean = false;

    /** Used to constrain the width of the label when `autoWrap` is `true`, if the label text width exceeds the `maxWidth`, it will be wrapped on multiple lines automatically. If `maxWidth` is omitted, a default width constraint will be applied. */
    @Validate(POSITIVE_NUMBER, { optional: true })
    maxWidth?: number;

    /** Used to constrain the height of the multiline label, if the label text height exceeds the `maxHeight`, it will be truncated automatically. If `maxHeight` is omitted, a default height constraint will be applied. */
    @Validate(POSITIVE_NUMBER, { optional: true })
    maxHeight?: number;

    @Validate(FONT_STYLE, { optional: true })
    fontStyle?: FontStyle;

    @Validate(FONT_WEIGHT, { optional: true })
    fontWeight?: FontWeight;

    @Validate(NUMBER.restrict({ min: 1 }))
    fontSize: number = 12;

    @Validate(STRING)
    fontFamily: string = 'Verdana, sans-serif';

    /**
     * The padding between the labels and the ticks.
     */
    @Validate(POSITIVE_NUMBER)
    padding: number = 5;

    /**
     * Minimum gap in pixels between the axis labels before being removed to avoid collisions.
     */
    @Validate(NUMBER_OR_NAN)
    @Default(NaN)
    minSpacing: number = NaN;

    /**
     * The color of the labels.
     * Use `undefined` rather than `rgba(0, 0, 0, 0)` to make labels invisible.
     */
    @Validate(COLOR_STRING, { optional: true })
    color?: string = 'rgba(87, 87, 87, 1)';

    /**
     * Custom label rotation in degrees.
     * Labels are rendered perpendicular to the axis line by default.
     * Or parallel to the axis line, if the {@link parallel} is set to `true`.
     * The value of this config is used as the angular offset/deflection
     * from the default rotation.
     */
    @Validate(DEGREE, { optional: true })
    rotation?: number;

    /**
     * Avoid axis label collision by automatically reducing the number of ticks displayed. If set to `false`, axis labels may collide.
     */
    @Validate(BOOLEAN)
    avoidCollisions: boolean = true;

    /**
     * By default, labels and ticks are positioned to the left of the axis line.
     * `true` positions the labels to the right of the axis line.
     * However, if the axis is rotated, it's easier to think in terms
     * of this side or the opposite side, rather than left and right.
     * We use the term `mirror` for conciseness, although it's not
     * true mirroring - for example, when a label is rotated, so that
     * it is inclined at the 45 degree angle, text flowing from north-west
     * to south-east, ending at the tick to the left of the axis line,
     * and then we set this config to `true`, the text will still be flowing
     * from north-west to south-east, _starting_ at the tick to the right
     * of the axis line.
     */
    @Validate(BOOLEAN)
    mirrored: boolean = false;

    /**
     * The side of the axis line to position the labels on.
     * -1 = left (default)
     * 1 = right
     */
    getSideFlag(): ChartAxisLabelFlipFlag {
        return this.mirrored ? 1 : -1;
    }

    /**
     * Labels are rendered perpendicular to the axis line by default.
     * Setting this config to `true` makes labels render parallel to the axis line
     * and center aligns labels' text at the ticks.
     */
    @Validate(BOOLEAN)
    parallel: boolean = false;

    /**
     * In case {@param value} is a number, the {@param fractionDigits} parameter will
     * be provided as well. The `fractionDigits` corresponds to the number of fraction
     * digits used by the tick step. For example, if the tick step is `0.0005`,
     * the `fractionDigits` is 4.
     */
    @Validate(FUNCTION, { optional: true })
    formatter?: Formatter<AgAxisLabelFormatterParams>;

    @Validate(STRING, { optional: true })
    format?: string;
}
