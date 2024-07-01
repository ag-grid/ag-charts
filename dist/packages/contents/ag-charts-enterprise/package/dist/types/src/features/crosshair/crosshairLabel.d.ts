import type { AgCrosshairLabelRendererParams, AgCrosshairLabelRendererResult } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
import defaultLabelCss from './crosshairLabel.css';
export { defaultLabelCss };
declare const BaseProperties: typeof _ModuleSupport.BaseProperties;
export declare class CrosshairLabelProperties extends _Scene.ChangeDetectableProperties {
    enabled: boolean;
    className?: string;
    xOffset: number;
    yOffset: number;
    format?: string;
    renderer?: (params: AgCrosshairLabelRendererParams) => string | AgCrosshairLabelRendererResult;
}
export declare class CrosshairLabel extends BaseProperties {
    private readonly domManager;
    private readonly id;
    enabled: boolean;
    className?: string;
    xOffset: number;
    yOffset: number;
    format?: string;
    renderer?: (params: AgCrosshairLabelRendererParams) => string | AgCrosshairLabelRendererResult;
    private readonly element;
    constructor(domManager: _ModuleSupport.DOMManager);
    show(meta: _Scene.Point): void;
    setLabelHtml(html?: string): void;
    computeBBox(): _Scene.BBox;
    toggle(visible?: boolean): void;
    destroy(): void;
    toLabelHtml(input: string | AgCrosshairLabelRendererResult, defaults?: AgCrosshairLabelRendererResult): string;
}
