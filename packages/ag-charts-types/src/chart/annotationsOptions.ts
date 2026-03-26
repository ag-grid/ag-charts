import type { AgStateSerializableDate } from '../api/stateTypes';
import type {
    FillOptions,
    LineDashOptions,
    StrokeOptions,
    TextOptions,
    Toggleable,
    Visible,
} from '../series/cartesian/commonOptions';
import type { ToolbarButton, ToolbarSwitch } from './buttonOptions';
import type { CssColor, PixelSize } from './types';

// *********
// * Theme *
// *********/

export interface AgAnnotationsThemeableOptions extends AgAnnotationsOptions {
    // Lines
    line?: AgLineAnnotationStyles;
    'horizontal-line'?: AgCrossLineAnnotationStyles;
    'vertical-line'?: AgCrossLineAnnotationStyles;

    // Channels
    'disjoint-channel'?: AgDisjointChannelAnnotationStyles;
    'parallel-channel'?: AgParallelChannelAnnotationStyles;

    // Fibonaccis
    'fibonacci-retracement'?: AgFibonacciAnnotationStyles;
    'fibonacci-retracement-trend-based'?: AgFibonacciAnnotationStyles;

    // Texts
    callout?: AgCalloutAnnotationStyles;
    comment?: AgCommentAnnotationStyles;
    note?: AgNoteAnnotationStyles;
    text?: AgTextAnnotationStyles;

    // Shapes
    arrow?: AgLineAnnotationStyles;
    'arrow-up'?: AgShapeAnnotationStyles;
    'arrow-down'?: AgShapeAnnotationStyles;

    // Measurers
    'date-range'?: AgMeasurerAnnotationStyles;
    'price-range'?: AgMeasurerAnnotationStyles;
    'date-price-range'?: AgMeasurerAnnotationStyles;
    'quick-date-price-range'?: AgQuickMeasurerAnnotationStyles;
}

export interface AgAnnotationAxesButtons extends Toggleable {
    /** Which axis should display the annotation buttons. */
    axes?: 'x' | 'y' | 'xy';
}

/** Configuration for annotation drag handle styling. */
export interface AgAnnotationHandleStyles extends FillOptions, StrokeOptions, LineDashOptions {}

// Lines
export interface AgLineAnnotationStyles extends Extendable, Writeable, Visible, StrokeOptions, LineOptions {
    /** Configuration for the drag handles. */
    handle?: AgAnnotationHandleStyles;
    /** Configuration for the line text. */
    text?: AgLineAnnotationTextStyles;
}

export interface AgCrossLineAnnotationStyles extends Writeable, Visible, StrokeOptions, LineOptions {
    /** Configuration for the annotation axis label. */
    axisLabel?: AgAnnotationAxisLabel;
    /** Configuration for the drag handle. */
    handle?: AgAnnotationHandleStyles;
    /** Configuration for the line text. */
    text?: AgLineAnnotationTextStyles;
}

// Channels
/** Configuration for disjoint channel annotation styling. */
export interface AgDisjointChannelAnnotationStyles extends AgChannelAnnotationStyles {}
export interface AgParallelChannelAnnotationStyles extends AgChannelAnnotationStyles {
    /** Configuration for the line in the middle of the channel. */
    middle?: AgChannelAnnotationMiddle;
}

// Fibonaccis
export interface AgFibonacciAnnotationStyles extends AgLineAnnotationStyles {
    /** Configuration for the fibonacci ratio labels. */
    label?: TextOptions;
    /** Whether to show the fills between the Fibonacci range lines. */
    showFill?: boolean;
    /** Whether the Fibonacci range lines are multicoloured. */
    isMultiColor?: boolean;
    /** The colours to cycle through for the strokes of the Fibonacci lines. */
    strokes?: CssColor[];
    /** The colour for the strokes of the Fibonacci lines if isMultiColor is `false`. */
    rangeStroke?: CssColor;
    /** The number of fibonacci range bands. */
    bands?: 10 | 6 | 4;
}

// Texts
export interface AgTextAnnotationStyles extends TextOptions, Writeable, Visible {
    /** Configuration for the drag handles. */
    handle?: AgAnnotationHandleStyles;
}

