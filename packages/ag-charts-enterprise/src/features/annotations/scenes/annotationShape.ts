import { _ModuleSupport } from 'ag-charts-community';

export class AnnotationShape extends _ModuleSupport.Marker {
    // Use exact method for this, rather than the Marker's high performance approximation.
    override isPointInPath(x: number, y: number): boolean {
        this.updatePathIfDirty();
        return this.path.closedPath && this.path.isPointInPath(x, y);
    }
}
