import { _ModuleSupport } from 'ag-charts-community';
import {
    type Bounds4,
    type NormalisedSeriesAreaBackgroundRegion,
    type Scale,
    ScaleAlignment,
    Vec4,
    createId,
    toRadians,
} from 'ag-charts-core';
import type { AgSeriesAreaBackgroundRegionLabelPosition, AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

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

    setOptions(opts: NormalisedSeriesAreaBackgroundRegion) {
        this.opts = opts;
    }

    update(visible: boolean) {
        const { xScale, yScale } = this;
        if (!xScale || !yScale || !visible) {
            this.regionGroup.visible = false;
            this.labelGroup.visible = false;
            return;
        }

        this.regionGroup.visible = true;
        this.labelGroup.visible = true;

        this.updateNodes();
    }

    private updateNodes() {
        const bounds = this.getBounds();

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

    private getBounds() {
        const { opts, xScale, yScale } = this;
        if (!xScale || !yScale) return Vec4.origin();

        let x1 = xScale.convert(opts.xRange?.start, { alignment: ScaleAlignment.Leading });
        let y1 = yScale.convert(opts.yRange?.start, { alignment: ScaleAlignment.Leading });
        let x2 = xScale.convert(opts.xRange?.end, { alignment: ScaleAlignment.Trailing });
        let y2 = yScale.convert(opts.yRange?.end, { alignment: ScaleAlignment.Trailing });

        if (Number.isNaN(x1)) x1 = xScale.range[0];
        if (Number.isNaN(y1)) y1 = yScale.range[0];
        if (Number.isNaN(x2)) x2 = xScale.range[1];
        if (Number.isNaN(y2)) y2 = yScale.range[1];

        return Vec4.normalise(Vec4.from(x1, y1, x2, y2));
    }

    private getAnchor(): Anchor {
        const { opts } = this;

        const horizontal = opts.label?.position === 'left' || opts?.label?.position === 'right';
        const { position = 'top' } = opts?.label ?? {};

        const anchors = horizontal ? horizontalAnchors : verticalAnchors;
        return anchors[position];
    }
}