/** Configuration for callout annotation styling. */
export interface AgCalloutAnnotationStyles extends AgTextAnnotationStyles, StrokeOptions, FillOptions {}

/** Configuration for comment annotation styling. */
export interface AgCommentAnnotationStyles extends AgTextAnnotationStyles, StrokeOptions, FillOptions {}

export interface AgNoteAnnotationStyles extends AgTextAnnotationStyles, StrokeOptions, FillOptions {
    /** The fill and stroke for note icon. */
    background?: AgNoteAnnotationBackground;
}

// Shapes
export interface AgShapeAnnotationStyles extends Writeable, Visible, FillOptions {
    /** Configuration for the drag handles. */
    handle?: AgAnnotationHandleStyles;
}

// Measurers
export interface AgMeasurerAnnotationStyles extends StrokeOptions, LineOptions, Extendable, Writeable, Visible {
    /** Configuration for the background fill. */
    background?: FillOptions;
    /** Configuration for the drag handles. */
    handle?: AgAnnotationHandleStyles;
    /** Configuration for the statistics display. */
    statistics?: AgMeasurerAnnotationStatistics;
    /** Configuration for the line text. */
    text?: AgLineAnnotationTextStyles;
}

export interface AgQuickMeasurerAnnotationStyles extends Visible {
    /** Configuration for the annotation when measuring up the y-axis. */
    up?: AgQuickMeasurerAnnotationDirectionStyles;
    /** Configuration for the annotation when measuring down the y-axis. */
    down?: AgQuickMeasurerAnnotationDirectionStyles;
}

export interface AgQuickMeasurerAnnotationDirectionStyles extends FillOptions, StrokeOptions, LineOptions {
    /** Configuration for the drag handles. */
    handle?: AgAnnotationHandleStyles;
    /** Configuration for the statistics display. */
    statistics?: AgMeasurerAnnotationStatistics;
}

// ***********
// * Options *
// ***********

export interface AgAnnotationsOptions extends Toggleable {
    /** The options for the axes buttons */
    axesButtons?: AgAnnotationAxesButtons;
    /** Configuration for the toolbar for creating annotations. */
    toolbar?: AgAnnotationsToolbar;
    /** Configuration for the options toolbar for editing an annotation. */
    optionsToolbar?: AgAnnotationOptionsToolbar;
}

export type AgAnnotation =
    // Lines
    | AgLineAnnotation
    | AgHorizontalLineAnnotation
    | AgVerticalLineAnnotation
    // Channels
    | AgDisjointChannelAnnotation
    | AgParallelChannelAnnotation
    // Fibonaccis
    | AgFibonacciRetracementAnnotation
    | AgFibonacciRetracementTrendBasedAnnotation
    // Texts
    | AgCalloutAnnotation
    | AgCommentAnnotation
    | AgNoteAnnotation
    | AgTextAnnotation
    // Shapes
    | AgArrowAnnotation
    | AgArrowUpAnnotation
    | AgArrowDownAnnotation
    // Measurers
    | AgDateRangeAnnotation
    | AgPriceRangeAnnotation
    | AgDatePriceRangeAnnotation
    | AgQuickDatePriceRangeAnnotation;

// ********************
// * Line Annotations *
// ********************/

export interface AgLineAnnotation
    extends AnnotationLinePoints,
        Extendable,
        Writeable,
        Visible,
        StrokeOptions,
        LineOptions {
    /** Configuration for the trend line annotation.*/
    type: 'line';
    /** Configuration for the drag handles. */
    handle?: AgAnnotationHandle;
    /** Configuration for the line text. */
    text?: AgLineAnnotationText;
}

export interface AgHorizontalLineAnnotation extends AgCrossLineAnnotation {
    /** Configuration for the horizontal-line annotation.*/
    type: 'horizontal-line';
    /** Configuration for the line text. */
    text?: AgLineAnnotationText;
}

export interface AgVerticalLineAnnotation extends AgCrossLineAnnotation {
    /** Configuration for the vertical-line annotation.*/
    type: 'vertical-line';
    /** Configuration for the line text. */
    text?: AgLineAnnotationText;
}

