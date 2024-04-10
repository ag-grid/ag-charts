import type { AgAnnotationsThemeableOptions } from '../../options/chart/annotationsOptions';
import type { Group } from '../../scene/group';
import type { Node } from '../../scene/node';

export class AnnotationManager {
    private styles?: AgAnnotationsThemeableOptions;

    constructor(private readonly annotationRoot: Group) {}

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
