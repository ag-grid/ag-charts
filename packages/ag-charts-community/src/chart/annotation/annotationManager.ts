import type { AgAnnotationsThemeableOptions } from '../../options/chart/annotationsOptions';
import type { Group } from '../../scene/group';
import type { Node } from '../../scene/node';
import { isPlainObject } from '../../util/type-guards';
import { BaseManager } from '../baseManager';
import type { Memento, MementoOriginator } from '../memento';

export interface AnnotationsRestoreEvent {
    type: 'restore-annotations';
    annotations: AnnotationsMemento['annotations'];
}

export class AnnotationsMemento implements Memento {
    type = 'annotations';
    version = 10;

    constructor(public readonly annotations?: any) {}
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

    public createMemento(version: number) {
        const memento = new AnnotationsMemento(this.annotations);
        memento.version = version;
        return memento;
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