export interface AgCrossLineAnnotation extends Writeable, Visible, StrokeOptions, LineOptions {
    /** Position of the annotation specified in terms of the axis values. */
    value: AgAnnotationValue;
    /** Configuration for the annotation axis label. */
    axisLabel?: AgAnnotationAxisLabel;
    /** Configuration for the drag handle. */
    handle?: AgAnnotationHandle;
}

// ***********************
// * Fibonacci Annotations *
// ***********************/

export interface AgFibonacciAnnotation
    extends AnnotationLinePoints,
        Extendable,
        Writeable,
        Visible,
        StrokeOptions,
        LineOptions,
        AgFibonacciAnnotationStyles {
    /** Configuration for the drag handles. */
    handle?: AgAnnotationHandle;
    /** Configuration for the one line text. */
    text?: AgLineAnnotationText;
    /** Reverse the lines if `true`. */
    reverse?: boolean;
}

export interface AgFibonacciRetracementAnnotation extends AgFibonacciAnnotation {
    type: 'fibonacci-retracement';
}

export interface AgFibonacciRetracementTrendBasedAnnotation extends AgFibonacciAnnotation {
    type: 'fibonacci-retracement-trend-based';
    /** The retracement end point of the fibonacci annotation. */
    endRetracement: AgAnnotationPoint;
}

// ***********************
// * Channel Annotations *
// ***********************/
/** Configuration for channel annotation styling. */
export interface AgChannelAnnotationStyles extends Extendable, Writeable, Visible, StrokeOptions, LineOptions {
    /** Configuration for the drag handles. */
    handle?: AgAnnotationHandle;
    /** Configuration for the channel text. */
    text?: AgChannelAnnotationTextStyles;
    /** The fill colour for the middle of the channel. */
    background?: AgChannelAnnotationBackground;
}

export interface AgParallelChannelAnnotation extends AgChannelAnnotationStyles, AnnotationLinePoints {
    /** Configuration for the parallel-channel annotation.*/
    type: 'parallel-channel';
    /** The height of the annotation along the y-axis. */
    height: number;
    /** Configuration for the channel text. */
    text?: AgChannelAnnotationText;
    /** Configuration for the line in the middle of the channel. */
    middle?: AgChannelAnnotationMiddle;
}

export interface AgDisjointChannelAnnotation extends AgChannelAnnotationStyles, AnnotationLinePoints {
    /** Configuration for the disjoint-channel annotation.*/
    type: 'disjoint-channel';
    /** The height of the annotation along the y-axis at the start. */
    startHeight: number;
    /** The height of the annotation along the y-axis at the end. */
    endHeight: number;
    /** Configuration for the channel text. */
    text?: AgChannelAnnotationText;
}

// ********************
// * Text Annotations *
// ********************/

export interface AgCalloutAnnotation extends AgCalloutAnnotationStyles {
    /** Configuration for the callout annotation. */
    type: 'callout';
    /** The starting point of the annotation. */
    start: AgAnnotationPoint;
    /** The end point of the annotation. */
    end: AgAnnotationPoint;
    /** The text content. */
    text: string;
}

export interface AgCommentAnnotation extends AgCommentAnnotationStyles, AgAnnotationPoint {
    /** Configuration for the comment annotation. */
    type: 'comment';
    /** The text content. */
    text: string;
}

export interface AgNoteAnnotation extends AgNoteAnnotationStyles, AgAnnotationPoint {
    /** Configuration for the note annotation. */
    type: 'note';
    /** The text content. */
    text: string;
}

export interface AgTextAnnotation extends AgTextAnnotationStyles, AgAnnotationPoint {
    /** Configuration for the text annotation. */
    type: 'text';
    /** The text content. */
    text: string;
}

// ********************
// * Shape Annotations *
// ********************/

export interface AgArrowAnnotation
    extends AnnotationLinePoints,
        Extendable,
        Writeable,
        Visible,
        StrokeOptions,
        LineOptions {
    /** Configuration for the arrow annotation.*/
    type: 'arrow';
    handle?: AgAnnotationHandle;
    /** Configuration for the line text. */
    text?: AgLineAnnotationText;
}

