import { _ModuleSupport } from 'ag-charts-community';
import {
    type AnchorDirection,
    type BBox,
    type Bounds4,
    Group,
    type LabelFit,
    type Logger,
    type NormalisedSeriesAreaBackgroundRegion,
    type NormalisedSeriesAreaBackgroundRegionRange,
    Rect,
    type Scale,
    ScaleAlignment,
    Transformable,
    TransformableText,
    Vec4,
    anchorRoom,
    bandRangeExpansion,
    clampArray,
    createId,
    fitKeptLabel,
    fitLabelTextAutoSize,
    fontWithSize,
    freeTurnedRoom,
    hasRealChars,
    isValidScaleValue,
    resolveLabelFit,
    resolvePadding,
    toRadians,
    turnedRoom,
    unzoomedPosition,
} from 'ag-charts-core';
import type { AgSeriesAreaBackgroundRegionLabelPosition, AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

interface Anchor {
    regionH: AnchorDirection;
    regionV: AnchorDirection;
    labelH: AnchorDirection;
    labelV: AnchorDirection;
}

export const anchors: Record<AgSeriesAreaBackgroundRegionLabelPosition, Anchor> = {
    top: { regionH: 0, regionV: -1, labelH: 0, labelV: 1 },
    'inside-top': { regionH: 0, regionV: -1, labelH: 0, labelV: -1 },
    'left-top': { regionH: -1, regionV: -1, labelH: 1, labelV: -1 },
    'top-left': { regionH: -1, regionV: -1, labelH: -1, labelV: 1 },
    'inside-top-left': { regionH: -1, regionV: -1, labelH: -1, labelV: -1 },
    left: { regionH: -1, regionV: 0, labelH: 1, labelV: 0 },
    'inside-left': { regionH: -1, regionV: 0, labelH: -1, labelV: 0 },
    'left-bottom': { regionH: -1, regionV: 1, labelH: 1, labelV: 1 },
    'bottom-left': { regionH: -1, regionV: 1, labelH: -1, labelV: -1 },
    'inside-bottom-left': { regionH: -1, regionV: 1, labelH: -1, labelV: 1 },
    bottom: { regionH: 0, regionV: 1, labelH: 0, labelV: -1 },
    'inside-bottom': { regionH: 0, regionV: 1, labelH: 0, labelV: 1 },
    'right-bottom': { regionH: 1, regionV: 1, labelH: -1, labelV: 1 },
    'bottom-right': { regionH: 1, regionV: 1, labelH: 1, labelV: -1 },
    'inside-bottom-right': { regionH: 1, regionV: 1, labelH: 1, labelV: 1 },
    right: { regionH: 1, regionV: 0, labelH: -1, labelV: 0 },
    'inside-right': { regionH: 1, regionV: 0, labelH: 1, labelV: 0 },
    'right-top': { regionH: 1, regionV: -1, labelH: -1, labelV: -1 },
    'top-right': { regionH: 1, regionV: -1, labelH: 1, labelV: 1 },
    'inside-top-right': { regionH: 1, regionV: -1, labelH: 1, labelV: -1 },
    inside: { regionH: 0, regionV: 0, labelH: 0, labelV: 0 },
};

export class CartesianBackgroundRegion implements _ModuleSupport.BackgroundRegion {
    static readonly className = 'BackgroundRegion';
    readonly internalId = createId(this);

    xAxis?: _ModuleSupport.AxisContext;
    yAxis?: _ModuleSupport.AxisContext;

    readonly regionGroup = new Group({ name: this.internalId });
    readonly labelGroup = new Group({ name: this.internalId });

    private readonly regionNode = this.regionGroup.appendChild(new Rect());
    private readonly labelNode = this.labelGroup.appendChild(new TransformableText());

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

        const unzoomedBounds = this.getSeriesAreaBounds(this.unzoomed(bounds)) ?? labelBounds;
        this.updateLabelNode(labelBounds, unzoomedBounds);
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

    private updateLabelNode(bounds: Bounds4, unzoomedBounds: Bounds4) {
        this.updateLabel(bounds, unzoomedBounds);
        this.positionLabel(bounds);
    }

    private updateLabel(bounds: Bounds4, unzoomedBounds: Bounds4) {
        const {
            labelNode,
            opts: { label },
        } = this;
        if (!label) return;

        if (label.text == null || label.text === '') return;

        labelNode.setBoxing(label);
        const policy = resolveLabelFit(label);
        const fit = policy == null ? undefined : this.boundLabel(policy, bounds, unzoomedBounds);
        const fitted = fitLabelTextAutoSize(label.text, fit, label);
        const { text, fontSize } =
            fit != null && hasRealChars(label.text) && !hasRealChars(fitted.text)
                ? fitKeptLabel(label.text, fit, label)
                : fitted;

        labelNode.fill = label.color;
        labelNode.text = text;
        labelNode.textAlign = 'center';
        labelNode.textBaseline = 'middle';
        labelNode.setFont(fontWithSize(label, fontSize));
    }

    /**
     * The room the region leaves the label at its position, which an explicit bound or offset frees on its axis.
     * A label on a side of the region is measured zoomed out, so zoom and pan never rewrap it.
     */
    private boundLabel(fit: LabelFit, bounds: Bounds4, unzoomedBounds: Bounds4): LabelFit {
        const { label } = this.opts;
        if (!label) return fit;

        const { padding, rotation = 0, xOffset = 0, yOffset = 0 } = label;
        const { spacing, xPaddingDiff, yPaddingDiff } = this.labelAnchorOffsets(label);
        const boxed = this.labelNode.hasBoxing();
        const anchor = this.getAnchor();
        const sideH = anchor.regionH !== 0 && anchor.labelH === -anchor.regionH;
        const sideV = anchor.regionV !== 0 && anchor.labelV === -anchor.regionV;
        // A boxed label is drawn with its box on the anchor, so its room is measured from there.
        const axisRoom = (
            rangeDir: AnchorDirection,
            labelDir: AnchorDirection,
            start: number,
            size: number,
            diff: number
        ) => anchorRoom(rangeDir, labelDir, spacing, start, size, boxed ? 0 : diff);
        const xRoomOf = (room: Bounds4) =>
            axisRoom(anchor.regionH, anchor.labelH, room.x1, Vec4.width(room), xPaddingDiff);
        const yRoomOf = (room: Bounds4) =>
            axisRoom(anchor.regionV, anchor.labelV, room.y1, Vec4.height(room), yPaddingDiff);
        // Side labels hold the zoomed-out bound through zoom, capped by what is left in view.
        const side = sideH || sideV;
        const visibleX = xRoomOf(bounds);
        const visibleY = yRoomOf(bounds);
        let roomX = side ? Math.min(xRoomOf(unzoomedBounds), visibleX) : visibleX;
        let roomY = side ? Math.min(yRoomOf(unzoomedBounds), visibleY) : visibleY;
        if (sideH || xOffset !== 0) roomX = Infinity;
        if (sideV || yOffset !== 0) roomY = Infinity;
        if (roomX === Infinity && roomY === Infinity) return fit;

        const turned = turnedRoom(roomX, roomY, rotation, boxed ? resolvePadding(padding) : undefined);
        const rotated = freeTurnedRoom(turned, fit.maxWidth != null, fit.maxHeight != null);
        return rotated == null ? fit : { ...fit, rotated };
    }

    /** Shared by fitting and positioning, so the room is measured from where the label is drawn. */
    private labelAnchorOffsets({ padding, spacing = 0 }: NonNullable<NormalisedSeriesAreaBackgroundRegion['label']>) {
        return {
            spacing,
            xPaddingDiff: (padding.right ?? 0) - (padding.left ?? 0),
            yPaddingDiff: (padding.bottom ?? 0) - (padding.top ?? 0),
        };
    }

    private positionLabel(bounds: Bounds4) {
        const {
            labelNode,
            opts: { label },
        } = this;
        if (!label) return;

        const { rotation, xOffset = 0, yOffset = 0 } = label;
        const { spacing, xPaddingDiff, yPaddingDiff } = this.labelAnchorOffsets(label);
        const anchor = this.getAnchor();

        const bbox = labelNode.computeBBoxWithoutTransforms();
        if (bbox == null) return;

        const radians = toRadians(rotation ?? 0);
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));
        const halfWidth = (bbox.width * cos + bbox.height * sin) / 2;
        const halfHeight = (bbox.width * sin + bbox.height * cos) / 2;

        const anchorX = bounds.x1 + (Vec4.width(bounds) * (anchor.regionH + 1)) / 2;
        const anchorY = bounds.y1 + (Vec4.height(bounds) * (anchor.regionV + 1)) / 2;

        const x = anchorX - (halfWidth + spacing) * anchor.labelH - xPaddingDiff / 2 + xOffset;
        const y = anchorY - (halfHeight + spacing) * anchor.labelV - yPaddingDiff / 2 + yOffset;

        labelNode.rotation = radians;
        labelNode.x = x;
        labelNode.y = y;
        labelNode.rotationCenterX = x;
        labelNode.rotationCenterY = y;
    }

    getLabelBox(): BBox | undefined {
        const { labelGroup, labelNode } = this;
        if (!labelGroup.visible || labelNode.text == null || labelNode.text === '') return;
        return Transformable.toCanvas(labelNode);
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

    /** Zoom stretches each scale's range linearly about its axis range, so this undoes it. */
    private unzoomed(bounds: Bounds4): Bounds4 {
        const { xAxis, yAxis } = this;
        if (!xAxis || !yAxis) return bounds;

        return Vec4.from(
            unzoomedPosition(bounds.x1, xAxis.scale.range, xAxis.range),
            unzoomedPosition(bounds.y1, yAxis.scale.range, yAxis.range),
            unzoomedPosition(bounds.x2, xAxis.scale.range, xAxis.range),
            unzoomedPosition(bounds.y2, yAxis.scale.range, yAxis.range)
        );
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
