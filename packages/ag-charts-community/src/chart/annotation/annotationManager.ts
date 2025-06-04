import { isArray } from 'ag-charts-core';
import type { AgAnnotation, AgAnnotationsEvent, AgAnnotationsThemeableOptions } from 'ag-charts-types';

import type { MementoOriginator } from '../../api/state/memento';
import type { EventsHub } from '../../core/eventsHub';
import { callWithContext } from '../../module-support';
import type { Group } from '../../scene/group';
import type { Node } from '../../scene/node';
import { deepClone } from '../../util/json';
import { mergeDefaults } from '../../util/object';
import type { TypedEvent } from '../../util/observable';

type AnnotationsMemento = AgAnnotation[];

export class AnnotationManager implements MementoOriginator<AnnotationsMemento> {
    public mementoOriginatorKey = 'annotations' as const;

    private annotations: AnnotationsMemento = [];
    private styles?: AgAnnotationsThemeableOptions;

    constructor(
        private readonly eventsHub: EventsHub,
        private readonly annotationRoot: Group,
        private readonly caller: { readonly context?: unknown },
        private readonly fireChartEvent: <TEvent extends TypedEvent>(event: TEvent) => void
    ) {}

    public createMemento() {
        return this.annotations;
    }

    public guardMemento(blob: unknown): blob is AnnotationsMemento | undefined {
        return blob == null || isArray(blob);
    }

    public restoreMemento(_version: string, _mementoVersion: string, memento: AnnotationsMemento | undefined) {
        // Migration from older versions can be implemented here.

        this.annotations = this.cleanData(memento ?? []).map((annotation) => {
            const annotationTheme = this.getAnnotationTypeStyles(annotation.type);
            return mergeDefaults(annotation, annotationTheme);
        });

        this.eventsHub.emit('annotations:restore', { annotations: this.annotations });
    }

    public updateData(annotations?: AnnotationsMemento) {
        this.annotations = this.cleanData(annotations ?? []);
    }

    public fireChangedEvent() {
        const event: AgAnnotationsEvent = { type: 'annotations', annotations: deepClone([...this.annotations]) };
        callWithContext(this.caller, this.fireChartEvent<AgAnnotationsEvent>, event);
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

    public getAnnotationTypeStyles(
        type: keyof Omit<
            AgAnnotationsThemeableOptions,
            'axesButtons' | 'enabled' | 'optionsToolbar' | 'toolbar' | 'snap'
        >
    ) {
        return this.styles?.[type];
    }

    private cleanData(annotations: AnnotationsMemento) {
        // Strip text align from annotations as this is fixed by annotation type
        for (const annotation of annotations) {
            if ('textAlign' in annotation) delete annotation.textAlign;
        }
        return annotations;
    }
}
