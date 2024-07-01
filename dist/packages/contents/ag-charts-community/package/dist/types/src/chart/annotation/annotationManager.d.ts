import type { AgAnnotation, AgAnnotationsThemeableOptions } from 'ag-charts-types';
import type { MementoOriginator } from '../../api/state/memento';
import type { Group } from '../../scene/group';
import type { Node } from '../../scene/node';
import { BaseManager } from '../baseManager';
export interface AnnotationsRestoreEvent {
    type: 'restore-annotations';
    annotations: AnnotationsMemento;
}
export type AnnotationsMemento = AgAnnotation[];
export declare class AnnotationManager extends BaseManager<AnnotationsRestoreEvent['type'], AnnotationsRestoreEvent> implements MementoOriginator<AnnotationsMemento> {
    private readonly annotationRoot;
    mementoOriginatorKey: "annotations";
    private annotations;
    private styles?;
    constructor(annotationRoot: Group);
    createMemento(): AnnotationsMemento;
    guardMemento(blob: unknown): blob is AnnotationsMemento;
    restoreMemento(_version: string, _mementoVersion: string, memento: AnnotationsMemento): void;
    updateData(annotations?: AnnotationsMemento): void;
    attachNode(node: Node): () => this;
    setAnnotationStyles(styles: AgAnnotationsThemeableOptions): void;
    getAnnotationTypeStyles(type: keyof AgAnnotationsThemeableOptions): import("ag-charts-types").AgLineAnnotationStyles | import("ag-charts-types").AgAnnotationAxesButtons | import("ag-charts-types").AgChannelAnnotationStyles | undefined;
}
