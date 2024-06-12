import type { AgAnnotationsThemeableOptions } from 'ag-charts-types';

import type { MementoOriginator } from '../../api/state/memento';
import type { Group } from '../../scene/group';
import type { Node } from '../../scene/node';
import { isArray } from '../../util/type-guards';
import { BaseManager } from '../baseManager';

export interface AnnotationsRestoreEvent {
    type: 'restore-annotations';
    annotations: AnnotationsMemento;
}

export type AnnotationsMemento = any[];

export class AnnotationManager
    extends BaseManager<AnnotationsRestoreEvent['type'], AnnotationsRestoreEvent>
    implements MementoOriginator<AnnotationsMemento>
{
    public mementoOriginatorKey = 'annotations' as const;

    private annotations: AnnotationsMemento = [];
    private styles?: AgAnnotationsThemeableOptions;

    constructor(private readonly annotationRoot: Group) {
        super();
    }

    public createMemento() {
        return this.annotations;
    }

    public guardMemento(blob: unknown): blob is AnnotationsMemento {
        return isArray(blob);
    }

    public restoreMemento(_version: string, _mementoVersion: string, memento: AnnotationsMemento) {
        // Migration from older versions can be implemented here.

        this.listeners.dispatch('restore-annotations', {
            type: 'restore-annotations',
            annotations: memento,
        });
    }

    public updateData(annotations?: AnnotationsMemento) {
        this.annotations = annotations ?? [];
    }

    public attachNode(node: Node) {
        this.annotationRoot.append(node);
        return () => {
            this.annotationRoot?.removeChild(node);
            return this;
        };
    }

    public setAnnotationStyles(styles: AgAnnotationsThemeableOptions) {
        this.styles = styles;
    }

    public getAnnotationTypeStyles(type: keyof AgAnnotationsThemeableOptions) {
        return this.styles?.[type];
    }
}
