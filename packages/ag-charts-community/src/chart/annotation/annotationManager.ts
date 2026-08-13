import type { DynamicContext, MementoOriginator } from 'ag-charts-core';
import { deepClone, isArray, mergeDefaults } from 'ag-charts-core';
import type { AgAnnotation, AgAnnotationsThemeableOptions } from 'ag-charts-types';

import type { ChartRegistry } from '../../module/moduleContext';
import type { Node } from '../../scene/node';

type AnnotationsMemento = AgAnnotation[];

export class AnnotationManager implements MementoOriginator<AnnotationsMemento> {
    public mementoOriginatorKey = 'annotations' as const;

    private annotations: AnnotationsMemento = [];
    private styles?: AgAnnotationsThemeableOptions;

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {}

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

        this.ctx.eventsHub.emit('annotations:restore', { annotations: this.annotations });
    }

    public updateData(annotations?: AnnotationsMemento) {
        this.annotations = this.cleanData(annotations ?? []);
    }

    public fireChangedEvent() {
        this.ctx.chartService.callListener({ type: 'annotations', annotations: deepClone([...this.annotations]) });
    }

    public attachNode(node: Node) {
        this.ctx.annotationRoot.append(node);
        return () => {
            node.remove();
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
            if ('textAlign' in annotation) {
                delete annotation.textAlign;
            }
        }
        return annotations;
    }
}
