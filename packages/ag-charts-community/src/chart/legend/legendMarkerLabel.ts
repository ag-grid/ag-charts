import { ObserveChanges, ProxyPropertyOnWrite, SceneChangeDetection } from 'ag-charts-core';
import type { FontStyle, FontWeight } from 'ag-charts-types';

import { BBox } from '../../scene/bbox';
import { Group, TranslatableGroup } from '../../scene/group';
import type { ChildNodeCounts, RenderContext } from '../../scene/node';
import { Line } from '../../scene/shape/line';
import { Text } from '../../scene/shape/text';
import type { SwitchWidget } from '../../widget/switchWidget';
import { Marker } from '../marker/marker';

export class LegendMarkerLabel extends TranslatableGroup {
    static readonly className = 'MarkerLabel';

    private readonly symbolsGroup: Group = this.appendChild(
        new Group({
            name: 'legend-markerLabel-symbols',
            renderToOffscreenCanvas: true,
            optimizeForInfrequentRedraws: true,
        })
    );
    private readonly label = this.appendChild(new Text());

    private enabled: boolean = true;

    constructor() {
        super({ name: 'markerLabelGroup' });

        this.line.visible = false;
        this.label.textBaseline = 'middle';
        this.label.y = 1; // For better-looking vertical alignment of labels to markers.
    }

    override destroy() {
        super.destroy();
        this.proxyButton?.destroy();
    }

    proxyButton?: SwitchWidget;

    pageIndex: number = Number.NaN;

    @ProxyPropertyOnWrite('label')
    text?: string;

    @ProxyPropertyOnWrite('label')
    fontStyle?: FontStyle;

    @ProxyPropertyOnWrite('label')
    fontWeight?: FontWeight;

    @ProxyPropertyOnWrite('label')
    fontSize?: number;

    @ProxyPropertyOnWrite('label')
    fontFamily?: string;

    @ProxyPropertyOnWrite('label', 'fill')
    color?: string;

    @ObserveChanges<LegendMarkerLabel>((target) => target.layoutLabel())
    spacing: number = 0;

    @ObserveChanges<LegendMarkerLabel>((target) => target.layoutLabel())
    length: number = 0;

    @SceneChangeDetection()
    isCustomMarker: boolean = false;

    @ObserveChanges<LegendMarkerLabel>((target) => target.layoutLabel())
    isRtl: boolean = false;

    public readonly marker = this.symbolsGroup.appendChild(new Marker({ zIndex: 1 }));
    public readonly line = this.symbolsGroup.appendChild(new Line({ zIndex: 0 }));

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.refreshVisibilities();
    }

    getTextMeasureBBox() {
        this.layout();
        return BBox.merge([this.symbolsGroup.getBBox(), this.label.getTextMeasureBBox()]);
    }

    private refreshVisibilities() {
        const opacity = this.enabled ? 1 : 0.5;
        this.label.opacity = opacity;
        this.opacity = opacity;
    }

    private layout() {
        const { marker, line, length, isCustomMarker } = this;

        let centerTranslateX = 0;
        let centerTranslateY = 0;
        if (marker.visible) {
            const { size } = marker;

            const anchor = Marker.anchor(marker.shape);
            centerTranslateX = (anchor.x - 0.5) * size + length / 2;
            centerTranslateY = (anchor.y - 0.5) * size;

            if (isCustomMarker) {
                marker.x = 0;
                marker.y = 0;
                marker.translationX = centerTranslateX;
                marker.translationY = centerTranslateY;
            } else {
                marker.x = centerTranslateX;
                marker.y = centerTranslateY;
                marker.translationX = 0;
                marker.translationY = 0;
            }
        }

        if (line.visible) {
            line.x1 = 0;
            line.x2 = length;
            line.y1 = 0;
            line.y2 = 0;
        }
    }

    override preRender(renderCtx: RenderContext): ChildNodeCounts {
        const out = super.preRender(renderCtx);
        this.layout();
        return out;
    }

    private layoutLabel() {
        const { length, spacing, isRtl } = this;
        this.label.x = isRtl ? -spacing : length + spacing;
        this.label.textAlign = isRtl ? 'right' : 'left';
    }

    protected override computeBBox(): BBox | undefined {
        this.layout();
        return super.computeBBox();
    }
}
