import type { FontStyle, FontWeight } from 'ag-charts-types';

import type { ListSwitch } from '../dom/proxyInteractionService';
import { BBox } from '../scene/bbox';
import { RedrawType } from '../scene/changeDetectable';
import { Group } from '../scene/group';
import { Image } from '../scene/image';
import type { Line } from '../scene/shape/line';
import { Text } from '../scene/shape/text';
import type { SpriteDimensions, SpriteRenderer } from '../scene/spriteRenderer';
import { Translatable } from '../scene/transformable';
import { arraysEqual } from '../util/array';
import { iterate } from '../util/iterator';
import { ProxyPropertyOnWrite } from '../util/proxy';
import type { Marker } from './marker/marker';
import type { MarkerConstructor } from './marker/util';

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

        const { markers, label, lines } = this;
        label.textBaseline = 'middle';
        label.fontSize = 12;
        label.fontFamily = 'Verdana, sans-serif';
        label.fill = 'black';
        // For better looking vertical alignment of labels to markers.
        label.y = 1;

        this.updateSymbols(markers, lines);
        this.append([this.symbolsGroup, label]);
    }

    override destroy() {
        super.destroy();
        this.proxyButton?.button.remove();
        this.proxyButton?.listitem.remove();
    }

    proxyButton?: ListSwitch;

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

    private _markers: Marker[] = [];
    get markers(): Marker[] {
        return this._markers;
    }

    private _lines: Line[] = [];
    get lines(): Line[] {
        return this._lines;
    }

    updateSymbols(markers: Marker[], lines: Line[]) {
        if (arraysEqual(this._markers, markers) && arraysEqual(this._lines, lines)) return;

        this.bitmapDirty = true;
        this._markers = markers;
        this._lines = lines;
        this.symbolsGroup.clear();
        this.symbolsGroup.append([this.bitmap, ...markers, ...lines]);
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
        const { lines, markers } = this;
        [lines, markers].forEach((shapes) => shapes.forEach((shape) => (shape.visible = !visible)));
        this.bitmap.visible = visible;
    }

    // The BBox of this.bitmap is `spritePadding` pixels bigger in each direction than BBox of the markers and lines.
    // This padding allows the SpriteRenderer to draw antialiasing pixels that can extend beyond the shapes' bounds.
    update(
        spriteRenderer: SpriteRenderer,
        { spriteAAPadding, spritePixelRatio: scale }: SpriteDimensions,
        dimensionProps: { length: number; spacing: number }[]
    ) {
        const { markers, lines } = this;

        let spriteX = 0;
        let spriteY = 0;
        let shift = 0;
        for (let i = 0; i < Math.max(markers.length, lines.length); i++) {
            const { length, spacing } = dimensionProps[i] ?? 0;
            const marker = markers[i];
            const line = lines[i];

            const size = marker?.size ?? 0;

            let lineTop = Infinity;
            let markerTop = Infinity;
            let markerLeft = Infinity;
            if (marker) {
                const center = (marker.constructor as MarkerConstructor).center;
                const radius = (size + marker.strokeWidth) / 2;

                marker.x = (center.x - 0.5) * size + length / 2 + shift;
                marker.y = (center.y - 0.5) * size;
                markerTop = marker.y - radius;
                markerLeft = marker.x - radius;
            }

            if (line) {
                line.x1 = shift;
                line.x2 = shift + length;
                line.y1 = 0;
                line.y2 = 0;
                line.markDirty(this, RedrawType.MAJOR);
                lineTop = -line.strokeWidth / 2;
            }

            shift += spacing + Math.max(length, size);
            spriteX = Math.min(spriteX, line.x1, line.x2, markerLeft);
            spriteY = Math.min(spriteY, lineTop, markerTop);
        }

        const lastSymbolProps = dimensionProps.at(-1);
        const lastLine = this.lines.at(-1);
        const lastMarker = this.markers.at(-1);
        const lineEnd = lastLine ? lastLine.x2 : -Infinity;
        const markerEnd = (lastMarker?.x ?? 0) + (lastMarker?.size ?? 0) / 2;
        this.label.x = Math.max(lineEnd, markerEnd) + (lastSymbolProps?.spacing ?? 0);

        if (this.bitmapDirty) {
            this.setBitmapVisibility(false);

            const translateX = (spriteAAPadding + spriteX) * scale;
            const translateY = (spriteAAPadding - spriteY) * scale;
            const sprite = spriteRenderer.renderSprite(this.symbolsGroup, {
                scale,
                translateX: Math.floor(translateX),
                translateY: Math.floor(translateY),
            });
            this.bitmap.updateBitmap(sprite, scale, Math.ceil(-translateX), Math.ceil(-translateY));
            this.bitmapDirty = false;

            this.refreshVisibilities();
        }

        if (dimensionProps.length < 2) {
            return;
        }

        // clip the symbols to the size of a single symbol to match the size of other legend items
        const bbox = this.symbolsGroup.getBBox();
        const clippedWidth = Math.max(lastMarker?.size ?? 0, lastSymbolProps?.length ?? 0);
        const clipRect = new BBox(bbox.x + clippedWidth / 2, bbox.y, clippedWidth, bbox.height);

        this.symbolsGroup.setClipRectInGroupCoordinateSpace(clipRect);
    }

    protected override computeBBox(): BBox {
        // The Image node (bitmap) includes some padding to render antialiasing pixel correctly, but we do
        // not want to include this padding in the layout bounds. So just compute the bounds for the Line
        // and Marker nodes directly rather than Group's default behaviour of computing this.bitmap's BBox.
        const { label, lines, markers } = this;
        return this.toParent(Group.computeChildrenBBox(iterate([label], lines, markers), { skipInvisible: false }));
    }
}
