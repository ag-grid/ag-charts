import { _ModuleSupport } from 'ag-charts-community';
import {
    type Bounds4,
    type Logger,
    type NormalisedSeriesAreaBackgroundRegion,
    type NormalisedSeriesAreaBackgroundRegionRange,
    type Scale,
    ScaleAlignment,
    Vec4,
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

const horizontalAnchors: Record<AgSeriesAreaBackgroundRegionLabelPosition, Anchor> = {
    top: { regionH: 0, regionV: -1, labelH: 0, labelV: 1 },
    'inside-top': { regionH: 0, regionV: -1, labelH: 0, labelV: -1 },
    'top-left': { regionH: -1, regionV: -1, labelH: -1, labelV: 1 },
    'inside-top-left': { regionH: -1, regionV: -1, labelH: -1, labelV: -1 },
    left: { regionH: -1, regionV: 0, labelH: 1, labelV: 0 },
    'inside-left': { regionH: -1, regionV: 0, labelH: -1, labelV: 0 },
    'bottom-left': { regionH: -1, regionV: 1, labelH: -1, labelV: -1 },
    'inside-bottom-left': { regionH: -1, regionV: 1, labelH: -1, labelV: 1 },
    bottom: { regionH: 0, regionV: 1, labelH: 0, labelV: -1 },
    'inside-bottom': { regionH: 0, regionV: 1, labelH: 0, labelV: 1 },
    'bottom-right': { regionH: 1, regionV: 1, labelH: 1, labelV: -1 },
    'inside-bottom-right': { regionH: 1, regionV: 1, labelH: 1, labelV: 1 },
    right: { regionH: 1, regionV: 0, labelH: -1, labelV: 0 },
    'inside-right': { regionH: 1, regionV: 0, labelH: 1, labelV: 0 },
    'top-right': { regionH: 1, regionV: -1, labelH: 1, labelV: 1 },
    'inside-top-right': { regionH: 1, regionV: -1, labelH: 1, labelV: -1 },
    inside: { regionH: 0, regionV: 0, labelH: 0, labelV: 0 },
};

const verticalAnchors: Record<AgSeriesAreaBackgroundRegionLabelPosition, Anchor> = {
    top: { regionH: 0, regionV: -1, labelH: 0, labelV: 1 },
    'inside-top': { regionH: 0, regionV: -1, labelH: 0, labelV: -1 },
    'top-left': { regionH: -1, regionV: -1, labelH: 1, labelV: -1 },
    'inside-top-left': { regionH: -1, regionV: -1, labelH: -1, labelV: -1 },
    left: { regionH: -1, regionV: 0, labelH: 1, labelV: 0 },
    'inside-left': { regionH: -1, regionV: 0, labelH: -1, labelV: 0 },
    'bottom-left': { regionH: -1, regionV: 1, labelH: 1, labelV: 1 },
    'inside-bottom-left': { regionH: -1, regionV: 1, labelH: -1, labelV: 1 },
    bottom: { regionH: 0, regionV: 1, labelH: 0, labelV: -1 },
    'inside-bottom': { regionH: 0, regionV: 1, labelH: 0, labelV: 1 },
    'bottom-right': { regionH: 1, regionV: 1, labelH: -1, labelV: 1 },
    'inside-bottom-right': { regionH: 1, regionV: 1, labelH: 1, labelV: 1 },
    right: { regionH: 1, regionV: 0, labelH: -1, labelV: 0 },
    'inside-right': { regionH: 1, regionV: 0, labelH: 1, labelV: 0 },
    'top-right': { regionH: 1, regionV: -1, labelH: -1, labelV: -1 },
    'inside-top-right': { regionH: 1, regionV: -1, labelH: 1, labelV: -1 },
    inside: { regionH: 0, regionV: 0, labelH: 0, labelV: 0 },
};

export class CartesianBackgroundRegion implements _ModuleSupport.BackgroundRegion {
    static readonly className = 'BackgroundRegion';
    readonly internalId = createId(this);

    xScale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;
    yScale?: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>;

    readonly regionGroup = new _ModuleSupport.Group({ name: this.internalId });
    readonly labelGroup = new _ModuleSupport.Group({ name: this.internalId });

    private readonly regionNode = this.regionGroup.appendChild(new _ModuleSupport.Rect());
    private readonly labelNode = this.labelGroup.appendChild(new _ModuleSupport.TransformableText());

    private opts!: NormalisedSeriesAreaBackgroundRegion;

    constructor(private readonly logger: Logger) {}

    setOptions(opts: NormalisedSeriesAreaBackgroundRegion) {
        this.opts = opts;
    }

    update() {
        const bounds = this.getBounds();
        const visible = bounds != null;

        this.regionGroup.visible = visible;
        this.labelGroup.visible = visible;

        if (bounds == null) return;

        this.updateRegionNode(bounds);
        this.updateLabelNode(bounds);
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

        const { padding, rotation } = label;
        const anchor = this.getAnchor();

        const bbox = labelNode.getBBox();
        if (!bbox) return;

        const { width, height } = bbox;

        const xPaddingDiff = (padding.right ?? 0) - (padding.left ?? 0);
        const yPaddingDiff = (padding.bottom ?? 0) - (padding.top ?? 0);

        const xOffset = width / 2;
        const yOffset = height / 2;

        const x =
            bounds.x1 + (Vec4.width(bounds) * (anchor.regionH + 1)) / 2 - xOffset * anchor.labelH - xPaddingDiff / 2;
        const y =
            bounds.y1 + (Vec4.height(bounds) * (anchor.regionV + 1)) / 2 - yOffset * anchor.labelV - yPaddingDiff / 2;

        labelNode.rotation = toRadians(rotation ?? 0);
        labelNode.x = x;
        labelNode.y = y;
        labelNode.rotationCenterX = x;
        labelNode.rotationCenterY = y;
    }

    private getBounds(): Bounds4 | undefined {
        const { opts, xScale, yScale } = this;
        if (!xScale || !yScale) return;

        const x = this.getAxisExtent(xScale, opts.xRange, 'xRange');
        const y = this.getAxisExtent(yScale, opts.yRange, 'yRange');
        if (!x || !y) return;

        const bounds = Vec4.from(x[0], y[0], x[1], y[1]);

        if (Vec4.width(bounds) === 0 || Vec4.height(bounds) === 0) {
            this.logger.warnOnce(
                `\`seriesArea.backgroundRegions\` region has no width or height, ignoring. Check that \`start\` and \`end\` differ.`
            );
            return;
        }

        return bounds;
    }

    /**
     * Resolves one axis' range to an ascending pixel pair. An omitted bound extends to that end of
     * the plot; a bound the axis cannot resolve drops the whole region.
     */
    private getAxisExtent(
        scale: Scale<any, number, number | AgTimeInterval | AgTimeIntervalUnit>,
        range: NormalisedSeriesAreaBackgroundRegionRange | undefined,
        optionsKey: string
    ): [number, number] | undefined {
        const { start, end } = range ?? {};

        if ((start != null && !isValidScaleValue(start, scale)) || (end != null && !isValidScaleValue(end, scale))) {
            this.logger.warnOnce(
                `\`seriesArea.backgroundRegions[].${optionsKey}\` does not match the axis type or domain, ignoring.`
            );
            return;
        }

        let p0 = start == null ? scale.range[0] : scale.convert(start, { alignment: ScaleAlignment.Leading });
        let p1 = end == null ? scale.range[1] : scale.convert(end, { alignment: ScaleAlignment.Trailing });

        // Only a bound resolved from a value needs band expansion — an omitted one already sits on
        // the plot edge.
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
        const { opts } = this;

        const horizontal = opts.label?.position === 'left' || opts?.label?.position === 'right';
        const { position = 'top' } = opts?.label ?? {};

        const anchors = horizontal ? horizontalAnchors : verticalAnchors;
        return anchors[position];
    }
}
