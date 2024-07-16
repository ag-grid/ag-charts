import type { _Util } from 'ag-charts-community';

import { AnnotationType, type Point } from './annotationTypes';
import type { CalloutProperties } from './callout/calloutProperties';
import type { CommentProperties } from './comment/commentProperties';
import { HorizontalLineProperties, VerticalLineProperties } from './cross-line/crossLineProperties';
import { DisjointChannelProperties } from './disjoint-channel/disjointChannelProperties';
import { LineProperties } from './line/lineProperties';
import type { NoteProperties } from './note/noteProperties';
import { ParallelChannelProperties } from './parallel-channel/parallelChannelProperties';
import type { AnnotationScene } from './scenes/annotationScene';
import { TextProperties } from './text/textProperties';

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

    update: () => void;
}
