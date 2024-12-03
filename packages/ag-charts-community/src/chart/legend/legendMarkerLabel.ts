import type { FontStyle, FontWeight } from 'ag-charts-types';

import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import { Image } from '../../scene/image';
import type { Line } from '../../scene/shape/line';
import { Text } from '../../scene/shape/text';
import type { SpriteDimensions, SpriteRenderer } from '../../scene/spriteRenderer';
import { Translatable } from '../../scene/transformable';
import { ProxyPropertyOnWrite } from '../../util/proxy';
import { isDefined } from '../../util/type-guards';
import type { SwitchWidget } from '../../widget/switchWidget';
import type { Marker } from '../marker/marker';
import type { MarkerConstructor } from '../marker/util';

export class LegendMarkerLabel extends Translatable(Group) {
    static readonly className = 'MarkerLabel';

    private readonly label = new Text();

    private readonly symbolsGroup: Group = new Group({
        name: 'legend-markerLabel-symbols',
    });

    private readonly bitmap = new Image();
    private bitmapDirty = true;

    private enabled: boolean = true;

    constructor() {
        super({ name: 'markerLabelGroup' });

        const { marker, label, line } = this;
        label.textBaseline = 'middle';
        label.fontSize = 12;
        label.fontFamily = 'Verdana, sans-serif';
        label.fill = 'black';
        // For better looking vertical alignment of labels to markers.
        label.y = 1;

        this.updateSymbols(marker, line);
        this.append([this.symbolsGroup, label]);
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

        this.bitmapDirty = true;
        this._marker = marker;
        this._line = line;
        this.symbolsGroup.clear();
        this.symbolsGroup.append([this.bitmap, line, marker].filter(isDefined));
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.refreshVisibilities();
    }

    private refreshVisibilities() {
        const opacity = this.enabled ? 1 : 0.5;
        this.label.opacity = opacity;
        this.opacity = opacity;
        this.bitmap.opacity = opacity;
        this.setBitmapVisibility(!this.enabled);
    }

    private setBitmapVisibility(visible: boolean) {
        const { line, marker } = this;
        if (marker != null) {
            marker.visible = !visible;
        }
        if (line != null) {
            line.visible = !visible;
        }
        this.bitmap.visible = visible;
    }

    // The BBox of this.bitmap is `spritePadding` pixels bigger in each direction than BBox of the markers and lines.
    // This padding allows the SpriteRenderer to draw antialiasing pixels that can extend beyond the shapes' bounds.
    update(
        spriteRenderer: SpriteRenderer,
        { spriteAAPadding, spritePixelRatio: scale }: SpriteDimensions,
        dimensionProps: { length: number; spacing: number; isCustomMarker: boolean }
    ) {
        const { marker, line } = this;
        const { length, spacing, isCustomMarker } = dimensionProps;

        let lineTop = Infinity;
        let lineX1 = Infinity;
        let lineX2 = Infinity;
        let markerTop = Infinity;
        let markerLeft = Infinity;
        let centerTranslateX = 0;
        let centerTranslateY = 0;
        if (marker) {
            const { size } = marker;
            const center = (marker.constructor as MarkerConstructor).center;
            const radius = (size + marker.strokeWidth) / 2;
            centerTranslateX = (center.x - 0.5) * size;
            centerTranslateY = (center.y - 0.5) * size;

            if (isCustomMarker) {
                marker.x = 0;
                marker.y = 0;
                marker.translationX = centerTranslateX * size + length / 2;
                marker.translationY = centerTranslateY * size;
                markerTop = marker.translationY - radius;
                markerLeft = marker.translationX - radius;
            } else {
                marker.x = centerTranslateX + length / 2;
                marker.y = centerTranslateY;
                markerTop = marker.y - radius;
                markerLeft = marker.x - radius;
            }
        }

        if (line) {
            line.x1 = 0;
            line.x2 = length;
            line.y1 = 0;
            line.y2 = 0;
            line.markDirty();
            lineTop = -line.strokeWidth / 2;
            lineX1 = line.x1;
            lineX2 = line.x2;
        }

        const spriteX = Math.min(lineX1, lineX2, markerLeft);
        const spriteY = Math.min(lineTop, markerTop);

        const lineEnd = line?.x2 ?? -Infinity;
        const markerEnd = (marker?.x ?? 0) + (marker?.size ?? 0) / 2;
        this.label.x = Math.max(lineEnd, markerEnd) + spacing;

        if (this.bitmapDirty) {
            this.setBitmapVisibility(false);

            const translateX = centerTranslateX + (spriteAAPadding + spriteX) * scale;
            const translateY = centerTranslateY + (spriteAAPadding - spriteY) * scale;
            const sprite = spriteRenderer.renderSprite(this.symbolsGroup, {
                scale,
                translateX: Math.floor(translateX),
                translateY: Math.floor(translateY),
            });
            this.bitmap.updateBitmap(sprite, scale, Math.ceil(-translateX), Math.ceil(-translateY));
            this.bitmapDirty = false;

            this.refreshVisibilities();
        }
    }

    protected override computeBBox(): BBox {
        // The Image node (bitmap) includes some padding to render antialiasing pixel correctly, but we do
        // not want to include this padding in the layout bounds. So just compute the bounds for the Line
        // and Marker nodes directly rather than Group's default behaviour of computing this.bitmap's BBox.
        const { label, line, marker } = this;
        return this.toParent(Group.computeChildrenBBox([label, line, marker].filter(isDefined), false));
    }
}
