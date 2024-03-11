import type { FontStyle, FontWeight } from '../options/agChartOptions';
import { Group } from '../scene/group';
import type { RenderContext } from '../scene/node';
import { Line } from '../scene/shape/line';
import { Text } from '../scene/shape/text';
import { ProxyPropertyOnWrite } from '../util/proxy';
import type { Marker } from './marker/marker';
import { Square } from './marker/square';
import type { MarkerConstructor } from './marker/util';

export class MarkerLabel extends Group {
    static override readonly className = 'MarkerLabel';

    private label = new Text();
    private line = new Line();

    constructor() {
        super({ name: 'markerLabelGroup' });

        const { marker, label, line } = this;
        label.textBaseline = 'middle';
        label.fontSize = 12;
        label.fontFamily = 'Verdana, sans-serif';
        label.fill = 'black';
        // For better looking vertical alignment of labels to markers.
        label.y = 1;

        this.append([line, marker, label]);
        this.update();
    }

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

    @ProxyPropertyOnWrite('marker', 'fill')
    markerFill?: string;

    @ProxyPropertyOnWrite('marker', 'stroke')
    markerStroke?: string;

    @ProxyPropertyOnWrite('marker', 'strokeWidth')
    markerStrokeWidth?: number;

    @ProxyPropertyOnWrite('marker', 'fillOpacity')
    markerFillOpacity?: number;

    @ProxyPropertyOnWrite('marker', 'strokeOpacity')
    markerStrokeOpacity?: number;

    @ProxyPropertyOnWrite('marker', 'visible')
    markerVisible?: boolean;

    @ProxyPropertyOnWrite('line', 'stroke')
    lineStroke?: string;

    @ProxyPropertyOnWrite('line', 'strokeWidth')
    lineStrokeWidth?: number;

    @ProxyPropertyOnWrite('line', 'strokeOpacity')
    lineStrokeOpacity?: number;

    @ProxyPropertyOnWrite('line', 'lineDash')
    lineLineDash?: number[];

    @ProxyPropertyOnWrite('line', 'visible')
    lineVisible?: boolean;

    private _marker: Marker = new Square();
    set marker(value: Marker) {
        if (this._marker !== value) {
            this.removeChild(this._marker);
            this._marker = value;
            this.appendChild(value);
            this.update();
        }
    }
    get marker(): Marker {
        return this._marker;
    }

    private _markerSize: number = 15;
    set markerSize(value: number) {
        if (this._markerSize !== value) {
            this._markerSize = value;
            this.update();
        }
    }
    get markerSize(): number {
        return this._markerSize;
    }

    private _spacing: number = 8;
    set spacing(value: number) {
        if (this._spacing !== value) {
            this._spacing = value;
            this.update();
        }
    }
    get spacing(): number {
        return this._spacing;
    }

    setSeriesStrokeOffset(xOff: number) {
        const offset = this.marker.size / 2 + xOff;
        this.line.x1 = -offset;
        this.line.x2 = offset;
        this.line.y1 = 0;
        this.line.y2 = 0;
        this.line.markDirtyTransform();
        this.update();
    }

    private update() {
        const { markerSize } = this;

        const center = (this.marker.constructor as MarkerConstructor).center;
        this.marker.size = markerSize;
        this.marker.x = (center.x - 0.5) * markerSize;
        this.marker.y = (center.y - 0.5) * markerSize;

        const lineEnd = this.line.visible ? this.line.x2 : -Infinity;
        const markerEnd = markerSize / 2;
        this.label.x = Math.max(lineEnd, markerEnd) + this.spacing;
    }

    override render(renderCtx: RenderContext): void {
        // Cannot override field Group.opacity with get/set pair, so
        // propagate opacity changes here.
        this.marker.opacity = this.opacity;
        this.label.opacity = this.opacity;
        this.line.opacity = this.opacity;

        super.render(renderCtx);
    }
}
