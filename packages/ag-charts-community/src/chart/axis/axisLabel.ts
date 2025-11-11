import { BaseProperties, Property, isArray, objectsEqual } from 'ag-charts-core';
import type {
    AgAxisLabelFormatterParams,
    AgAxisLabelStylerParams,
    AgBaseAxisLabelStyleOptions,
    AgTimeIntervalUnit,
    DateFormatterStyle,
    FontStyle,
    FontWeight,
    FormatterParams,
    Padding,
    RichFormatter,
    Styler,
    TextOrSegments,
    TextWrap,
} from 'ag-charts-types';

import type { ChartAxisLabel, ChartAxisLabelFlipFlag } from '../chartAxis';
import { FormatManager } from '../formatter/formatManager';
import { LabelBorder } from '../label';

type FormatterCacheKey = `${DateFormatterStyle}:${'year' | 'month' | 'day' | 'none'}`;

interface FormatterCache {
    type: string;
    mergedFormat: string | Record<string, string>;
    unit: AgTimeIntervalUnit | undefined;
    formatter: ((value: any, fractionDigits?: number) => string) | undefined;
}

export class AxisLabel extends BaseProperties implements ChartAxisLabel {
    @Property
    enabled = true;

    @Property
    border = new LabelBorder();

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
    wrapping: TextWrap = 'never';

    @Property
    truncate: boolean = false;

    /**
     * The padding between the labels and the ticks.
     */
    @Property
    spacing: number = 5;

    /**
     * Minimum gap in pixels between the axis labels before being removed to avoid collisions.
     */
    @Property
    minSpacing?: number;

    /**
     * The color of the labels.
     * Use `undefined` rather than `rgba(0, 0, 0, 0)` to make labels invisible.
     */
    @Property
    color?: string = '#575757';

    /**
     * Custom label rotation in degrees.
     * Labels are rendered perpendicular to the axis line by default.
     * Or parallel to the axis line, if the {@link parallel} is set to `true`.
     * The value of this config is used as the angular offset/deflection
     * from the default rotation.
     */
    @Property
    rotation?: number;

    /**
     * Avoid axis label collision by automatically reducing the number of ticks displayed. If set to `false`, axis labels may collide.
     */
    @Property
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
    @Property
    mirrored: boolean = false;

    /**
     * The side of the axis line to position the labels on.
     * -1 = left (default)
     * 1 = right
     */
    getSideFlag(): ChartAxisLabelFlipFlag {
        return this.mirrored ? 1 : -1;
    }

    @Property
    padding?: Padding;

    /**
     * Labels are rendered perpendicular to the axis line by default.
     * Setting this config to `true` makes labels render parallel to the axis line
     * and center aligns labels' text at the ticks.
     */
    @Property
    parallel: boolean = false;

    @Property
    itemStyler?: Styler<AgAxisLabelStylerParams, AgBaseAxisLabelStyleOptions>;

    /**
     * In case {@param value} is a number, the {@param fractionDigits} parameter will
     * be provided as well. The `fractionDigits` corresponds to the number of fraction
     * digits used by the tick step. For example, if the tick step is `0.0005`,
     * the `fractionDigits` is 4.
     */
    @Property
    formatter?: RichFormatter<AgAxisLabelFormatterParams>;

    @Property
    format?: string | Record<string, string>;

    private _formatters: Record<FormatterCacheKey, FormatterCache | undefined> = {
        'component:year': undefined,
        'component:month': undefined,
        'component:day': undefined,
        'component:none': undefined,
        'long:year': undefined,
        'long:month': undefined,
        'long:day': undefined,
        'long:none': undefined,
    };
    formatValue(
        callWithContext: (
            formatter: (params: AgAxisLabelFormatterParams) => TextOrSegments | undefined,
            params: AgAxisLabelFormatterParams
        ) => TextOrSegments | undefined,
        params: FormatterParams<any>,
        index: number,
        options?: {
            specifier?: string | Record<string, string>;
            dateStyle: DateFormatterStyle;
            truncateDate: 'year' | 'month' | 'day' | undefined;
        }
    ): TextOrSegments | undefined {
        const { formatter, format } = this;
        const { type, value, domain, boundSeries } = params;
        const fractionDigits = params.type === 'number' ? params.fractionDigits : undefined;
        const unit = params.type === 'date' ? params.unit : undefined;

        let result: TextOrSegments | undefined;
        if (formatter != null) {
            const step = params.type === 'date' ? params.step : undefined;
            result = callWithContext(formatter, { value, index, domain, fractionDigits, unit, step, boundSeries });
        }

        if (format != null && result == null) {
            const { specifier, dateStyle = 'long', truncateDate } = options ?? {};
            const cacheKey: FormatterCacheKey = `${dateStyle}:${truncateDate ?? 'none'}`;
            let valueFormatter = this._formatters[cacheKey];

            const mergedFormat = FormatManager.mergeSpecifiers(specifier, format);
            if (
                valueFormatter == null ||
                valueFormatter.type !== type ||
                valueFormatter.unit !== unit ||
                !objectsEqual(valueFormatter.mergedFormat, mergedFormat)
            ) {
                valueFormatter = {
                    type,
                    mergedFormat,
                    unit,
                    formatter: FormatManager.getFormatter(type, mergedFormat, unit, dateStyle, { truncateDate }),
                };

                this._formatters[cacheKey] = valueFormatter;
            }

            result = valueFormatter.formatter?.(value, fractionDigits);
        }

        return result == null || isArray(result) ? result : String(result);
    }
}