export interface AgArrowMarkAnnotation extends AgAnnotationPoint, Writeable, Visible, FillOptions {
    /** Configuration for the arrow mark annotation.*/
    handle?: AgAnnotationHandle;
}

export interface AgArrowUpAnnotation extends AgArrowMarkAnnotation {
    /** Configuration for the arrow up annotation.*/
    type: 'arrow-up';
}
export interface AgArrowDownAnnotation extends AgArrowMarkAnnotation {
    /** Configuration for the arrow down annotation.*/
    type: 'arrow-down';
}

// ************************
// * Measurer Annotations *
// ************************/

export interface AgDateRangeAnnotation extends AgMeasurerAnnotation {
    /** Configuration for the date range annotation.*/
    type: 'date-range';
    /**
     * Whether the annotation should be extended up above.
     *
     * Default: `false`
     */
    extendAbove?: boolean;
    /**
     * Whether the annotation should be extended down below.
     *
     * Default: `false`
     */
    extendBelow?: boolean;
}

export interface AgPriceRangeAnnotation extends AgMeasurerAnnotation {
    /** Configuration for the price range annotation.*/
    type: 'price-range';
    /**
     * Whether the annotation should be extended to the left.
     *
     * Default: `false`
     */
    extendLeft?: boolean;
    /**
     * Whether the annotation should be extended to the right.
     *
     * Default: `false`
     */
    extendRight?: boolean;
}

export interface AgDatePriceRangeAnnotation extends AgMeasurerAnnotation {
    /** Configuration for the date/price range annotation.*/
    type: 'date-price-range';
}

export interface AgQuickDatePriceRangeAnnotation extends AgMeasurerAnnotation {
    /** Configuration for the quick date/range annotation.*/
    type: 'quick-date-price-range';
    /** Configuration for the annotation when measuring up the y-axis.  */
    up?: AgMeasurerAnnotationDirection;
    /** Configuration for the annotation when measuring down the y-axis.  */
    down?: AgMeasurerAnnotationDirection;
}

export interface AgMeasurerAnnotation extends AnnotationLinePoints, Writeable, Visible, StrokeOptions, LineOptions {
    /** Configuration for the drag handles. */
    handle?: AgAnnotationHandle;
    /** Configuration for the line text. */
    text?: AgLineAnnotationText;
    /** Configuration for the statistics. */
    statistics?: AgMeasurerAnnotationStatistics;
}

export interface AgMeasurerAnnotationDirection extends FillOptions, StrokeOptions {
    /** Configuration for the statistics display. */
    statistics?: AgMeasurerAnnotationStatistics;
}

export interface AgMeasurerAnnotationStatistics extends TextOptions, FillOptions, StrokeOptions {
    /** Configuration for the divider line between statistics. */
    divider?: StrokeOptions;
}

// **************
// * Components *
// **************/

export type AgAnnotationLineStyleType = 'solid' | 'dashed' | 'dotted';

export interface LineOptions extends LineDashOptions {
    /** Defines how the line stroke is rendered. If `lineDash` is configured, this takes priority over the `lineStyle` property. */
    lineStyle?: AgAnnotationLineStyleType;
}

/** Configuration for annotation drag handles. */
export interface AgAnnotationHandle extends AgAnnotationHandleStyles {}

/** Configuration for the middle line in a parallel channel annotation. */
export interface AgChannelAnnotationMiddle extends Visible, StrokeOptions, LineOptions {}

/** Configuration for channel annotation background fill. */
export interface AgChannelAnnotationBackground extends FillOptions {}

/** Configuration for note annotation background. */
export interface AgNoteAnnotationBackground extends StrokeOptions, FillOptions {}

export interface AgAnnotationAxisLabel extends Toggleable, FillOptions, StrokeOptions, LineDashOptions, TextOptions {
    /** Apply rounded corners to the axis label container. */
    cornerRadius?: PixelSize;
}

