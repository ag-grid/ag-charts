import { type AgAnnotationLineStyleType, _ModuleSupport } from 'ag-charts-community';

import { Dialog, type DialogOptions } from '../../../components/dialog/dialog';
import type { ColorPickerOptions } from '../../color-picker/colorPicker';
import {
    type AnnotationOptionsColorPickerType,
    AnnotationType,
    type ChannelTextPosition,
    type LineTextAlignment,
    type LineTextPosition,
} from '../annotationTypes';
import { LINE_STROKE_WIDTH_ITEMS, TEXT_SIZE_ITEMS } from '../annotationsMenuOptions';
import type {
    ChannelPropertiesType,
    EphemeralPropertiesType,
    LinePropertiesType,
    MeasurerPropertiesType,
} from '../annotationsSuperTypes';
import { isChannelType } from '../utils/types';

const { focusCursorAtEnd } = _ModuleSupport;

export interface LinearSettingsDialogOptions extends DialogOptions {
    initialSelectedTab: 'line' | 'text';
    onChangeLine: (props: LinearSettingsDialogLineChangeProps) => void;
    onChangeText: (props: LinearSettingsDialogTextChangeProps) => void;
    onChangeFillColor: Required<ColorPickerOptions>['onChange'];
    onChangeHideFillColor: Required<ColorPickerOptions>['onChangeHide'];
    onChangeLineColor: Required<ColorPickerOptions>['onChange'];
    onChangeHideLineColor: Required<ColorPickerOptions>['onChangeHide'];
    onChangeLineStyleType: (lineStyleType: AgAnnotationLineStyleType) => void;
    onChangeLineStyleWidth: (strokeWidth: number) => void;
    onChangeTextColor: Required<ColorPickerOptions>['onChange'];
    onChangeHideTextColor: Required<ColorPickerOptions>['onChangeHide'];
    onChangeTextFontSize: (fontSize: number) => void;
}

export interface LinearSettingsDialogLineChangeProps {
    extendStart?: boolean;
    extendEnd?: boolean;
    extendAbove?: boolean;
    extendBelow?: boolean;
    extendLeft?: boolean;
    extendRight?: boolean;
}

export interface LinearSettingsDialogTextChangeProps {
    alignment?: LineTextAlignment;
    position?: LineTextPosition | ChannelTextPosition;
    label?: string;
}

type LinearDialogPropertiesType = Exclude<
    LinePropertiesType | ChannelPropertiesType | MeasurerPropertiesType,
    EphemeralPropertiesType
>;

export class AnnotationSettingsDialog extends Dialog {
    constructor(ctx: _ModuleSupport.ModuleContext) {
        super(ctx, 'settings');
    }

    show(datum: LinearDialogPropertiesType, options: LinearSettingsDialogOptions) {
        const lineTab = this.createLinearLineTab(datum, options);
        const textTab = this.createLinearTextTab(datum, options);

        let lineLabel = 'dialogHeaderLine';
        if (isChannelType(datum)) {
            lineLabel = 'dialogHeaderChannel';
        } else if (datum.type === AnnotationType.DateRange) {
            lineLabel = 'dialogHeaderDateRange';
        } else if (datum.type === AnnotationType.PriceRange) {
            lineLabel = 'dialogHeaderPriceRange';
        } else if (datum.type === AnnotationType.DatePriceRange) {
            lineLabel = 'dialogHeaderDatePriceRange';
        }

        const { tabs, initialFocus } = this.createTabs('ariaLabelSettingsTabBar', options.initialSelectedTab, {
            line: {
                label: lineLabel,
                panel: lineTab,
            },
            text: {
                label: 'dialogHeaderText',
                panel: textTab.panel,
                onShow: textTab.onShow,
            },
        });
        options.initialFocus = initialFocus;

        const popover = this.showWithChildren([tabs], options);
        popover.classList.add('ag-charts-dialog--annotation-settings');
    }

