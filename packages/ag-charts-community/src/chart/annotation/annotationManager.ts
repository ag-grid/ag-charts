import type { AgAnnotationsThemeableOptions } from 'ag-charts-types';

import type { Memento, MementoOriginator } from '../../api/state/memento';
import type { Group } from '../../scene/group';
import type { Node } from '../../scene/node';
import { isPlainObject } from '../../util/type-guards';
import { BaseManager } from '../baseManager';

export interface AnnotationsRestoreEvent {
    type: 'restore-annotations';
    annotations: AnnotationsMemento['annotations'];
}

export class AnnotationsMemento implements Memento {
    type = 'annotations';

    constructor(
        public readonly version: string,
        public readonly annotations?: any
    ) {}
}

export class AnnotationManager
    extends BaseManager<AnnotationsRestoreEvent['type'], AnnotationsRestoreEvent>
    implements MementoOriginator
{
    public mementoOriginatorName = 'Annotations';

    private annotations?: any;
    private styles?: AgAnnotationsThemeableOptions;

    constructor(private readonly annotationRoot: Group) {
        super();
    }

    public createMemento(version: string) {
        return new AnnotationsMemento(version, this.annotations);
    }

    public guardMemento(blob: unknown): blob is AnnotationsMemento {
        return isPlainObject(blob) && 'type' in blob && blob.type === 'annotations';
    }

    public restoreMemento(memento: AnnotationsMemento) {
        // Migration from older versions can be implemented here.

        this.listeners.dispatch('restore-annotations', {
            type: 'restore-annotations',
            annotations: memento.annotations,
        });
    }

    public updateData(annotations?: any) {
        this.annotations = annotations;
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
