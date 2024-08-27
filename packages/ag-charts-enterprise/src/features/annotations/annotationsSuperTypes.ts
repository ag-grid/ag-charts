import type { _Scene, _Util } from 'ag-charts-community';

import type { AnnotationType, Point } from './annotationTypes';
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
import type { NoteProperties } from './note/noteProperties';
import type { NoteScene } from './note/noteScene';
import type { ParallelChannelProperties } from './parallel-channel/parallelChannelProperties';
import type { ParallelChannelScene } from './parallel-channel/parallelChannelScene';
import type { TextProperties } from './text/textProperties';
import type { TextScene } from './text/textScene';

export type ShapePropertyType = ArrowUpProperties | ArrowDownProperties;
export type TextualPropertiesType = CalloutProperties | CommentProperties | NoteProperties | TextProperties;
export type LinePropertiesType = LineProperties | HorizontalLineProperties | VerticalLineProperties | ArrowProperties;
export type ChannelPropertiesType = ParallelChannelProperties | DisjointChannelProperties;

export type AnnotationProperties =
    | LinePropertiesType
    | ChannelPropertiesType
    | TextualPropertiesType
    | ShapePropertyType;

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
    | TextScene;

export interface AnnotationsStateMachineContext {
    resetToIdle: () => void;
    hoverAtCoords: (coords: _Util.Vec2, active?: number) => number | undefined;
    select: (index?: number, previous?: number) => void;
    selectLast: () => number;

    startInteracting: () => void;
    stopInteracting: () => void;

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

    update: () => void;
}