    private createLinearLineTab(
        datum: LinePropertiesType | ChannelPropertiesType | MeasurerPropertiesType,
        options: LinearSettingsDialogOptions
    ) {
        const panel = this.createTabPanel();

        const groupOne = this.createInputGroupLine();
        const groupTwo = this.createInputGroupLine();

        const lineColorPicker = this.createColorPickerInput(
            'line-color',
            datum.getDefaultColor('line-color'),
            datum.getDefaultOpacity('line-color'),
            options.onChangeLineColor,
            options.onChangeHideLineColor
        );

        const strokeWidth = this.createStrokeWidthSelect(datum.strokeWidth ?? 2, options.onChangeLineStyleWidth);
        const lineStyle = this.createLineStyleRadioGroup(datum.lineStyle ?? 'solid', options.onChangeLineStyleType);

        if ('background' in datum) {
            const fillColorPicker = this.createColorPickerInput(
                'fill-color',
                datum.getDefaultColor('fill-color'),
                datum.getDefaultOpacity('fill-color'),
                options.onChangeFillColor,
                options.onChangeHideFillColor
            );

            groupOne.append(lineColorPicker, fillColorPicker);
            groupTwo.append(strokeWidth, lineStyle);
        } else {
            groupOne.append(lineColorPicker, strokeWidth);
            groupTwo.append(lineStyle);
        }

        panel.append(groupOne, groupTwo);

        if ('extendStart' in datum && 'extendEnd' in datum) {
            panel.append(
                this.createCheckbox({
                    label: isChannelType(datum) ? 'dialogInputExtendChannelStart' : 'dialogInputExtendLineStart',
                    checked: datum.extendStart ?? false,
                    onChange: (extendStart) => options.onChangeLine({ extendStart }),
                }),
                this.createCheckbox({
                    label: isChannelType(datum) ? 'dialogInputExtendChannelEnd' : 'dialogInputExtendLineEnd',
                    checked: datum.extendEnd ?? false,
                    onChange: (extendEnd) => options.onChangeLine({ extendEnd }),
                })
            );
        }

        if ('extendAbove' in datum && 'extendBelow' in datum) {
            panel.append(
                this.createCheckbox({
                    label: 'dialogInputExtendAbove',
                    checked: datum.extendAbove ?? false,
                    onChange: (extendAbove) => options.onChangeLine({ extendAbove }),
                }),
                this.createCheckbox({
                    label: 'dialogInputExtendBelow',
                    checked: datum.extendBelow ?? false,
                    onChange: (extendBelow) => options.onChangeLine({ extendBelow }),
                })
            );
        }

        if ('extendLeft' in datum && 'extendRight' in datum) {
            panel.append(
                this.createCheckbox({
                    label: 'dialogInputExtendLeft',
                    checked: datum.extendLeft ?? false,
                    onChange: (extendLeft) => options.onChangeLine({ extendLeft }),
                }),
                this.createCheckbox({
                    label: 'dialogInputExtendRight',
                    checked: datum.extendRight ?? false,
                    onChange: (extendRight) => options.onChangeLine({ extendRight }),
                })
            );
        }

        return panel;
    }

    private createLinearTextTab(datum: LinearDialogPropertiesType, options: LinearSettingsDialogOptions) {
        const panel = this.createTabPanel();

        const textArea = this.createTextArea({
            placeholder: 'inputTextareaPlaceholder',
            value: datum.text.label,
            onChange: (value) => options.onChangeText({ label: value }),
        });

        const fontSizeAndColor = this.createInputGroupLine();
        const fontSize = this.createFontSizeSelect(datum.text.fontSize, options.onChangeTextFontSize);
        const colorPicker = this.createColorPickerInput(
            'text-color',
            datum.text.color,
            1,
            options.onChangeTextColor,
            options.onChangeHideTextColor
        );
        fontSizeAndColor.append(fontSize, colorPicker);

        const positionAndAlignment = this.createInputGroupLine();
        const textPosition = datum.text.position === 'inside' ? 'center' : datum.text.position;
        const position = this.createPositionRadioGroup(textPosition ?? 'top', (value) =>
            options.onChangeText({ position: value as unknown as LineTextPosition | ChannelTextPosition })
        );
        const alignment = this.createAlignmentRadioGroup(datum.text.alignment ?? 'center', (value) =>
            options.onChangeText({ alignment: value as unknown as LineTextAlignment })
        );
        positionAndAlignment.append(position, alignment);

        panel.append(textArea, fontSizeAndColor, positionAndAlignment);

        return { panel, onShow: () => focusCursorAtEnd(textArea) };
    }

