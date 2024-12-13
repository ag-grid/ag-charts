import type { FontStyle, FontWeight } from 'ag-charts-types';

import { Group } from '../../scene/group';
import type { Line } from '../../scene/shape/line';
import { Text } from '../../scene/shape/text';
import { Translatable } from '../../scene/transformable';
import { ProxyPropertyOnWrite } from '../../util/proxy';
import { isDefined } from '../../util/type-guards';
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

        const { marker, label, line, symbolsGroup } = this;

        symbolsGroup.renderToOffscreenCanvas = true;
        symbolsGroup.optimizeForInfrequentRedraws = true;

        label.textBaseline = 'middle';
        label.fontSize = 12;
        label.fontFamily = 'Verdana, sans-serif';
        label.fill = 'black';
        // For better looking vertical alignment of labels to markers.
        label.y = 1;

        this.updateSymbols(marker, line);
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

    private _marker: Marker | undefined = undefined;
    get marker(): Marker | undefined {
        return this._marker;
    }

    private _line: Line | undefined = undefined;
    get line(): Line | undefined {
        return this._line;
    }

    updateSymbols(marker: Marker | undefined, line: Line | undefined) {
        if (this._marker === marker && this._line === line) return;

        this._marker = marker;
        this._line = line;
        this.symbolsGroup.clear();
        this.symbolsGroup.append([line, marker].filter(isDefined));
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.refreshVisibilities();
    }

    private refreshVisibilities() {
        const opacity = this.enabled ? 1 : 0.5;
        this.label.opacity = opacity;
        this.opacity = opacity;
    }

    update(dimensionProps: { length: number; spacing: number; isCustomMarker: boolean }) {
        const { marker, line } = this;
        const { length, spacing, isCustomMarker } = dimensionProps;

        let centerTranslateX = 0;
        let centerTranslateY = 0;
        if (marker) {
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

        if (line) {
            line.x1 = 0;
            line.x2 = length;
            line.y1 = 0;
            line.y2 = 0;
            line.markDirty();
        }

        this.label.x = marker || line ? length + spacing : 0;
    }
}
