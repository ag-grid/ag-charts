import type { _ModuleSupport } from 'ag-charts-community';
import type { Point, StateMachine } from 'ag-charts-core';

import type { AnnotationContext, AnnotationType, Constructor, DataPoint } from './annotationTypes';
import type { ArrowDownDatum } from './arrow-down/arrowDownDatum';
import type { ArrowDownScene } from './arrow-down/arrowDownScene';
import type { ArrowUpDatum } from './arrow-up/arrowUpDatum';
import type { ArrowUpScene } from './arrow-up/arrowUpScene';
import type { CalloutDatum } from './callout/calloutDatum';
import type { CalloutScene } from './callout/calloutScene';
import type { CommentDatum } from './comment/commentDatum';
import type { CommentScene } from './comment/commentScene';
import type { HorizontalLineDatum, VerticalLineDatum } from './cross-line/crossLineDatum';
import type { CrossLineScene } from './cross-line/crossLineScene';
import type { DisjointChannelDatum } from './disjoint-channel/disjointChannelDatum';
import type { DisjointChannelScene } from './disjoint-channel/disjointChannelScene';
import type { FibonacciRetracementTrendBasedDatum } from './fibonacci-retracement-trend-based/fibonacciRetracementTrendBasedDatum';
import type { FibonacciRetracementTrendBasedScene } from './fibonacci-retracement-trend-based/fibonacciRetracementTrendBasedScene';
import type { FibonacciRetracementDatum } from './fibonacci-retracement/fibonacciRetracementDatum';
import type { FibonacciRetracementScene } from './fibonacci-retracement/fibonacciRetracementScene';
import type { ArrowDatum, LineDatum } from './line/lineDatum';
import type { LineScene } from './line/lineScene';
import type {
    DatePriceRangeDatum,
    DateRangeDatum,
    PriceRangeDatum,
    QuickDatePriceRangeDatum,
} from './measurer/measurerDatum';
import type { MeasurerScene } from './measurer/measurerScene';
import type { NoteDatum } from './note/noteDatum';
import type { NoteScene } from './note/noteScene';
import type { ParallelChannelDatum } from './parallel-channel/parallelChannelDatum';
import type { ParallelChannelScene } from './parallel-channel/parallelChannelScene';
import type { AnnotationScene as AnnotationSceneNode } from './scenes/annotationScene';
import type { TextDatum } from './text/textDatum';
import type { TextScene } from './text/textScene';

export type ShapeDatumType = ArrowUpDatum | ArrowDownDatum;
export type TextualDatumType = CalloutDatum | CommentDatum | NoteDatum | TextDatum;
export type LineDatumType = LineDatum | HorizontalLineDatum | VerticalLineDatum | ArrowDatum;
export type FibonacciDatumType = FibonacciRetracementDatum | FibonacciRetracementTrendBasedDatum;
export type ChannelDatumType = ParallelChannelDatum | DisjointChannelDatum;
export type MeasurerDatumType = DateRangeDatum | PriceRangeDatum | DatePriceRangeDatum | QuickDatePriceRangeDatum;

export type AnnotationDatum =
    | LineDatumType
    | ChannelDatumType
    | FibonacciDatumType
    | TextualDatumType
    | ShapeDatumType
    | MeasurerDatumType;

export type EphemeralDatumType = QuickDatePriceRangeDatum;

export type AnnotationScene =
    // Lines
    | LineScene
    | CrossLineScene

    // Channels
    | ParallelChannelScene
    | DisjointChannelScene

    // Fibonaccis
    | FibonacciRetracementScene
    | FibonacciRetracementTrendBasedScene

    // Shapes
    | ArrowUpScene
    | ArrowDownScene

    // Texts
    | CalloutScene
    | CommentScene
    | NoteScene
    | TextScene

    // Measurers
    | MeasurerScene;

export interface AnnotationsStateMachineContext {
    resetToIdle: () => void;
    hoverAtCoords: (coords: Point, active?: number, hovered?: number) => number | undefined;
    getNodeAtCoords: (coords: Point, active: number) => string | undefined;
    select: (index?: number, previous?: number) => void;
    selectLast: () => number;

    startInteracting: () => void;
    stopInteracting: () => void;
    startDragging: (index: number) => void;

    translate: (index: number, translation: Point) => void;
    copy: (index: number) => AnnotationDatum | undefined;
    paste: (datum: AnnotationDatum) => void;
    create: (type: AnnotationType, datum: AnnotationDatum) => void;
    delete: (index: number) => void;
    deleteAll: () => void;
    validatePoint: (point: DataPoint, options?: { overflowContinuous: boolean }) => boolean;

    getAnnotationType: (index: number) => AnnotationType | undefined;

    datum: (index: number) => AnnotationDatum | undefined;
    node: (index: number) => AnnotationScene | undefined;

    showTextInput: (index: number) => void;
    hideTextInput: () => void;
    updateTextInputColor: (color: string) => void;
    updateTextInputFontSize: (fontSize: number) => void;
    updateTextInputBBox: (bbox?: _ModuleSupport.BBox) => void;

    showAnnotationOptions: (index: number) => void;
    showAnnotationSettings: (index: number, sourceEvent?: Event, initialTab?: 'line' | 'text') => void;

    recordAction: (label: string) => void;

    update: () => void;
}

export interface AnnotationTypeConfig<Datum extends AnnotationDatum, Scene extends AnnotationScene> {
    scene: Constructor<Scene>;
    update(node: AnnotationSceneNode<unknown>, datum: AnnotationDatum, context: AnnotationContext): void;
    translate(
        node: AnnotationSceneNode<unknown>,
        datum: AnnotationDatum,
        translation: Point,
        context: AnnotationContext
    ): void;
    copy(
        node: AnnotationSceneNode<unknown>,
        datum: AnnotationDatum,
        copiedDatum: AnnotationDatum,
        context: AnnotationContext
    ): Datum | undefined;
    createState(
        ctx: AnnotationsCreateStateMachineContext,
        helpers: AnnotationsStateMachineHelperFns
    ): StateMachine<any, any>;
    dragState(ctx: AnnotationsStateMachineContext, helpers: AnnotationsStateMachineHelperFns): StateMachine<any, any>;
}

export interface AnnotationsStateMachineHelperFns {
    createDatum: <T extends AnnotationDatum>(type: AnnotationType) => (datum: T) => void;
}

export type AnnotationsCreateStateMachineContext = AnnotationsStateMachineContext & {
    delete: () => void;
    deselect: () => void;
    showAnnotationOptions: () => void;
    showTextInput: () => void;
};