    private createColorPickerInput(
        colorType: AnnotationOptionsColorPickerType,
        color: string | undefined,
        opacity: number | undefined,
        onChange: Required<ColorPickerOptions>['onChange'],
        onChangeHide: Required<ColorPickerOptions>['onChangeHide']
    ) {
        const label = colorType === 'fill-color' ? 'dialogInputFillColorPicker' : 'dialogInputColorPicker';
        const altText =
            colorType === 'fill-color' ? 'dialogInputFillColorPickerAltText' : 'dialogInputColorPickerAltText';
        return this.createColorPicker({
            label,
            altText,
            color: color,
            opacity,
            onChange,
            onChangeHide,
        });
    }

    private createStrokeWidthSelect(strokeWidth: number, onChange: (value: number) => void) {
        return this.createSelect({
            label: 'dialogInputStrokeWidth',
            altText: 'dialogInputStrokeWidthAltText',
            options: LINE_STROKE_WIDTH_ITEMS.map(({ label, value }) => ({ label: label!, value: `${value}` })),
            value: String(strokeWidth),
            onChange: (value) => onChange(Number(value)),
        });
    }

    private createLineStyleRadioGroup(
        lineStyle: AgAnnotationLineStyleType,
        onChange: (value: AgAnnotationLineStyleType) => void
    ) {
        return this.createRadioGroup({
            label: 'dialogInputLineStyle',
            options: [
                { icon: 'line-style-solid', altText: 'iconAltTextLineStyleSolid', value: 'solid' },
                { icon: 'line-style-dashed', altText: 'iconAltTextLineStyleDashed', value: 'dashed' },
                { icon: 'line-style-dotted', altText: 'iconAltTextLineStyleDotted', value: 'dotted' },
            ],
            value: lineStyle,
            onChange,
        });
    }

    private createFontSizeSelect(fontSize: number, onChange: (value: number) => void) {
        return this.createSelect({
            label: 'dialogInputFontSize',
            altText: 'dialogInputFontSizeAltText',
            options: TEXT_SIZE_ITEMS.map(({ label, value }) => ({ label: label!, value: String(value) })),
            value: String(fontSize),
            onChange: (value) => onChange(Number(value)),
        });
    }

    private createPositionRadioGroup(position: string, onChange: (value: string) => void) {
        return this.createRadioGroup({
            label: 'dialogInputPosition',
            options: [
                { icon: 'position-top', altText: 'iconAltTextPositionTop', value: 'top' },
                { icon: 'position-center', altText: 'iconAltTextPositionCenter', value: 'center' },
                { icon: 'position-bottom', altText: 'iconAltTextPositionBottom', value: 'bottom' },
            ],
            value: position,
            onChange,
        });
    }

    private createAlignmentRadioGroup(alignment: string, onChange: (value: string) => void) {
        return this.createRadioGroup({
            label: 'dialogInputAlign',
            options: [
                { icon: 'align-left', altText: 'iconAltTextAlignLeft', value: 'left' },
                { icon: 'align-center', altText: 'iconAltTextAlignCenter', value: 'center' },
                { icon: 'align-right', altText: 'iconAltTextAlignRight', value: 'right' },
            ],
            value: alignment,
            onChange,
        });
    }
}
