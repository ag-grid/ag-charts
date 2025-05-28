import { _ModuleSupport } from 'ag-charts-community';
import { createId } from 'ag-charts-core';
import type { AgChartLegendPosition } from 'ag-charts-types';

import { formatWithContext } from '../series/gauge-util/label';

const {
    AxisInterval,
    AxisLabel,
    ZIndexMap,
    LinearScale,
    BBox,
    TranslatableGroup,
    Selection,
    Text,
    AxisTickGenerator,
    NiceMode,
    formatValue,
    findMinMax,
    normalizeAngle360,
} = _ModuleSupport;

export class AxisTicks implements _ModuleSupport.TickGenerationAxis<any, any> {
    readonly id = createId(this);

    protected readonly axisGroup = new TranslatableGroup({ name: `${this.id}-AxisTicks`, zIndex: ZIndexMap.AXIS });
    protected readonly labelSelection = Selection.select<_ModuleSupport.Text, _ModuleSupport.TickDatum>(
        this.axisGroup,
        Text
    );

    private readonly tickGenerator = new AxisTickGenerator<_ModuleSupport.LinearScale, number>(this);

    readonly interval = new AxisInterval();
    readonly label = new AxisLabel();
    readonly scale = new LinearScale();

    position: AgChartLegendPosition = 'bottom';
    translationX: number = 0;
    translationY: number = 0;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {}

    private get horizontal(): boolean {
        return this.position === 'top' || this.position === 'bottom';
    }

    attachAxis(axisNode: _ModuleSupport.Node) {
        axisNode.appendChild(this.axisGroup);
    }

    calculateLayout(): _ModuleSupport.BBox | undefined {
        const { position, translationX, translationY, horizontal, label } = this;

        switch (position) {
            case 'top':
            case 'bottom':
                label.mirrored = false;
                label.parallel = true;
                break;
            case 'right':
            case 'left':
                label.mirrored = true;
                label.parallel = false;
                break;
        }

        const boxes: _ModuleSupport.BBox[] = [];

        const tickGenerationResult = this.generateTicks();
        const { textBaseline, textAlign, tickData } = tickGenerationResult;

        this.labelSelection.update(tickData.ticks, undefined, (datum) => datum.tickId);

        this.axisGroup.setProperties({ translationX, translationY });

        this.labelSelection.each((node, datum) => {
            node.fontFamily = label.fontFamily;
            node.fontSize = label.fontSize;
            node.fontStyle = label.fontStyle;
            node.fontWeight = label.fontWeight;
            node.fill = label.color;

            node.textBaseline = textBaseline;
            node.textAlign = textAlign;

            node.text = datum.tickLabel;
            node.x = horizontal ? datum.translationY : 0;
            node.y = horizontal ? 0 : datum.translationY;

            boxes.push(node.getBBox());
        });

        return boxes.length > 0 ? BBox.merge(boxes).translate(translationX, translationY) : undefined;
    }

    tickFormatter(
        domain: number[],
        _ticks: number[],
        _primary: boolean,
        fractionDigits?: number
    ): (value: any, index: number) => string | undefined {
        return (value, index) =>
            this.label.formatValue(
                (fn, params) => formatWithContext(this.ctx, fn, params),
                'number',
                value,
                index,
                domain,
                [],
                fractionDigits
            ) ?? formatValue(value, fractionDigits);
    }

    inRange(x: number, tolerance = 0.001): boolean {
        const [min, max] = findMinMax(this.scale.range);
        return x >= min - tolerance && x <= max + tolerance;
    }

    public padding: number = 0;

    private _cachedTicks:
        | { params: _ModuleSupport.TickGenerationParams<number>; ticks: _ModuleSupport.TickGenerationResult<number> }
        | undefined;
    private generateTicks() {
        const { scale, _cachedTicks } = this;

        const rotation = this.horizontal ? -0.5 * Math.PI : 0;
        const sideFlag = this.label.getSideFlag();
        const parallelFlipRotation = normalizeAngle360(rotation);
        const regularFlipRotation = normalizeAngle360(rotation - Math.PI / 2);
        const labelX = sideFlag * this.label.spacing;

        const params: _ModuleSupport.TickGenerationParams<number> = {
            domain: scale.domain,
            range: scale.range as any as [number, number],
            reverse: false,
            visibleRange: [0, 1],
            primaryTickCount: undefined,
            defaultTickMinSpacing: 0,
            niceMode: NiceMode.Off,
            labelX,
            parallelFlipRotation,
            regularFlipRotation,
            sideFlag,
            removeOverflowLabels: false,
        };

        if (_cachedTicks != null && _ModuleSupport.objectsEqual(_cachedTicks?.params, params)) {
            return _cachedTicks.ticks;
        }

        const ticks = this.tickGenerator.generateTicks({
            domain: scale.domain,
            range: scale.range as any as [number, number],
            reverse: false,
            visibleRange: [0, 1],
            primaryTickCount: undefined,
            defaultTickMinSpacing: 0,
            niceMode: NiceMode.Off,
            labelX,
            parallelFlipRotation,
            regularFlipRotation,
            sideFlag,
            removeOverflowLabels: false,
        });
        this._cachedTicks = { params, ticks };

        return ticks;
    }
}
