import { _ModuleSupport } from 'ag-charts-community';
import { PolarCrossLine } from './polarCrossLine';
export declare class AngleCrossLine extends PolarCrossLine {
    static readonly className = "AngleCrossLine";
    direction: _ModuleSupport.ChartAxisDirection;
    private polygonNode;
    private sectorNode;
    private lineNode;
    private labelNode;
    constructor();
    update(visible: boolean): void;
    private updateLineNode;
    private updatePolygonNode;
    private updateSectorNode;
    private updateLabelNode;
}
