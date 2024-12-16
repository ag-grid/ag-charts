import type { FontStyle, FontWeight } from 'ag-charts-types';

import type { BBox } from '../../scene/bbox';
import { SceneChangeDetection } from '../../scene/changeDetectable';
import { Group } from '../../scene/group';
import type { ChildNodeCounts } from '../../scene/node';
import { Line } from '../../scene/shape/line';
import { Text } from '../../scene/shape/text';
import { Translatable } from '../../scene/transformable';
import { ObserveChanges, ProxyPropertyOnWrite } from '../../util/proxy';
import type { SwitchWidget } from '../../widget/switchWidget';
import { Marker } from '../marker/marker';

export class LegendMarkerLabel extends Translatable(Group) {
    static readonly className = 'MarkerLabel';

    private readonly symbolsGroup: Group = this.appendChild(
        new Group({
            name: 'legend-markerLabel-symbols',
        })
    );
    private readonly label = this.appendChild(new Text());

    private enabled: boolean = true;

    constructor() {
        super({ name: 'markerLabelGroup' });

        const { label, line, symbolsGroup } = this;

        line.visible = false;

        symbolsGroup.renderToOffscreenCanvas = true;
        symbolsGroup.optimizeForInfrequentRedraws = true;

        label.textBaseline = 'middle';
        label.fontSize = 12;
        label.fontFamily = 'Verdana, sans-serif';
        label.fill = 'black';
        // For better looking vertical alignment of labels to markers.
        label.y = 1;
    }

    override destroy() {
        super.destroy();
        this.proxyButton?.destroy();
    }

    proxyButton?: SwitchWidget;

    pageIndex: number = NaN;

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

    public readonly marker = this.symbolsGroup.appendChild(new Marker({ zIndex: 1 }));
    public readonly line = this.symbolsGroup.appendChild(new Line({ zIndex: 0 }));

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.refreshVisibilities();
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

    override preRender(): ChildNodeCounts {
        const out = super.preRender();
        this.layout();
        return out;
    }

    private layoutLabel() {
        const { length, spacing } = this;

        this.label.x = length + spacing;
    }

    protected override computeBBox(): BBox {
        this.layout();
        return super.computeBBox();
    }
}
