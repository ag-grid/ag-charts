import type { AgCrosshairLabelRendererParams, AgCrosshairLabelRendererResult } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties;
export declare const defaultLabelCss: string;
export interface LabelMeta {
    x: number;
    y: number;
}
export declare class CrosshairLabelProperties extends _Scene.ChangeDetectableProperties {
    enabled: boolean;
    className?: string;
    xOffset: number;
    yOffset: number;
    format?: string;
    renderer?: (params: AgCrosshairLabelRendererParams) => string | AgCrosshairLabelRendererResult;
}
export declare class CrosshairLabel extends BaseProperties {
    private readonly labelRoot;
    enabled: boolean;
    className?: string;
    xOffset: number;
    yOffset: number;
    format?: string;
    renderer?: (params: AgCrosshairLabelRendererParams) => string | AgCrosshairLabelRendererResult;
    private readonly element;
    constructor(labelRoot: HTMLElement);
    show(meta: LabelMeta): void;
    setLabelHtml(html?: string): void;
    computeBBox(): _Scene.BBox;
    private getContainerBoundingBox;
    toggle(visible?: boolean): void;
    destroy(): void;
    toLabelHtml(input: string | AgCrosshairLabelRendererResult, defaults?: AgCrosshairLabelRendererResult): string;
}
export {};
