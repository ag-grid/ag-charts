import type { FontStyle, FontWeight } from '../options/agChartOptions';
import { BBox } from '../scene/bbox';
import { Group } from '../scene/group';
import type { RenderContext } from '../scene/node';
import type { Line } from '../scene/shape/line';
import { Text } from '../scene/shape/text';
import { arraysEqual } from '../util/array';
import { ProxyPropertyOnWrite } from '../util/proxy';
import type { Marker } from './marker/marker';
import type { MarkerConstructor } from './marker/util';

export class MarkerLabel extends Group {
    static override readonly className = 'MarkerLabel';

    private readonly label = new Text();

    private readonly symbolsGroup: Group = new Group({
        name: 'legend-markerLabel-symbols',
    });

    constructor() {
        super({ name: 'markerLabelGroup' });

        const { markers, label, lines } = this;
        label.textBaseline = 'middle';
        label.fontSize = 12;
        label.fontFamily = 'Verdana, sans-serif';
        label.fill = 'black';
        // For better looking vertical alignment of labels to markers.
        label.y = 1;

        this.symbolsGroup.append([...lines, ...markers]);
        this.append([this.symbolsGroup, label]);
    }

    proxyButton?: HTMLButtonElement;

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
    set markers(value: Marker[]) {
        if (!arraysEqual(this._markers, value)) {
            this._markers.forEach((marker) => {
                this.removeChild(marker);
            });
            this._markers = value;
            this._markers.forEach((marker) => {
                this.symbolsGroup.appendChild(marker);
            });
        }
    }
    get markers(): Marker[] {
        return this._markers;
    }

    private _lines: Line[] = [];
    set lines(value: Line[]) {
        if (!arraysEqual(this._lines, value)) {
            this._lines.forEach((line) => {
                this.removeChild(line);
            });
            this._lines = value;
            this._lines.forEach((line) => {
                this.symbolsGroup.appendChild(line);
            });
        }
    }
    get lines(): Line[] {
        return this._lines;
    }
    update(dimensionProps: { length: number; spacing: number }[]) {
        const { markers, lines } = this;

        let shift = 0;
        for (let i = 0; i < Math.max(markers.length, lines.length); i++) {
            const { length, spacing } = dimensionProps[i] ?? 0;
            const marker = markers[i];
            const line = lines[i];

            const size = marker?.size ?? 0;

            if (marker) {
                const center = (marker.constructor as MarkerConstructor).center;

                marker.x = (center.x - 0.5) * size + length / 2 + shift;
                marker.y = (center.y - 0.5) * size;
            }

            if (line) {
                line.x1 = shift;
                line.x2 = shift + length;
                line.y1 = 0;
                line.y2 = 0;
                line.markDirtyTransform();
            }

            shift += spacing + Math.max(length, size);
        }

        const lastSymbolProps = dimensionProps.at(-1);
        const lastLine = this.lines.at(-1);
        const lastMarker = this.markers.at(-1);
        const lineEnd = lastLine?.visible ? lastLine.x2 : -Infinity;
        const markerEnd = (lastMarker?.x ?? 0) + (lastMarker?.size ?? 0) / 2;
        this.label.x = Math.max(lineEnd, markerEnd) + (lastSymbolProps?.spacing ?? 0);

        if (dimensionProps.length < 2) {
            return;
        }

        // clip the symbols to the size of a single symbol to match the size of other legend items
        const bbox = this.symbolsGroup.computeBBox();
        const clippedWidth = Math.max(lastMarker?.size ?? 0, lastSymbolProps?.length ?? 0);
        const clipRect = new BBox(bbox.x + clippedWidth / 2, bbox.y, clippedWidth, bbox.height);

        this.symbolsGroup.setClipRectInGroupCoordinateSpace(clipRect);
    }

    override render(renderCtx: RenderContext): void {
        // Cannot override field Group.opacity with get/set pair, so
        // propagate opacity changes here.
        this.markers.forEach((marker) => {
            marker.opacity = this.opacity;
        });
        this.lines.forEach((line) => {
            line.opacity = this.opacity;
        });
        this.label.opacity = this.opacity;

        super.render(renderCtx);
    }
}
