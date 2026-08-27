import { _ModuleSupport } from 'ag-charts-community';
import {
    type Bounds4,
    type Logger,
    type NormalisedSeriesAreaBackgroundRegion,
    type NormalisedSeriesAreaBackgroundRegionRange,
    type Scale,
    ScaleAlignment,
    Vec4,
    clampArray,
    createId,
    toRadians,
} from 'ag-charts-core';
import type { AgSeriesAreaBackgroundRegionLabelPosition, AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

const { bandRangeExpansion, isValidScaleValue } = _ModuleSupport;

type AnchorDirection = 1 | 0 | -1;

interface Anchor {
    regionH: AnchorDirection;
    regionV: AnchorDirection;
    labelH: AnchorDirection;
    labelV: AnchorDirection;
}

const anchors: Record<AgSeriesAreaBackgroundRegionLabelPosition, Anchor> = {
    top: { regionH: 0, regionV: -1, labelH: 0, labelV: 1 },
    'inside-top': { regionH: 0, regionV: -1, labelH: 0, labelV: -1 },
    'top-left': { regionH: -1, regionV: -1, labelH: 1, labelV: -1 },
    'top-left-above': { regionH: -1, regionV: -1, labelH: -1, labelV: 1 },
    'inside-top-left': { regionH: -1, regionV: -1, labelH: -1, labelV: -1 },
    left: { regionH: -1, regionV: 0, labelH: 1, labelV: 0 },
    'inside-left': { regionH: -1, regionV: 0, labelH: -1, labelV: 0 },
    'bottom-left': { regionH: -1, regionV: 1, labelH: 1, labelV: 1 },
    'bottom-left-below': { regionH: -1, regionV: 1, labelH: -1, labelV: -1 },
    'inside-bottom-left': { regionH: -1, regionV: 1, labelH: -1, labelV: 1 },
    bottom: { regionH: 0, regionV: 1, labelH: 0, labelV: -1 },
    'inside-bottom': { regionH: 0, regionV: 1, labelH: 0, labelV: 1 },
    'bottom-right': { regionH: 1, regionV: 1, labelH: -1, labelV: 1 },
    'bottom-right-below': { regionH: 1, regionV: 1, labelH: 1, labelV: -1 },
    'inside-bottom-right': { regionH: 1, regionV: 1, labelH: 1, labelV: 1 },
    right: { regionH: 1, regionV: 0, labelH: -1, labelV: 0 },
    'inside-right': { regionH: 1, regionV: 0, labelH: 1, labelV: 0 },
    'top-right': { regionH: 1, regionV: -1, labelH: -1, labelV: -1 },
    'top-right-above': { regionH: 1, regionV: -1, labelH: 1, labelV: 1 },
    'inside-top-right': { regionH: 1, regionV: -1, labelH: 1, labelV: -1 },
    inside: { regionH: 0, regionV: 0, labelH: 0, labelV: 0 },
};

export class CartesianBackgroundRegion implements _ModuleSupport.BackgroundRegion {
    static readonly className = 'BackgroundRegion';
    readonly internalId = createId(this);

    xAxis?: _ModuleSupport.AxisContext;
    yAxis?: _ModuleSupport.AxisContext;

    readonly regionGroup = new _ModuleSupport.Group({ name: this.internalId });
    readonly labelGroup = new _ModuleSupport.Group({ name: this.internalId });

    private readonly regionNode = this.regionGroup.appendChild(new _ModuleSupport.Rect());
    private readonly labelNode = this.labelGroup.appendChild(new _ModuleSupport.TransformableText());

    private opts!: NormalisedSeriesAreaBackgroundRegion;

    constructor(private readonly logger: Logger) {}

    setOptions(opts: NormalisedSeriesAreaBackgroundRegion) {
        this.opts = opts;
    }

    update(index: number) {
        const bounds = this.getBounds(index);

        this.regionGroup.visible = bounds != null;

        if (bounds == null) {
            this.labelGroup.visible = false;
            return;
        }

        this.updateRegionNode(bounds);

        // The label anchors to the visible part of the region rather than the region itself, so it
        // stays at the series area edge while the region extends past it, matching cross line labels.
        const labelBounds = this.getSeriesAreaBounds(bounds);
        this.labelGroup.visible = labelBounds != null;

        if (labelBounds == null) return;

        this.updateLabelNode(labelBounds);
    }

    private updateRegionNode(bounds: Bounds4) {
        const { opts } = this;

        this.regionNode.x = bounds.x1;
        this.regionNode.y = bounds.y1;
        this.regionNode.width = Vec4.width(bounds);
        this.regionNode.height = Vec4.height(bounds);

        this.regionNode.fill = opts.fill;
        this.regionNode.fillOpacity = opts.fillOpacity ?? 1;
        this.regionNode.stroke = opts.stroke;
        this.regionNode.strokeOpacity = opts.strokeOpacity ?? 1;
        this.regionNode.strokeWidth = opts.strokeWidth ?? 1;
    }

    private updateLabelNode(bounds: Bounds4) {
        this.updateLabel();
        this.positionLabel(bounds);
    }

    private updateLabel() {
        const {
            labelNode,
            opts: { label },
        } = this;
        if (!label) return;

        if (!label.text) return;

        labelNode.fill = label.color;
        labelNode.text = label.text;
        labelNode.textAlign = 'center';
        labelNode.textBaseline = 'middle';
        labelNode.setFont(label);
        labelNode.setBoxing(label);
    }

    private positionLabel(bounds: Bounds4) {
        const {
            labelNode,
            opts: { label },
        } = this;
        if (!label) return;

        const { padding, rotation, xOffset = 0, yOffset = 0 } = label;
        const anchor = this.getAnchor();

        const bbox = labelNode.getBBox();
        if (!bbox) return;

        const { width, height } = bbox;

        const xPaddingDiff = (padding.right ?? 0) - (padding.left ?? 0);
        const yPaddingDiff = (padding.bottom ?? 0) - (padding.top ?? 0);

        const halfWidth = width / 2;
        const halfHeight = height / 2;

        const anchorX = bounds.x1 + (Vec4.width(bounds) * (anchor.regionH + 1)) / 2;
        const anchorY = bounds.y1 + (Vec4.height(bounds) * (anchor.regionV + 1)) / 2;

        const x = anchorX - halfWidth * anchor.labelH - xPaddingDiff / 2 + xOffset;
        const y = anchorY - halfHeight * anchor.labelV - yPaddingDiff / 2 + yOffset;

        labelNode.rotation = toRadians(rotation ?? 0);
        labelNode.x = x;
        labelNode.y = y;
        labelNode.rotationCenterX = x;
        labelNode.rotationCenterY = y;
    }

    private getBounds(index: number): Bounds4 | undefined {
        const { opts, xAxis, yAxis } = this;
        if (!xAxis || !yAxis) return;

        const x = this.getAxisExtent(index, xAxis.scale, opts.xRange, 'xRange');
        const y = this.getAxisExtent(index, yAxis.scale, opts.yRange, 'yRange');
        if (!x || !y) return;

        const bounds = Vec4.from(x[0], y[0], x[1], y[1]);

        // Only warn if the user has set both the start and end of a range. Otherwise the range will match the domain,
        // which can vary, and so should not warn.
        const xRangeHasBound = opts.xRange?.start != null && opts.xRange?.end != null;
        const yRangeHasBound = opts.yRange?.start != null && opts.yRange?.end != null;

        if ((Vec4.width(bounds) === 0 && xRangeHasBound) || (Vec4.height(bounds) === 0 && yRangeHasBound)) {
            this.logger.warnOnce(
                `\`seriesArea.backgroundRegions[${index}]\` region has no width or height, ignoring. Check that \`start\` and \`end\` differ.`
            );
            return;
        }

        return bounds;
    }

    /** Clamps bounds to the series area, returning `undefined` when nothing of the region is in view. */
    private getSeriesAreaBounds(bounds: Bounds4): Bounds4 | undefined {
        const { xAxis, yAxis } = this;
        if (!xAxis || !yAxis) return;

        const clamped = Vec4.from(
            clampArray(bounds.x1, xAxis.range),
            clampArray(bounds.y1, yAxis.range),
            clampArray(bounds.x2, xAxis.range),
            clampArray(bounds.y2, yAxis.range)
        );

        if (Vec4.width(clamped) === 0 || Vec4.height(clamped) === 0) return;

        return clamped;
    }

    /**
     * Resolves one axis' range to an ascending pixel pair. An omitted bound extends to that end of
     * the series area; a bound the axis cannot resolve drops the whole region.
     */
    private getAxisExtent(
        index: number,
        scale: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>,
        range: NormalisedSeriesAreaBackgroundRegionRange | undefined,
        optionsKey: string
    ): [number, number] | undefined {
        const { start, end } = range ?? {};

        if ((start != null && !isValidScaleValue(start, scale)) || (end != null && !isValidScaleValue(end, scale))) {
            this.logger.warnOnce(
                `\`seriesArea.backgroundRegions[${index}].${optionsKey}\` does not match the axis type or domain, ignoring.`
            );
            return;
        }

        let p0 = start == null ? scale.range[0] : scale.convert(start, { alignment: ScaleAlignment.Leading });
        let p1 = end == null ? scale.range[1] : scale.convert(end, { alignment: ScaleAlignment.Trailing });

        // Only a bound resolved from a value needs band expansion — an omitted one already sits on
        // the series area edge.
        let expandStart = start != null;
        let expandEnd = end != null;

        if (p0 > p1) {
            [p0, p1] = [p1, p0];
            [expandStart, expandEnd] = [expandEnd, expandStart];
        }

        const { bandwidth, rangePadding } = bandRangeExpansion(scale);
        if (expandStart) p0 -= rangePadding;
        if (expandEnd) p1 += bandwidth + rangePadding;

        return [p0, p1];
    }

    private getAnchor(): Anchor {
        const { position = 'top' } = this.opts.label ?? {};
        return anchors[position];
    }
}
