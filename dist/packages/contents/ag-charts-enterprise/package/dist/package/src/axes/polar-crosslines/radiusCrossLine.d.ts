import { _ModuleSupport } from 'ag-charts-community';
import { PolarCrossLine, PolarCrossLineLabel } from './polarCrossLine';
declare class RadiusCrossLineLabel extends PolarCrossLineLabel {
    positionAngle?: number;
}
export declare class RadiusCrossLine extends PolarCrossLine {
    static className: string;
    direction: _ModuleSupport.ChartAxisDirection;
    gridAngles?: number[];
    label: RadiusCrossLineLabel;
    private polygonNode;
    private sectorNode;
    private labelNode;
    constructor();
    update(visible: boolean): void;
    private colorizeNode;
    private getRadii;
    private drawPolygon;
    private updatePolygonNode;
    private updateSectorNode;
    private updateLabelNode;
}
export {};
