import { type OverflowStrategy, type TextWrap, _Scene } from 'ag-charts-community';
declare const Label: typeof _Scene.Label;
export declare class AutoSizeableLabel<FormatterParams> extends Label<FormatterParams> {
    wrapping: TextWrap;
    overflowStrategy: OverflowStrategy;
    minimumFontSize?: number;
}
type FontSizeCandidate = {
    labelFontSize: number;
    secondaryLabelFontSize: number;
};
export declare function generateLabelSecondaryLabelFontSizeCandidates<FormatterParams>(label: AutoSizeableLabel<FormatterParams>, secondaryLabel: AutoSizeableLabel<FormatterParams>): FontSizeCandidate[];
export declare function maximumValueSatisfying<T>(from: number, to: number, iteratee: (value: number) => T | undefined): T | undefined;
type LayoutParams = {
    spacing: number;
    padding: number;
};
type LabelFormatting = {
    text: string;
    fontSize: number;
    width: number;
    height: number;
};
type StackedLabelFormatting<Meta> = {
    width: number;
    height: number;
    meta: Meta;
} & ({
    label: LabelFormatting;
    secondaryLabel: LabelFormatting;
} | {
    label: LabelFormatting;
    secondaryLabel: LabelFormatting | undefined;
} | {
    label: LabelFormatting | undefined;
    secondaryLabel: LabelFormatting;
});
type SizeFittingHeightFn<Meta> = (height: number) => {
    width: number;
    height: number;
    meta: Meta;
};
export declare function formatStackedLabels<Meta, FormatterParams>(labelValue: string, labelProps: AutoSizeableLabel<FormatterParams>, secondaryLabelValue: string, secondaryLabelProps: AutoSizeableLabel<FormatterParams>, { spacing, padding }: LayoutParams, sizeFittingHeight: SizeFittingHeightFn<Meta>): ({
    width: number;
    height: number;
    meta: Meta;
} & {
    label: LabelFormatting;
    secondaryLabel: LabelFormatting | undefined;
}) | ({
    width: number;
    height: number;
    meta: Meta;
} & {
    label: LabelFormatting | undefined;
    secondaryLabel: LabelFormatting;
}) | undefined;
export declare function formatSingleLabel<Meta, FormatterParams>(value: string, props: AutoSizeableLabel<FormatterParams>, { padding }: LayoutParams, sizeFittingHeight: SizeFittingHeightFn<Meta>): [LabelFormatting, Meta] | undefined;
export declare function formatLabels<Meta = never, FormatterParams = any>(labelValue: string | undefined, labelProps: AutoSizeableLabel<FormatterParams>, secondaryLabelValue: string | undefined, secondaryLabelProps: AutoSizeableLabel<FormatterParams>, layoutParams: LayoutParams, sizeFittingHeight: SizeFittingHeightFn<Meta>): StackedLabelFormatting<Meta> | undefined;
export {};
