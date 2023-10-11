import type { AgAxisCaptionFormatterParams, _Scale } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { RadiusCrossLine } from '../polar-crosslines/radiusCrossLine';

const {
    AND,
    assignJsonApplyConstructedArray,
    ChartAxisDirection,
    Default,
    GREATER_THAN,
    Layers,
    NUMBER,
    NUMBER_OR_NAN,
    OPT_BOOLEAN,
    Validate,
} = _ModuleSupport;
const { Arc, Caption, Group, Path, Selection } = _Scene;
const { toRadians } = _Util;

class RadiusAxisTick extends _ModuleSupport.AxisTick<_Scale.LinearScale, number> {
    @Validate(AND(NUMBER_OR_NAN(1), GREATER_THAN('minSpacing')))
    @Default(NaN)
    override maxSpacing: number = NaN;
}

class RadiusAxisLabel extends _ModuleSupport.AxisLabel {
    @Validate(OPT_BOOLEAN)
    autoRotate?: boolean;

    @Validate(NUMBER(-360, 360))
    autoRotateAngle: number = 335;
}

export abstract class RadiusAxis extends _ModuleSupport.PolarAxis {
    @Validate(NUMBER(-360, 360))
    @Default(0)
    positionAngle: number = 0;

    protected readonly gridArcGroup = this.gridGroup.appendChild(
        new Group({
            name: `${this.id}-gridArcs`,
            zIndex: Layers.AXIS_GRID_ZINDEX,
        })
    );

    protected readonly gridPolygonGroup = this.gridGroup.appendChild(
        new Group({
            name: `${this.id}-gridPolygons`,
            zIndex: Layers.AXIS_GRID_ZINDEX,
        })
    );
    protected gridArcGroupSelection = Selection.select(this.gridArcGroup, Arc);
    protected gridPolygonGroupSelection = Selection.select(this.gridPolygonGroup, Path);

    constructor(moduleCtx: _ModuleSupport.ModuleContext, scale: _Scale.Scale<any, any>) {
        super(moduleCtx, scale);
    }

    get direction() {
        return ChartAxisDirection.Y;
    }

    protected assignCrossLineArrayConstructor(crossLines: _ModuleSupport.CrossLine[]) {
        assignJsonApplyConstructedArray(crossLines, RadiusCrossLine);
    }

    protected override getAxisTransform() {
        const maxRadius = this.scale.range[0];
        const { translation, positionAngle, innerRadiusRatio } = this;
        const innerRadius = maxRadius * innerRadiusRatio;
        const rotation = toRadians(positionAngle);
        return {
            translationX: translation.x,
            translationY: translation.y - maxRadius - innerRadius,
            rotation,
            rotationCenterX: 0,
            rotationCenterY: maxRadius + innerRadius,
        };
    }

    protected abstract prepareTickData(tickData: _ModuleSupport.TickDatum[]): _ModuleSupport.TickDatum[];
    protected abstract getTickRadius(tickDatum: _ModuleSupport.TickDatum): number;

    protected override updateSelections(data: _ModuleSupport.TickDatum[]) {
        super.updateSelections(data);

        const { gridStyle, tick, shape } = this;
        if (!gridStyle) {
            return;
        }

        const ticks = this.prepareTickData(data);

        const setStyle = (node: _Scene.Path | _Scene.Arc, index: number) => {
            const style = gridStyle[index % gridStyle.length];
            node.stroke = style.stroke;
            node.strokeWidth = tick.width;
            node.lineDash = style.lineDash;
            node.fill = undefined;
        };

        this.gridArcGroupSelection.update(shape === 'circle' ? ticks : []).each((node, value, index) => {
            setStyle(node, index);

            node.centerX = 0;
            node.centerY = 0;
            node.radius = this.getTickRadius(value);
            node.startAngle = 0;
            node.endAngle = 2 * Math.PI;
        });

        this.gridPolygonGroupSelection.update(shape === 'polygon' ? ticks : []).each((node, value, index) => {
            setStyle(node, index);

            const { path } = node;
            const angles = this.gridAngles;
            path.clear({ trackChanges: true });
            if (!angles || angles.length < 3) {
                return;
            }

            const radius = this.getTickRadius(value);
            angles.forEach((angle, i) => {
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                if (i === 0) {
                    path.moveTo(x, y);
                } else {
                    path.lineTo(x, y);
                }
            });
            path.closePath();
        });
    }

    protected override updateTitle() {
        const identityFormatter = (params: AgAxisCaptionFormatterParams) => params.defaultValue;
        const {
            title,
            _titleCaption,
            range: requestedRange,
            moduleCtx: { callbackCache },
        } = this;
        const { formatter = identityFormatter } = this.title ?? {};

        if (!title) {
            _titleCaption.enabled = false;
            return;
        }

        _titleCaption.enabled = title.enabled;
        _titleCaption.fontFamily = title.fontFamily;
        _titleCaption.fontSize = title.fontSize;
        _titleCaption.fontStyle = title.fontStyle;
        _titleCaption.fontWeight = title.fontWeight;
        _titleCaption.color = title.color;
        _titleCaption.wrapping = title.wrapping;

        let titleVisible = false;
        const titleNode = _titleCaption.node;
        if (title.enabled) {
            titleVisible = true;

            titleNode.rotation = Math.PI / 2;
            titleNode.x = Math.floor((requestedRange[0] + requestedRange[1]) / 2);
            titleNode.y = -Caption.SMALL_PADDING;
            titleNode.textAlign = 'center';
            titleNode.textBaseline = 'bottom';

            titleNode.text = callbackCache.call(formatter, this.getTitleFormatterParams());
        }

        titleNode.visible = titleVisible;
    }

    protected override createTick() {
        return new RadiusAxisTick();
    }

    protected override updateCrossLines() {
        this.crossLines?.forEach((crossLine) => {
            if (crossLine instanceof RadiusCrossLine) {
                crossLine.shape = this.shape;
                crossLine.gridAngles = this.gridAngles;
            }
        });
        super.updateCrossLines({ rotation: 0, parallelFlipRotation: 0, regularFlipRotation: 0, sideFlag: -1 });
    }

    protected override createLabel() {
        return new RadiusAxisLabel();
    }
}
