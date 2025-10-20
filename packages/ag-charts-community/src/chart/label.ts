import { type LocaleString, type RequireOptional, isArray } from 'ag-charts-core';
import type {
    AgChartLabelFormatterParams,
    AgChartLabelOptions,
    AgChartLabelStyleOptions,
    AgChartLabelStylerParams,
    ContextDefault,
    FontStyle,
    FontWeight,
    Padding,
    PaddingOptions,
    RichFormatter,
    Styler,
    TextOrSegments,
} from 'ag-charts-types';

import type { ContextFormatter } from '../module/axisContext';
import { BaseProperties, Property } from '../util/properties';
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
    formatter?: RichFormatter<AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>>;

    @Property
    format?: string;

    @Property
    padding?: Padding;

    @Property
    itemStyler?: Styler<AgChartLabelStylerParams<TDatum, ContextDefault>, AgChartLabelStyleOptions>;

    private _cachedFormatter: FormatterCache | undefined = undefined;
    formatValue(
        locale: LocaleString,
        formatWithContext: ContextFormatter<AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>>,
        type: 'number' | 'date' | 'category',
        value: any,
        params: AgChartLabelFormatterParams<TDatum> & RequireOptional<TParams>
    ) {
        const { formatter, format } = this;

        let result: TextOrSegments | undefined;
        if (formatter != null) {
            result ??= formatWithContext(formatter, params);
        }

        if (format != null) {
            let cachedFormatter = this._cachedFormatter;
            if (cachedFormatter == null || cachedFormatter.type !== type || cachedFormatter.format !== format) {
                cachedFormatter = {
                    type,
                    format,
                    formatter: FormatManager.getFormatter(locale, type, format),
                };
                this._cachedFormatter = cachedFormatter;
            }

            result ??= cachedFormatter.formatter?.(value);
        }

        return result == null || isArray(result) ? result : String(result);
    }
}

type LabelBoxingMixin = { border?: { enabled?: boolean; stroke?: string }; fill?: unknown; padding?: Padding };
export function expandLabelPadding(label: LabelBoxingMixin | undefined): Required<PaddingOptions> {
    const { enabled: borderEnabled = false, stroke: borderStroke } = label?.border ?? {};
    const hasBoxing = label?.fill != null || (borderEnabled && borderStroke != null);
    const padding = hasBoxing ? label?.padding : null;

    if (padding == null) {
        return { bottom: 0, left: 0, right: 0, top: 0 };
    } else if (typeof padding === 'number') {
        return { bottom: padding, left: padding, right: padding, top: padding };
    } else {
        const { bottom = 0, left = 0, right = 0, top = 0 } = padding satisfies PaddingOptions;
        return { bottom, left, right, top };
    }
}
