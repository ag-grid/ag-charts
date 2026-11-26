import { _ModuleSupport } from 'ag-charts-community';
import {
    type AnchorDirection,
    BBox,
    type Bounds4,
    type BoxBounds,
    type DynamicContext,
    Group,
    type LabelFit,
    type NormalisedSeriesAreaBackgroundRegion,
    type NormalisedSeriesAreaBackgroundRegionRange,
    type PointLabelDatum,
    type PositionedLabelCandidate,
    RANGE_LABEL_ANCHORS,
    type RangeLabelAnchor,
    Rect,
    type Scale,
    ScaleAlignment,
    type TextMeasurer,
    Transformable,
    TransformableText,
    Vec4,
    anchorRoom,
    bandRangeExpansion,
    cachedTextMeasurer,
    clampArray,
    createId,
    fitKeptLabel,
    fitLabelTextAutoSize,
    fontWithSize,
    freeTurnedRoom,
    hasRealChars,
    isInsideRangeAnchor,
    isValidScaleValue,
    resolveLabelAvoidance,
    resolveLabelFit,
    resolvePadding,
    resolveRangeLabelPlacement,
    toRadians,
    turnedRoom,
    unzoomedPosition,
} from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

type FittedLabel = { text: string; fontSize: number | undefined; measurer: TextMeasurer; key: string };

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

    private labelBounds: Bounds4 | undefined = undefined;
    private unzoomedLabelBounds: Bounds4 | undefined = undefined;
    private anchors: RangeLabelAnchor[] | undefined = undefined;
    private anchorsRtl = false;
    /** Index into {@link anchors} of the placement the label is drawn at. */
    private chosen = 0;
    private labelHidden = false;
    private readonly candidateIndices = new Map<PositionedLabelCandidate, number>();
    private readonly fitted: (FittedLabel | undefined)[] = [];

    constructor(private readonly ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {}

    setOptions(opts: NormalisedSeriesAreaBackgroundRegion) {
        this.opts = opts;
        this.anchors = undefined;
        this.chosen = 0;
        this.labelHidden = false;
        this.fitted.length = 0;
    }

    get hasLabel(): boolean {
        const text = this.opts.label?.text;
        return text != null && text !== '';
    }

    get keepsLabel(): boolean {
        return this.opts.label?.collision?.alwaysShow ?? true;
    }

    update(index: number) {
        const bounds = this.getBounds(index);

        this.regionGroup.visible = bounds != null;

        this.labelBounds = undefined;
        this.unzoomedLabelBounds = undefined;
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

        this.labelBounds = labelBounds;
        this.unzoomedLabelBounds = this.getSeriesAreaBounds(this.unzoomed(bounds)) ?? labelBounds;
        this.labelNode.visible = !this.labelHidden;
        this.layoutLabel(this.chosen);
    }

    getLabelDatum(seriesRect: BBox, container: BoxBounds): PointLabelDatum | undefined {
        if (!this.labelGroup.visible || this.labelBounds == null) return;

        const { collision } = this.opts.label ?? {};
        const keep = this.keepsLabel;
        const anchors = this.resolvedAnchors;
        const sole = anchors.length === 1;
        const positionedCandidates: PositionedLabelCandidate[] = [];
        this.candidateIndices.clear();
        for (let index = 0; index < anchors.length; index++) {
            const footprint = this.footprintAt(index);
            if (footprint == null) continue;
            const { width, height } = footprint;
            const box = { x: footprint.x - seriesRect.x, y: footprint.y - seriesRect.y, width, height };
            // Already the rotated footprint, so it carries no rotation for the engine to inflate it by again.
            const candidate: PositionedLabelCandidate = {
                box,
                size: { width, height },
                region: keep && sole ? undefined : this.labelRegion(anchors[index], seriesRect, container),
                flushToRegion: false,
            };
            this.candidateIndices.set(candidate, index);
            positionedCandidates.push(candidate);
        }

        const [first] = positionedCandidates;
        if (first == null) return;
        return {
            point: { x: 0, y: 0, size: 0 },
            label: { text: this.labelNode.text ?? '', width: first.box.width, height: first.box.height },
            anchor: undefined,
            placement: undefined,
            alwaysShow: keep ? undefined : false,
            neverDrop: keep,
            obstacleCategory: 'regionLabel',
            avoid: {
                ...resolveLabelAvoidance({ alwaysShow: true }),
                seriesArea: false,
                axisLabel: false,
                crossLineLabel: true,
                regionLabel: true,
            },
            threshold: collision?.threshold,
            positionedCandidates,
        };
    }

    applyLabelPlacement(hidden: boolean, candidate: PositionedLabelCandidate | undefined) {
        const index = candidate == null ? undefined : this.candidateIndices.get(candidate);
        if (index != null && index !== this.chosen) {
            this.chosen = index;
            this.layoutLabel(index);
        }
        this.labelHidden = hidden;
        this.labelNode.visible = !hidden;
    }

    /** An inside placement must fit the visible region; any other, the chart. */
    private labelRegion(anchor: RangeLabelAnchor, seriesRect: BBox, container: BoxBounds): BoxBounds {
        const bounds = this.labelBounds!;
        const box = isInsideRangeAnchor(anchor)
            ? Transformable.toCanvas(
                  this.labelGroup,
                  new BBox(bounds.x1, bounds.y1, Vec4.width(bounds), Vec4.height(bounds))
              )
            : container;
        return { x: box.x - seriesRect.x, y: box.y - seriesRect.y, width: box.width, height: box.height };
    }

    /** The label is laid out at another placement to measure it there, as its text is fitted to each one's room. */
    private footprintAt(index: number): BBox | undefined {
        const { chosen, labelNode } = this;
        if (index !== chosen) this.layoutLabel(index);
        const footprint = this.hasLabelText() ? Transformable.toCanvas(labelNode) : undefined;
        if (index !== chosen) this.layoutLabel(chosen);
        return footprint;
    }

    private hasLabelText() {
        const { text } = this.labelNode;
        return text != null && text !== '';
    }

    private get resolvedAnchors(): RangeLabelAnchor[] {
        const rtl = this.ctx.domManager.isRtl;
        if (this.anchors == null || this.anchorsRtl !== rtl) {
            this.anchors = this.resolveAnchors(rtl);
            this.anchorsRtl = rtl;
        }
        return this.anchors;
    }

    /** `placement` wins over the deprecated `position`; `top` is the default. */
    private resolveAnchors(rtl: boolean): RangeLabelAnchor[] {
        const { placement, position } = this.opts.label ?? {};
        const anchors: RangeLabelAnchor[] = [];
        if (placement != null) {
            for (const entry of typeof placement === 'string' ? [placement] : placement) {
                const anchor = resolveRangeLabelPlacement(entry, rtl);
                if (anchor != null) anchors.push(anchor);
            }
        } else if (position != null) {
            anchors.push(RANGE_LABEL_ANCHORS[position]);
        }
        if (anchors.length === 0) anchors.push(RANGE_LABEL_ANCHORS.top);
        return anchors;
    }

    private anchorAt(index: number): RangeLabelAnchor {
        const anchors = this.resolvedAnchors;
        return anchors[index] ?? anchors[0];
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

    private layoutLabel(index: number) {
        const { labelBounds, unzoomedLabelBounds } = this;
        if (labelBounds == null || unzoomedLabelBounds == null) return;
        const anchor = this.anchorAt(index);
        this.updateLabel(index, anchor, labelBounds, unzoomedLabelBounds);
        this.positionLabel(labelBounds, anchor);
    }

    private updateLabel(index: number, anchor: RangeLabelAnchor, bounds: Bounds4, unzoomedBounds: Bounds4) {
        const {
            labelNode,
            opts: { label },
        } = this;
        if (!label) return;

        if (label.text == null || label.text === '') return;

        labelNode.setBoxing(label);
        const { text, fontSize } = this.fittedLabel(index, anchor, bounds, unzoomedBounds);

        labelNode.fill = label.color;
        labelNode.text = text;
        labelNode.textAlign = 'center';
        labelNode.textBaseline = 'middle';
        labelNode.setFont(fontWithSize(label, fontSize));
    }

    /** Keyed on the measurer, which a web font load replaces, and on the room, so re-laying out a placement is free. */
    private fittedLabel(index: number, anchor: RangeLabelAnchor, bounds: Bounds4, unzoomedBounds: Bounds4) {
        const label = this.opts.label!;
        const text = label.text ?? '';
        const keep = this.keepsLabel;
        const measurer = cachedTextMeasurer(label);
        const policy = resolveLabelFit(label, !keep);
        const fit = policy == null ? undefined : this.boundLabel(policy, anchor, bounds, unzoomedBounds);
        const key = fit?.rotated == null ? '' : `${fit.rotated.width}:${fit.rotated.height}`;
        const cached = this.fitted[index];
        if (cached?.measurer === measurer && cached.key === key) return cached;

        const fitted = fitLabelTextAutoSize(text, fit, label);
        const kept =
            fit != null && keep && hasRealChars(text) && !hasRealChars(fitted.text)
                ? fitKeptLabel(text, fit, label)
                : { text: typeof fitted.text === 'string' ? fitted.text : text, fontSize: fitted.fontSize };
        const entry = { text: kept.text, fontSize: kept.fontSize, measurer, key };
        this.fitted[index] = entry;
        return entry;
    }

    /**
     * The room the region leaves the label at its position, which an explicit bound or offset frees on its axis.
     * A label on a side of the region is measured zoomed out, so zoom and pan never rewrap it.
     */
    private boundLabel(fit: LabelFit, anchor: RangeLabelAnchor, bounds: Bounds4, unzoomedBounds: Bounds4): LabelFit {
        const { label } = this.opts;
        if (!label) return fit;

        const { padding, rotation = 0, xOffset = 0, yOffset = 0 } = label;
        const { spacing, xPaddingDiff, yPaddingDiff } = this.labelAnchorOffsets(label);
        const boxed = this.labelNode.hasBoxing();
        const sideH = anchor.rangeH !== 0 && anchor.labelH === -anchor.rangeH;
        const sideV = anchor.rangeV !== 0 && anchor.labelV === -anchor.rangeV;
        // A boxed label is drawn with its box on the anchor, so its room is measured from there.
        const axisRoom = (
            rangeDir: AnchorDirection,
            labelDir: AnchorDirection,
            start: number,
            size: number,
            diff: number
        ) => anchorRoom(rangeDir, labelDir, spacing, start, size, boxed ? 0 : diff);
        const xRoomOf = (room: Bounds4) =>
            axisRoom(anchor.rangeH, anchor.labelH, room.x1, Vec4.width(room), xPaddingDiff);
        const yRoomOf = (room: Bounds4) =>
            axisRoom(anchor.rangeV, anchor.labelV, room.y1, Vec4.height(room), yPaddingDiff);
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

    private positionLabel(bounds: Bounds4, anchor: RangeLabelAnchor) {
        const {
            labelNode,
            opts: { label },
        } = this;
        if (!label) return;

        const { rotation, xOffset = 0, yOffset = 0 } = label;
        const { spacing, xPaddingDiff, yPaddingDiff } = this.labelAnchorOffsets(label);

        const bbox = labelNode.computeBBoxWithoutTransforms();
        if (bbox == null) return;

        const radians = toRadians(rotation ?? 0);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const halfWidth = (bbox.width * Math.abs(cos) + bbox.height * Math.abs(sin)) / 2;
        const halfHeight = (bbox.width * Math.abs(sin) + bbox.height * Math.abs(cos)) / 2;
        // A box grows by its padding before it turns, so its off-centre shift turns with it.
        const [shiftX, shiftY] = labelNode.hasBoxing()
            ? [xPaddingDiff * cos - yPaddingDiff * sin, xPaddingDiff * sin + yPaddingDiff * cos]
            : [xPaddingDiff, yPaddingDiff];

        const anchorX = bounds.x1 + (Vec4.width(bounds) * (anchor.rangeH + 1)) / 2;
        const anchorY = bounds.y1 + (Vec4.height(bounds) * (anchor.rangeV + 1)) / 2;

        const x = anchorX - (halfWidth + spacing) * anchor.labelH - shiftX / 2 + xOffset;
        const y = anchorY - (halfHeight + spacing) * anchor.labelV - shiftY / 2 + yOffset;

        labelNode.rotation = radians;
        labelNode.x = x;
        labelNode.y = y;
        labelNode.rotationCenterX = x;
        labelNode.rotationCenterY = y;
    }

    getLabelBox(): BBox | undefined {
        const { labelGroup, labelNode } = this;
        if (!labelGroup.visible || !labelNode.visible || !this.hasLabelText()) return;
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
            this.ctx.logger.warnOnce(
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
            this.ctx.logger.warnOnce(
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
}
