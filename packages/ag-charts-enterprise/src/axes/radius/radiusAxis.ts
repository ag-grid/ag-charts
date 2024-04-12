import type { AgAxisCaptionFormatterParams, _Scale } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { RadiusCrossLine } from '../polar-crosslines/radiusCrossLine';

const {
    assignJsonApplyConstructedArray,
    ChartAxisDirection,
    Default,
    Layers,
    DEGREE,
    MIN_SPACING,
    MAX_SPACING,
    BOOLEAN,
    Validate,
} = _ModuleSupport;
const { Caption, Group, Path, Selection } = _Scene;
const { isNumberEqual, normalizeAngle360, toRadians } = _Util;

class RadiusAxisTick extends _ModuleSupport.AxisTick<_Scale.LinearScale, number> {
    @Validate(MIN_SPACING)
    @Default(NaN)
    override minSpacing: number = NaN;

    @Validate(MAX_SPACING)
    @Default(NaN)
    override maxSpacing: number = NaN;
}

class RadiusAxisLabel extends _ModuleSupport.AxisLabel {
    @Validate(BOOLEAN, { optional: true })
    autoRotate?: boolean;

    @Validate(DEGREE)
    autoRotateAngle: number = 335;
}

export abstract class RadiusAxis extends _ModuleSupport.PolarAxis {
    @Validate(DEGREE)
    @Default(0)
    positionAngle: number = 0;

    protected readonly gridPathGroup = this.gridGroup.appendChild(
        new Group({
            name: `${this.id}-gridPaths`,
            zIndex: Layers.AXIS_GRID_ZINDEX,
        })
    );

    protected gridPathSelection = Selection.select(this.gridPathGroup, Path);

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

    protected override updateSelections(
        lineData: _ModuleSupport.AxisLineDatum,
        data: _ModuleSupport.TickDatum[],
        params: {
            combinedRotation: number;
            textBaseline: CanvasTextBaseline;
            textAlign: CanvasTextAlign;
            range: number[];
        }
    ) {
        super.updateSelections(lineData, data, params);

        const {
            gridLine: { enabled, style, width },
            shape,
        } = this;
        if (!style) {
            return;
        }

        const ticks = this.prepareTickData(data);

        const styleCount = style.length;
        const setStyle = (node: _Scene.Path | _Scene.Arc, index: number) => {
            const { stroke, lineDash } = style[index % styleCount];
            node.stroke = stroke;
            node.strokeWidth = width;
            node.lineDash = lineDash;
            node.fill = undefined;
        };

        const [startAngle, endAngle] = this.gridRange ?? [0, 2 * Math.PI];
        const isFullCircle = isNumberEqual(endAngle - startAngle, 2 * Math.PI);

        const drawCircleShape = (node: _Scene.Path, value: any) => {
            const { path } = node;
            path.clear(true);
            const radius = this.getTickRadius(value);
            if (isFullCircle) {
                path.moveTo(radius, 0);
                path.arc(0, 0, radius, 0, 2 * Math.PI);
            } else {
                path.moveTo(radius * Math.cos(startAngle), radius * Math.sin(startAngle));
                path.arc(0, 0, radius, normalizeAngle360(startAngle), normalizeAngle360(endAngle));
            }
            if (isFullCircle) {
                path.closePath();
            }
        };

        const drawPolygonShape = (node: _Scene.Path, value: any) => {
            const { path } = node;
            const angles = this.gridAngles;
            path.clear(true);
            if (!angles || angles.length < 3) {
                return;
            }

            const radius = this.getTickRadius(value);
            angles.forEach((angle, idx) => {
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                if (idx === 0) {
                    path.moveTo(x, y);
                } else {
                    path.lineTo(x, y);
                }

                angles.forEach((innerAngle, innerIdx) => {
                    const x2 = radius * Math.cos(innerAngle);
                    const y2 = radius * Math.sin(innerAngle);
                    if (innerIdx === 0) {
                        path.moveTo(x2, y2);
                    } else {
                        path.lineTo(x2, y2);
                    }
                });
                path.closePath();
            });
            path.closePath();
        };

        this.gridPathSelection.update(enabled ? ticks : []).each((node, value, index) => {
            setStyle(node, index);
            if (shape === 'circle') {
                drawCircleShape(node, value);
            } else {
                drawPolygonShape(node, value);
            }
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
                const { shape, gridAngles, range, innerRadiusRatio } = this;
                const radius = range[0];
                crossLine.shape = shape;
                crossLine.gridAngles = gridAngles;
                crossLine.axisOuterRadius = radius;
                crossLine.axisInnerRadius = radius * innerRadiusRatio;
            }
        });
        super.updateCrossLines({ rotation: 0, parallelFlipRotation: 0, regularFlipRotation: 0 });
    }

    protected override createLabel() {
        return new RadiusAxisLabel();
    }
}
