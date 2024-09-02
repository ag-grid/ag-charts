import type { AgStateSerializableDate } from '../api/stateTypes';
import type {
    FillOptions,
    FontOptions,
    LineDashOptions,
    StrokeOptions,
    Toggleable,
    Visible,
} from '../series/cartesian/commonOptions';
import type { Formatter } from './callbackOptions';
import type { PixelSize } from './types';

// *********
// * Theme *
// *********/

export interface AgAnnotationsThemeableOptions {
    // Lines
    line?: AgLineAnnotationStyles;
    'horizontal-line'?: AgLineAnnotationStyles;
    'vertical-line'?: AgLineAnnotationStyles;

    // Channels
    'disjoint-channel'?: AgChannelAnnotationStyles;
    'parallel-channel'?: AgChannelAnnotationStyles;

    // Texts
    callout?: AgCalloutAnnotationStyles;
    comment?: AgCommentAnnotationStyles;
    note?: AgNoteAnnotationStyles;
    text?: AgTextAnnotationStyles;

    // Shapes
    arrow?: AgLineAnnotationStyles;
    'arrow-up'?: AgShapeAnnotationStyles;
    'arrow-down'?: AgShapeAnnotationStyles;

    // Other
    axesButtons?: AgAnnotationAxesButtons;
}

export interface AgAnnotationAxesButtons extends Toggleable {
    /** Which axis should display the annotation buttons. */
    axes?: 'x' | 'y' | 'xy';
}

export interface AgAnnotationHandleStyles extends FillOptions, StrokeOptions, LineDashOptions {}
export interface AgLineAnnotationStyles extends Extendable, Lockable, Visible, StrokeOptions, LineOptions {
    handle?: AgAnnotationHandleStyles;
}

export interface AgShapeAnnotationStyles extends Lockable, Visible, StrokeOptions, FillOptions {
    size?: PixelSize;
}

export interface AgChannelAnnotationStyles extends Extendable, Lockable, Visible, StrokeOptions, LineOptions {
    handle?: AgAnnotationHandleStyles;
    middle?: AgChannelAnnotationMiddle;
    /** The fill colour for the middle of the channel. */
    background?: AgChannelAnnotationBackground;
}
export interface AgTextAnnotationStyles extends FontOptions, Lockable, Visible {
    handle?: AgAnnotationHandleStyles;
}
export interface AgCalloutAnnotationStyles extends AgTextAnnotationStyles, StrokeOptions, FillOptions {}
export interface AgCommentAnnotationStyles extends AgTextAnnotationStyles, StrokeOptions, FillOptions {}
export interface AgNoteAnnotationStyles extends AgTextAnnotationStyles, StrokeOptions, FillOptions {
    background: AgNoteAnnotationBackground;
}

// ***********
// * Options *
// ***********

export interface AgAnnotationsOptions extends Toggleable {
    /** The options for the axes buttons */
    axesButtons?: AgAnnotationAxesButtons;
}

export type AgAnnotation =
    // Lines
    | AgLineAnnotation
    | AgHorizontalLineAnnotation
    | AgVerticalLineAnnotation
    // Channels
    | AgDisjointChannelAnnotation
    | AgParallelChannelAnnotation
    // Texts
    | AgCalloutAnnotation
    | AgCommentAnnotation
    | AgNoteAnnotation
    | AgTextAnnotation
    // Shapes
    | AgArrowAnnotation
    | AgArrowUpAnnotation
    | AgArrowDownAnnotation;

// ********************
// * Line Annotations *
// ********************/

export interface AgLineAnnotation
    extends AnnotationLinePoints,
        Cappable,
        Extendable,
        Lockable,
        Visible,
        StrokeOptions,
        LineOptions {
    /** Configuration for the trend line annotation.*/
    type: 'line';
    handle?: AgAnnotationHandle;
    /** Configuration for the line text. */
    text?: AgLineText;
}

export interface AgHorizontalLineAnnotation extends AgCrossLineAnnotation {
    /** Configuration for the horizontal-line annotation.*/
    type: 'horizontal-line';
    /** Configuration for the line text. */
    text?: AgLineText;
}

export interface AgVerticalLineAnnotation extends AgCrossLineAnnotation {
    /** Configuration for the vertical-line annotation.*/
    type: 'vertical-line';
    /** Configuration for the line text. */
    text?: AgLineText;
}

export interface AgCrossLineAnnotation extends Lockable, Visible, StrokeOptions, LineOptions {
    /** Position of the annotation specified in terms of the axis values. */
    value: AgAnnotationValue;
    /** Configuration for the annotation axis label. */
    axisLabel?: AgAnnotationAxisLabel;
    handle?: AgAnnotationHandle;
}

// ***********************
// * Channel Annotations *
// ***********************/