export interface AgLineAnnotationText extends AgLineAnnotationTextStyles {
    /** The text to display on the annotation. */
    label?: string;
}

export interface AgChannelAnnotationText extends AgChannelAnnotationTextStyles {
    /** The text to display on the annotation. */
    label?: string;
}

export interface AgLineAnnotationTextStyles extends TextOptions {
    /** The vertical position of the text relative to the line. */
    position?: 'top' | 'center' | 'bottom';
    /** The horizontal alignment of the text. */
    alignment?: 'left' | 'center' | 'right';
}

export interface AgChannelAnnotationTextStyles extends TextOptions {
    /** The vertical position of the text relative to the channel. */
    position?: 'top' | 'inside' | 'bottom';
    /** The horizontal alignment of the text. */
    alignment?: 'left' | 'center' | 'right';
}

interface AnnotationLinePoints {
    /** The starting point of a linear annotation. */
    start: AgAnnotationPoint;
    /** The end point of a linear annotation. */
    end: AgAnnotationPoint;
}

export interface AgAnnotationPoint {
    /** The x-value of the point. */
    x: AgAnnotationValue;
    /** The y-value of the point. */
    y: number;
}

interface Writeable {
    /**
     * Whether the annotation should be locked to prevent editing.
     *
     * Default: `false`
     */
    locked?: boolean;
    /**
     * Whether the annotation should be read-only to prevent selection, editing and deletion.
     *
     * Default: `false`
     */
    readOnly?: boolean;
}

interface Extendable {
    /**
     * Whether the annotation should be extended away from the start.
     *
     * Default: `false`
     */
    extendStart?: boolean;
    /**
     * Whether the annotation should be extended away from the end.
     *
     * Default: `false`
     */
    extendEnd?: boolean;
}

export type ValueType = string | number | AgStateSerializableDate;
export type AgAnnotationValue = ValueType | AgGroupingValueType;
export interface AgGroupingValueType {
    /** The value at the annotation position. */
    value: ValueType;
    /** The percentage position within a grouped category. */
    groupPercentage: number;
}

// ***********
// * Toolbar *
// ***********/

export interface AgAnnotationsToolbar extends Toggleable {
    /** The buttons to show in the toolbar. */
    buttons?: AgAnnotationsToolbarButton[];
    /** Padding in pixels around the toolbar. */
    padding?: number;
}

export interface AgAnnotationsToolbarButton extends ToolbarButton {
    /** The action to perform when the button is clicked. */
    value: AgAnnotationsToolbarButtonValue;
}

export type AgAnnotationsToolbarButtonValue =
    | 'line-menu'
    | 'fibonacci-menu'
    | 'text-menu'
    | 'shape-menu'
    | 'measurer-menu'
    | 'line'
    | 'horizontal-line'
    | 'vertical-line'
    | 'parallel-channel'
    | 'disjoint-channel'
    | 'fibonacci-retracement'
    | 'fibonacci-retracement-trend-based'
    | 'text'
    | 'comment'
    | 'callout'
    | 'note'
    | 'clear';

// *******************
// * Options Toolbar *
// *******************/

type AgAnnotationToolbarButton = AgAnnotationOptionsToolbarButton | AgAnnotationOptionsToolbarSwitch;

export interface AgAnnotationOptionsToolbar extends Toggleable {
    /** The buttons to show in the options toolbar. */
    buttons?: AgAnnotationToolbarButton[];
}

export interface AgAnnotationOptionsToolbarButton extends ToolbarButton {
    /** The action to perform when the button is clicked. */
    value: AgAnnotationOptionsToolbarButtonValue;
}

export interface AgAnnotationOptionsToolbarSwitch extends ToolbarSwitch {
    /** The action to perform when the switch is toggled. */
    value: AgAnnotationOptionsToolbarSwitchValue;
}

export type AgAnnotationOptionsToolbarButtonValue =
    | 'line-stroke-width'
    | 'line-style-type'
    | 'line-color'
    | 'fill-color'
    | 'text-color'
    | 'text-size'
    | 'delete'
    | 'settings';

export type AgAnnotationOptionsToolbarSwitchValue = 'lock';
