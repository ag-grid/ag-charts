import { _ModuleSupport } from 'ag-charts-community';
import { PolarCrossLine } from './polarCrossLine';
export declare class AngleCrossLine extends PolarCrossLine {
    static readonly className = "AngleCrossLine";
    direction: _ModuleSupport.ChartAxisDirection;
    private readonly polygonNode;
    private readonly sectorNode;
    private readonly lineNode;
    private readonly labelNode;
    constructor();
    update(visible: boolean): void;
    private updateLineNode;
    private updatePolygonNode;
    private updateSectorNode;
    private updateLabelNode;
}
