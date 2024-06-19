import {
    type AgChartLegendOrientation,
    type AgChartLegendPosition,
    type AgGradientLegendScaleOptions,
    _ModuleSupport,
    _Scale,
    _Scene,
    _Util,
} from 'ag-charts-community';

const { BOOLEAN, OBJECT, Layers, POSITION, Validate, POSITIVE_NUMBER, ProxyProperty } = _ModuleSupport;
const { BBox, Group, Rect, LinearGradientFill, Triangle } = _Scene;
const { createId } = _Util;

class GradientBar {
    @Validate(POSITIVE_NUMBER)
    thickness = 16;

    @Validate(POSITIVE_NUMBER)
    preferredLength = 100;
}

class GradientLegendAxis extends _ModuleSupport.CartesianAxis<_Scale.LinearScale, number> {
    colorDomain: number[] = [];

    constructor(ctx: _ModuleSupport.ModuleContext) {
        super(ctx, new _Scale.LinearScale(), { respondsToZoom: false });
        this.nice = false;
        this.line.enabled = false;
    }

    override calculateDomain() {
        this.setDomain(this.colorDomain);
    }

    protected override getTickSize() {
        return 0;
    }
}

class GradientLegendScale implements AgGradientLegendScaleOptions {
    constructor(public axis: GradientLegendAxis) {}

    @Validate(OBJECT)
    @ProxyProperty('axis.label')
    label!: _ModuleSupport.AxisLabel;

    @Validate(OBJECT)
    @ProxyProperty('axis.interval')
    interval!: _ModuleSupport.AxisInterval<number>;

    @ProxyProperty('axis.seriesAreaPadding')
    padding?: GradientLegendAxis['seriesAreaPadding'];
}

export class GradientLegend {
    static readonly className = 'GradientLegend';

    readonly id = createId(this);

    private readonly axis: GradientLegendAxis;

    private readonly group: _Scene.Group = new Group({ name: 'legend', layer: true, zIndex: Layers.LEGEND_ZINDEX });
    private readonly gradientRect: _Scene.Rect;
    private readonly gradientFill: _Scene.LinearGradientFill;
    private readonly axisGridGroup: _Scene.Group;
    private readonly axisGroup: _Scene.Group;
    private readonly arrow: _Scene.Triangle;

    private readonly gradient = new GradientBar();

    private readonly destroyFns: Function[] = [];

    private readonly layoutService: _ModuleSupport.ModuleContext['layoutService'];
    private readonly highlightManager: _ModuleSupport.HighlightManager;

    @Validate(BOOLEAN)
    enabled = false;

    @Validate(POSITION)
    position: AgChartLegendPosition = 'bottom';

    @Validate(BOOLEAN, { optional: true })
    reverseOrder?: boolean = undefined;

    // Placeholder
    pagination?: any = undefined;

    private getOrientation(): AgChartLegendOrientation {
        switch (this.position) {
            case 'right':
            case 'left':
                return 'vertical';
            case 'bottom':
            case 'top':
                return 'horizontal';
        }
    }

    /**
     * Spacing between the legend and the edge of the chart's element.
     */
    @Validate(POSITIVE_NUMBER)
    spacing = 20;

    scale: GradientLegendScale;

    data: _ModuleSupport.GradientLegendDatum[] = [];

    listeners: any = {};

    constructor(readonly ctx: _ModuleSupport.ModuleContext) {
        this.layoutService = ctx.layoutService;
        this.destroyFns.push(this.layoutService.addListener('start-layout', (e) => this.update(e.shrinkRect)));

        this.highlightManager = ctx.highlightManager;
        this.destroyFns.push(this.highlightManager.addListener('highlight-change', () => this.onChartHoverChange()));

        this.gradientRect = new Rect();
        this.gradientFill = new LinearGradientFill();
        this.gradientFill.mask = this.gradientRect;
        this.group.append(this.gradientFill);
        this.arrow = new Triangle();
        this.group.append(this.arrow);

        this.axisGridGroup = new Group({ name: 'legend-axis-grid-group' });
        this.group.append(this.axisGridGroup);
        this.axisGroup = new Group({ name: 'legend-axis-group' });
        this.group.append(this.axisGroup);

        this.axis = new GradientLegendAxis(ctx);
        this.axis.attachAxis(this.axisGroup, this.axisGridGroup);

        this.scale = new GradientLegendScale(this.axis);

        this.destroyFns.push(() => this.detachLegend());
    }

    destroy() {
        this.destroyFns.forEach((f) => f());
    }

    attachLegend(scene: _Scene.Scene) {
        scene.appendChild(this.group);
    }

    detachLegend() {
        this.group.parent?.removeChild(this.group);
    }

    private latestGradientBox?: _Scene.BBox = undefined;

    private update(shrinkRect: _Scene.BBox) {
        const data = this.data[0];

        if (!this.enabled || !data || !data.enabled) {
            this.group.visible = false;
            return { shrinkRect: shrinkRect.clone() };
        }

        const { colorRange } = this.normalizeColorArrays(data);

        const gradientBox = this.updateGradientRect(shrinkRect, colorRange);
        const axisBox = this.updateAxis(data, gradientBox);
        const { newShrinkRect, translateX, translateY } = this.getMeasurements(shrinkRect, gradientBox, axisBox);
        this.updateArrow(gradientBox);

        this.group.visible = true;
        this.group.translationX = translateX;
        this.group.translationY = translateY;

        this.latestGradientBox = gradientBox;

        return { shrinkRect: newShrinkRect };
    }

