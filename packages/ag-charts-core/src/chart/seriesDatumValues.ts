import type { DrawnItemStyle } from '../format/color';

/** A value of a datum, resolved and formatted for one consumer. */
export interface SeriesDatumValue {
    readonly key: string;
    readonly name?: string;
    readonly value: unknown;
    readonly formattedValue?: string;
    readonly missing?: boolean;
    /** Set when the value is drawn in a colour other than the datum's `style`. */
    readonly color?: string;
    /** Whether the value is the datum's category, such as its `xKey` value. */
    readonly category?: boolean;
}

export interface SeriesDatumValues<TStyle extends DrawnItemStyle = DrawnItemStyle> {
    /** `undefined` for items without a source datum, such as histogram bins and waterfall totals. */
    readonly datum: unknown;
    /** The style the datum is drawn with, after any `itemStyler`. */
    readonly style: TStyle;
    readonly values: SeriesDatumValue[];
}

export function datumValueTooltipRow({ key, name, formattedValue, missing }: SeriesDatumValue) {
    return { label: name, fallbackLabel: key, value: formattedValue ?? '', missing };
}

/** The category value becomes the heading and every other value a row. */
export function datumValuesTooltipContent(values: readonly SeriesDatumValue[]) {
    let heading: string | undefined;
    const data: ReturnType<typeof datumValueTooltipRow>[] = [];
    for (const value of values) {
        if (value.category) {
            heading = value.formattedValue;
        } else {
            data.push(datumValueTooltipRow(value));
        }
    }
    return { heading, data };
}