export interface AgParallelChannelAnnotation
    extends AnnotationLinePoints,
        Extendable,
        Lockable,
        Visible,
        StrokeOptions,
        LineOptions {
    /** Configuration for the parallel-channel annotation.*/
    type: 'parallel-channel';
    /** The height of the annotation along the y-axis. */
    height: number;
    handle?: AgAnnotationHandle;
    /** Configuration for the line in the middle of the channel. */
    middle?: AgChannelAnnotationMiddle;
    /** The fill colour for the middle of the channel. */
    background?: AgChannelAnnotationBackground;
    /** Configuration for the channel text. */
    text?: AgChannelText;
}

export interface AgDisjointChannelAnnotation
    extends AnnotationLinePoints,
        Extendable,
        Lockable,
        Visible,
        StrokeOptions,
        LineOptions {
    /** Configuration for the disjoint-channel annotation.*/
    type: 'disjoint-channel';
    /** The height of the annotation along the y-axis at the start. */
    startHeight: number;
    /** The height of the annotation along the y-axis at the end. */
    endHeight: number;
    handle?: AgAnnotationHandle;
    /** The fill colour for the middle of the channel. */
    background?: AgChannelAnnotationBackground;
    /** Configuration for the channel text. */
    text?: AgChannelText;
}

// ********************
// * Text Annotations *
// ********************/

export interface AgCalloutAnnotation extends TextualStartEndAnnotation, FillOptions, StrokeOptions {
    /** Configuration for the callout annotation. */
    type: 'callout';
}

export interface AgCommentAnnotation extends TextualPointAnnotation, FillOptions {
    /** Configuration for the comment annotation. */
    type: 'comment';
}

export interface AgNoteAnnotation extends TextualPointAnnotation, FillOptions, StrokeOptions {
    /** Configuration for the note annotation. */
    type: 'note';
    background?: AgNoteAnnotationBackground;
}

export interface AgTextAnnotation extends TextualPointAnnotation {
    /** Configuration for the text annotation. */
    type: 'text';
}

interface TextualPointAnnotation extends TextualAnnotation, AgAnnotationPoint {}
interface TextualStartEndAnnotation extends TextualAnnotation {
    start: AgAnnotationPoint;
    end: AgAnnotationPoint;
}
interface TextualAnnotation extends Lockable, Visible, FontOptions {
    handle?: AgAnnotationHandle;
    text: string;
}

// ********************
// * Shape Annotations *
// ********************/

export interface AgArrowAnnotation
    extends AnnotationLinePoints,
        Cappable,
        Extendable,
        Lockable,
        Visible,
        StrokeOptions,
        LineOptions {
    /** Configuration for the arrow annotation.*/
    type: 'arrow';
    handle?: AgAnnotationHandle;
    /** Configuration for the line text. */
    text?: AgLineText;
}

export interface AgArrowMarkAnnotation extends AgAnnotationPoint, Lockable, Visible, StrokeOptions, LineOptions {
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

// **************
// * Components *
// **************/

export type AgAnnotationLineStyleType = 'solid' | 'dashed' | 'dotted';

export interface LineOptions extends LineDashOptions {
    lineStyle?: AgAnnotationLineStyleType;
}

export interface AgAnnotationHandle extends FillOptions, StrokeOptions, LineDashOptions {}
export interface AgChannelAnnotationMiddle extends Visible, StrokeOptions, LineOptions {}
export interface AgChannelAnnotationBackground extends FillOptions {}
export interface AgNoteAnnotationBackground extends StrokeOptions, FillOptions {}
export interface AgAnnotationAxisLabel
    extends Toggleable,
        FillOptions,
        StrokeOptions,
        LineDashOptions,
        LabelOptions<AgAnnotationLabelFormatterParams> {
    /** Apply rounded corners to the axis label container. */
    cornerRadius?: PixelSize;
}

export interface AgAnnotationLabelFormatterParams {
    /** The default label value that would have been used without a formatter. */
    value: any;
}

export interface AgLineText extends FontOptions {
    label?: string;
    position?: 'top' | 'center' | 'bottom';
    alignment?: 'left' | 'center' | 'right';
}

export interface AgChannelText extends FontOptions {
    label?: string;
    position?: 'top' | 'inside' | 'bottom';
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

interface LabelOptions<T> extends FontOptions {
    /** A custom formatting function used to convert values into text for display by labels. */
    formatter?: Formatter<T>;
}

interface Lockable {
    /**
     * Whether the annotation should be locked to prevent editing.
     *
     * Default: `false`
     */
    locked?: boolean;
}

interface Extendable {
    // extendLeft?: boolean;
    // extendRight?: boolean;
}

// TODO: Add these options back when we have another cap type.
interface Cappable {
    /** The cap to show at the start of the line. */
    // startCap?: Cap;
    /** The cap to show at the end of the line. */
    // endCap?: Cap;
}

// type Cap = 'arrow';

export type AgAnnotationValue = string | number | AgStateSerializableDate;