    private normalizeColorArrays(data: _ModuleSupport.GradientLegendDatum) {
        let colorDomain = data.colorDomain.slice();
        const colorRange = data.colorRange.slice();

        if (colorDomain.length === colorRange.length) {
            return { colorDomain, colorRange };
        }

        if (colorDomain.length > colorRange.length) {
            colorRange.splice(colorDomain.length);
        }

        const count = colorRange.length;
        colorDomain = colorRange.map((_, i) => {
            const [d0, d1] = colorDomain;
            if (i === 0) return d0;
            if (i === count - 1) return d1;
            return d0 + ((d1 - d0) * i) / (count - 1);
        });

        return { colorDomain, colorRange };
    }

    private updateGradientRect(shrinkRect: _Scene.BBox, colorRange: string[]) {
        const { reverseOrder, gradientFill, gradientRect } = this;
        const { preferredLength: gradientLength, thickness } = this.gradient;

        const gradientBox = new BBox(0, 0, 0, 0);
        const vertical = this.getOrientation() === 'vertical';
        if (vertical) {
            const maxHeight = shrinkRect.height;
            const preferredHeight = gradientLength;
            gradientBox.x = 0;
            gradientBox.y = 0;
            gradientBox.width = thickness;
            gradientBox.height = Math.min(maxHeight, preferredHeight);
        } else {
            const maxWidth = shrinkRect.width;
            const preferredWidth = gradientLength;
            gradientBox.x = 0;
            gradientBox.y = 0;
            gradientBox.width = Math.min(maxWidth, preferredWidth);
            gradientBox.height = thickness;
        }

        gradientFill.stops = colorRange;
        if (vertical) {
            gradientFill.direction = reverseOrder ? 'to-bottom' : 'to-top';
        } else {
            gradientFill.direction = reverseOrder ? 'to-left' : 'to-right';
        }

        gradientRect.x = gradientBox.x;
        gradientRect.y = gradientBox.y;
        gradientRect.width = gradientBox.width;
        gradientRect.height = gradientBox.height;

        return gradientBox;
    }

    private updateAxis(data: _ModuleSupport.GradientLegendDatum, gradientBox: _Scene.BBox) {
        const { reverseOrder, axis } = this;
        const vertical = this.getOrientation() === 'vertical';
        const positiveAxis = reverseOrder !== vertical;

        axis.position = vertical ? 'right' : 'bottom';
        axis.colorDomain = positiveAxis ? data.colorDomain.slice().reverse() : data.colorDomain;
        axis.calculateDomain();

        axis.range = vertical ? [0, gradientBox.height] : [0, gradientBox.width];
        axis.gridLength = 0;
        axis.translation.x = gradientBox.x + (vertical ? gradientBox.width : 0);
        axis.translation.y = gradientBox.y + (vertical ? 0 : gradientBox.height);
        const axisBox = axis.calculateLayout().bbox;
        axis.update();

        return axisBox;
    }

    private updateArrow(gradientBox: _Scene.BBox) {
        const {
            arrow,
            axis: { label, scale },
        } = this;

        const highlighted = this.highlightManager.getActiveHighlight();
        const colorValue = highlighted?.colorValue;
        if (highlighted == null || colorValue == null) {
            arrow.visible = false;
            return;
        }

        const vertical = this.getOrientation() === 'vertical';
        const size = label.fontSize ?? 0;
        const t = scale.convert(colorValue);
        let x: number;
        let y: number;
        let rotation: number;
        if (vertical) {
            x = gradientBox.x - size / 2;
            y = gradientBox.y + t;
            rotation = Math.PI / 2;
        } else {
            x = gradientBox.x + t;
            y = gradientBox.y - size / 2;
            rotation = Math.PI;
        }

        arrow.fill = label.color;
        arrow.size = size;
        arrow.translationX = x;
        arrow.translationY = y;
        arrow.rotation = rotation;
        arrow.visible = true;
    }

    private getMeasurements(shrinkRect: _Scene.BBox, gradientBox: _Scene.BBox, axisBox: _Scene.BBox) {
        let width: number;
        let height: number;
        const vertical = this.getOrientation() === 'vertical';
        if (vertical) {
            width = gradientBox.width + axisBox.width;
            height = gradientBox.height;
        } else {
            width = gradientBox.width;
            height = gradientBox.height + axisBox.height;
        }

        const { spacing } = this;
        const newShrinkRect = shrinkRect.clone();
        let left: number;
        let top: number;

        if (this.position === 'left') {
            left = shrinkRect.x;
            top = shrinkRect.y + shrinkRect.height / 2 - height / 2;
            newShrinkRect.shrink(width + spacing, 'left');
        } else if (this.position === 'right') {
            left = shrinkRect.x + shrinkRect.width - width;
            top = shrinkRect.y + shrinkRect.height / 2 - height / 2;
            newShrinkRect.shrink(width + spacing, 'right');
        } else if (this.position === 'top') {
            left = shrinkRect.x + shrinkRect.width / 2 - width / 2;
            top = shrinkRect.y;
            newShrinkRect.shrink(height + spacing, 'top');
        } else {
            left = shrinkRect.x + shrinkRect.width / 2 - width / 2;
            top = shrinkRect.y + shrinkRect.height - height;
            newShrinkRect.shrink(height + spacing, 'bottom');
        }

        return {
            translateX: left,
            translateY: top,
            gradientBox,
            newShrinkRect,
        };
    }

    computeBBox(): _Scene.BBox {
        return this.group.computeBBox();
    }

    private onChartHoverChange() {
        if (this.enabled && this.latestGradientBox != null) {
            this.updateArrow(this.latestGradientBox);
        }
    }
}
