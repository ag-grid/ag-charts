import type { _ModuleSupport, _Scene } from 'ag-charts-community';

import type {
    AnnotationContext,
    AnnotationType,
    Constructor,
    GuardDragClickDoubleEvent,
    Point,
} from './annotationTypes';
import type { ArrowDownProperties } from './arrow-down/arrowDownProperties';
import type { ArrowDownScene } from './arrow-down/arrowDownScene';
import type { ArrowUpProperties } from './arrow-up/arrowUpProperties';
import type { ArrowUpScene } from './arrow-up/arrowUpScene';
import type { CalloutProperties } from './callout/calloutProperties';
import type { CalloutScene } from './callout/calloutScene';
import type { CommentProperties } from './comment/commentProperties';
import type { CommentScene } from './comment/commentScene';
import type { HorizontalLineProperties, VerticalLineProperties } from './cross-line/crossLineProperties';
import type { CrossLineScene } from './cross-line/crossLineScene';
import type { DisjointChannelProperties } from './disjoint-channel/disjointChannelProperties';
import type { DisjointChannelScene } from './disjoint-channel/disjointChannelScene';
import type { ArrowProperties, LineProperties } from './line/lineProperties';
import type { LineScene } from './line/lineScene';
import type {
    DatePriceRangeProperties,
    DateRangeProperties,
    PriceRangeProperties,
    QuickDatePriceRangeProperties,
} from './measurer/measurerProperties';
import type { MeasurerScene } from './measurer/measurerScene';
import type { NoteProperties } from './note/noteProperties';
import type { NoteScene } from './note/noteScene';
import type { ParallelChannelProperties } from './parallel-channel/parallelChannelProperties';
import type { ParallelChannelScene } from './parallel-channel/parallelChannelScene';
import type { AnnotationScene as AnnotationSceneNode } from './scenes/annotationScene';
import type { TextProperties } from './text/textProperties';
import type { TextScene } from './text/textScene';

export type ShapePropertiesType = ArrowUpProperties | ArrowDownProperties;
export type TextualPropertiesType = CalloutProperties | CommentProperties | NoteProperties | TextProperties;
export type LinePropertiesType = LineProperties | HorizontalLineProperties | VerticalLineProperties | ArrowProperties;
export type ChannelPropertiesType = ParallelChannelProperties | DisjointChannelProperties;
export type MeasurerPropertiesType =
    | DateRangeProperties
    | PriceRangeProperties
    | DatePriceRangeProperties
    | QuickDatePriceRangeProperties;

export type AnnotationProperties =
    | LinePropertiesType
    | ChannelPropertiesType
    | TextualPropertiesType
    | ShapePropertiesType
    | MeasurerPropertiesType;

export type EphemeralPropertiesType = QuickDatePriceRangeProperties;

export type AnnotationScene =
    // Lines
    | LineScene
    | CrossLineScene

    // Channels
    | ParallelChannelScene
    | DisjointChannelScene

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
    hoverAtCoords: (coords: _ModuleSupport.Vec2, active?: number) => number | undefined;
    getNodeAtCoords: (coords: _ModuleSupport.Vec2, active: number) => string | undefined;
    select: (index?: number, previous?: number) => void;
    selectLast: () => number;

    startInteracting: () => void;
    stopInteracting: () => void;

    translate: (index: number, translation: _ModuleSupport.Vec2) => void;
    copy: (index: number) => AnnotationProperties | undefined;
    paste: (datum: AnnotationProperties) => void;
    create: (type: AnnotationType, datum: AnnotationProperties) => void;
    delete: (index: number) => void;
    deleteAll: () => void;
    validatePoint: (point: Point) => boolean;

    getAnnotationType: (index: number) => AnnotationType | undefined;

    datum: (index: number) => AnnotationProperties | undefined;
    node: (index: number) => AnnotationScene | undefined;

    showTextInput: (index: number) => void;
    hideTextInput: () => void;
    updateTextInputColor: (color: string) => void;
    updateTextInputFontSize: (fontSize: number) => void;
    updateTextInputBBox: (bbox?: _Scene.BBox) => void;

    showAnnotationOptions: (index: number) => void;
    showAnnotationSettings: (index: number, sourceEvent?: Event, initialTab?: 'line' | 'text') => void;

    recordAction: (label: string) => void;
    addPostUpdateFns: (...fns: (() => void)[]) => void;

    update: () => void;
}

export interface AnnotationTypeConfig<Datum extends _ModuleSupport.BaseProperties, Scene extends AnnotationSceneNode> {
    type: AnnotationType;
    isDatum: (value: unknown) => value is Datum;
    datum: Constructor<Datum>;
    scene: Constructor<Scene>;
    update: (node: AnnotationSceneNode, datum: _ModuleSupport.BaseProperties, context: AnnotationContext) => void;
    translate: (
        node: AnnotationSceneNode,
        datum: _ModuleSupport.BaseProperties,
        translation: _ModuleSupport.Vec2,
        context: AnnotationContext
    ) => void;
    copy: (
        node: AnnotationSceneNode,
        datum: _ModuleSupport.BaseProperties,
        copiedDatum: _ModuleSupport.BaseProperties,
        context: AnnotationContext
    ) => Datum | undefined;
    createState: (
        ctx: AnnotationsStateMachineContext & {
            delete: () => void;
            guardDragClickDoubleEvent: GuardDragClickDoubleEvent;
            deselect: () => void;
            showAnnotationOptions: () => void;
            showTextInput: () => void;
        },
        helpers: AnnotationsStateMachineHelperFns
    ) => _ModuleSupport.StateMachine<any, any>;
    dragState: (
        ctx: AnnotationsStateMachineContext & {
            setSelectedWithDrag: () => void;
            setSnapping: (snapping: boolean) => void;
            getSnapping: () => boolean;
        },
        helpers: AnnotationsStateMachineHelperFns
    ) => _ModuleSupport.StateMachine<any, any>;
}

export interface AnnotationsStateMachineHelperFns {
    createDatum: <T extends AnnotationProperties>(type: AnnotationType) => (datum: T) => void;
    getDatum: <T>(is: (value: unknown) => value is T) => () => T;
    getNode: <T>(is: (value: unknown) => value is T) => () => T;
}
