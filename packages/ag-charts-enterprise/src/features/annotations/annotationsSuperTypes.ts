import type { _Util } from 'ag-charts-community';

import { AnnotationType, type Point } from './annotationTypes';
import type { CalloutProperties } from './callout/calloutProperties';
import type { CalloutScene } from './callout/calloutScene';
import type { CommentProperties } from './comment/commentProperties';
import type { CommentScene } from './comment/commentScene';
import { HorizontalLineProperties, VerticalLineProperties } from './cross-line/crossLineProperties';
import type { CrossLineScene } from './cross-line/crossLineScene';
import { DisjointChannelProperties } from './disjoint-channel/disjointChannelProperties';
import type { DisjointChannelScene } from './disjoint-channel/disjointChannelScene';
import { LineProperties } from './line/lineProperties';
import type { LineScene } from './line/lineScene';
import type { NoteProperties } from './note/noteProperties';
import type { NoteScene } from './note/noteScene';
import { ParallelChannelProperties } from './parallel-channel/parallelChannelProperties';
import type { ParallelChannelScene } from './parallel-channel/parallelChannelScene';
import { TextProperties } from './text/textProperties';
import type { TextScene } from './text/textScene';

export type AnnotationProperties =
    // Lines
    | LineProperties
    | HorizontalLineProperties
    | VerticalLineProperties

    // Channels
    | ParallelChannelProperties
    | DisjointChannelProperties

    // Texts
    | CalloutProperties
    | CommentProperties
    | NoteProperties
    | TextProperties;

export type AnnotationScene =
    // Lines
    | LineScene
    | CrossLineScene

    // Channels
    | ParallelChannelScene
    | DisjointChannelScene

    // Texts
    | CalloutScene
    | CommentScene
    | NoteScene
    | TextScene;

export interface AnnotationsStateMachineContext {
    resetToIdle: () => void;
    hoverAtCoords: (coords: _Util.Vec2, active?: number) => number | undefined;
    select: (index?: number, previous?: number) => number | undefined;
    selectLast: () => number;

    startInteracting: () => void;
    stopInteracting: () => void;

    create: (type: AnnotationType, datum: AnnotationProperties) => void;
    delete: (index: number) => void;
    validatePoint: (point: Point) => boolean;

    getAnnotationType: (index: number) => AnnotationType | undefined;

    datum: (index: number) => AnnotationProperties | undefined;
    node: (index: number) => AnnotationScene | undefined;

    showTextInput: (index: number) => void;
    hideTextInput: () => void;

    resetToolbarButtonStates: () => void;
    showAnnotationOptions: () => void;

    update: () => void;
}
