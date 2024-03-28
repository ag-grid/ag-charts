import { _ModuleSupport } from 'ag-charts-community';
import { PolarCrossLine, PolarCrossLineLabel } from './polarCrossLine';
declare class RadiusCrossLineLabel extends PolarCrossLineLabel {
    positionAngle?: number;
}
export declare class RadiusCrossLine extends PolarCrossLine {
    static readonly className = "RadiusCrossLine";
    direction: _ModuleSupport.ChartAxisDirection;
    gridAngles?: number[];
    label: RadiusCrossLineLabel;
    private polygonNode;
    private sectorNode;
    private labelNode;
    private outerRadius;
    private innerRadius;
    constructor();
    update(visible: boolean): void;
    private updateRadii;
    private drawPolygon;
    private updatePolygonNode;
    private updateSectorNode;
    private updateLabelNode;
    private getPadding;
}
export {};
