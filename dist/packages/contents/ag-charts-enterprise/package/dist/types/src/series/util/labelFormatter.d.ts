import { type OverflowStrategy, type TextWrap, _Scene } from 'ag-charts-community';
declare const Label: typeof _Scene.Label;
declare class BaseAutoSizedLabel<FormatterParams> extends Label<FormatterParams> {
    static lineHeight(fontSize: number): number;
    wrapping: TextWrap;
    overflowStrategy: OverflowStrategy;
    minimumFontSize?: number;
}
export declare class AutoSizedLabel<FormatterParams> extends BaseAutoSizedLabel<FormatterParams> {
    spacing: number;
}
export declare class AutoSizeableSecondaryLabel<FormatterParams> extends BaseAutoSizedLabel<FormatterParams> {
}
type FontSizeCandidate = {
    labelFontSize: number;
    secondaryLabelFontSize: number;
};
export declare function generateLabelSecondaryLabelFontSizeCandidates<FormatterParams>(label: BaseAutoSizedLabel<FormatterParams>, secondaryLabel: BaseAutoSizedLabel<FormatterParams>): FontSizeCandidate[];
export declare function maximumValueSatisfying<T>(from: number, to: number, iteratee: (value: number) => T | undefined): T | undefined;
type LayoutParams = {
    padding: number;
};
type LabelFormatting = {
    text: string;
    fontSize: number;
    lineHeight: number;
    width: number;
    height: number;
};
export type StackedLabelFormatting<Meta> = {
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
type SizeFittingHeightFn<Meta> = (height: number, canTruncate: boolean) => {
    width: number;
    height: number;
    meta: Meta;
};
export declare function formatStackedLabels<Meta, FormatterParams>(labelValue: string, labelProps: AutoSizedLabel<FormatterParams>, secondaryLabelValue: string, secondaryLabelProps: AutoSizeableSecondaryLabel<FormatterParams>, { padding }: LayoutParams, sizeFittingHeight: SizeFittingHeightFn<Meta>): ({
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
export declare function formatSingleLabel<Meta, FormatterParams>(value: string, props: BaseAutoSizedLabel<FormatterParams>, { padding }: LayoutParams, sizeFittingHeight: SizeFittingHeightFn<Meta>): [LabelFormatting, Meta] | undefined;
export declare function formatLabels<Meta = never, FormatterParams = any>(baseLabelValue: string | undefined, labelProps: AutoSizedLabel<FormatterParams>, baseSecondaryLabelValue: string | undefined, secondaryLabelProps: AutoSizeableSecondaryLabel<FormatterParams>, layoutParams: LayoutParams, sizeFittingHeight: SizeFittingHeightFn<Meta>): StackedLabelFormatting<Meta> | undefined;
export {};
