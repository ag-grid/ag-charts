import { _ModuleSupport, _Scene } from 'ag-charts-community';
type AgCrosshairLabelRendererParams = any;
type AgCrosshairLabelRendererResult = any;
declare const BaseProperties: typeof _ModuleSupport.BaseProperties;
export declare const defaultLabelCss: string;
export interface LabelMeta {
    x: number;
    y: number;
}
export declare class CrosshairLabel extends BaseProperties {
    private static labelDocuments;
    private readonly element;
    private readonly labelRoot;
    enabled: boolean;
    className?: string;
    xOffset: number;
    yOffset: number;
    format?: string;
    renderer?: (params: AgCrosshairLabelRendererParams) => string | AgCrosshairLabelRendererResult;
    constructor(document: Document, container: HTMLElement);
    show(meta: LabelMeta): void;
    setLabelHtml(html?: string): void;
    computeBBox(): _Scene.BBox;
    private getContainerBoundingBox;
    toggle(visible?: boolean): void;
    destroy(): void;
    toLabelHtml(input: string | AgCrosshairLabelRendererResult, defaults?: AgCrosshairLabelRendererResult): string;
}
export {};
