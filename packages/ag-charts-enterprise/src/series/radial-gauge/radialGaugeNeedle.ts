import { _Scene } from 'ag-charts-community';

const { SvgPath, Rotatable, Translatable, Scalable } = _Scene;

export class RadialGaugeNeedle extends Rotatable(Scalable(Translatable(SvgPath))) {
    static defaultPathData =
        'M0.50245 0.53745C0.481767 0.53745 0.465 0.520683 0.465 0.5C0.465 0.479317 0.481767 0.46255 0.50245 0.46255L1 0.500012L0.50245 0.53745Z';

    override scalingCenterX = 0.5;
    override scalingCenterY = 0.5;
    override rotationCenterX = 0.5;
    override rotationCenterY = 0.5;
}
