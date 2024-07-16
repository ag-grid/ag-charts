import type { AgAnnotationsThemeableOptions } from '../../options/chart/annotationsOptions';
import type { Group } from '../../scene/group';
import type { Node } from '../../scene/node';
export declare class AnnotationManager {
    private readonly annotationRoot;
    private styles?;
    constructor(annotationRoot: Group);
    attachNode(node: Node): () => this;
    setAnnotationStyles(styles: AgAnnotationsThemeableOptions): void;
    getAnnotationTypeStyles(type: keyof AgAnnotationsThemeableOptions): (import("../../options/chart/annotationsOptions").AgLineAnnotationStyles & {
        handle?: import("../../options/chart/annotationsOptions").AgAnnotationHandleStyles | undefined;
    }) | (import("../../options/chart/annotationsOptions").AgChannelAnnotationStyles & {
        handle?: import("../../options/chart/annotationsOptions").AgAnnotationHandleStyles | undefined;
    }) | undefined;
}
