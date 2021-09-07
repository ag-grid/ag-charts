import { RangeSelector } from "../shapes/rangeSelector";
import { CartesianChart } from "../cartesianChart";
import { ChartAxisDirection } from "../chartAxis";
import { BBox } from "../../scene/bbox";
import { NavigatorMask } from "./navigatorMask";
import { NavigatorHandle } from "./navigatorHandle";

interface Offset {
    offsetX: number;
    offsetY: number;
}

export class Navigator {
    private readonly rs = new RangeSelector();
    private readonly chart: CartesianChart;

    readonly mask = new NavigatorMask(this.rs.mask);
    readonly minHandle = new NavigatorHandle(this.rs.minHandle);
    readonly maxHandle = new NavigatorHandle(this.rs.maxHandle);

    private minHandleDragging = false;
    private maxHandleDragging = false;
    private panHandleOffset = NaN;

    set enabled(value: boolean) {
        this.rs.visible = value;
        this.chart.layoutPending = true;
    }
    get enabled(): boolean {
        return this.rs.visible;
    }

    set x(value: number) {
        this.rs.x = value;
    }
    get x(): number {
        return this.rs.x;
    }

    set y(value: number) {
        this.rs.y = value;
    }
    get y(): number {
        return this.rs.y;
    }

    set width(value: number) {
        this.rs.width = value;
    }
    get width(): number {
        return this.rs.width;
    }

    set height(value: number) {
        this.rs.height = value;
        this.chart.layoutPending = true;
    }
    get height(): number {
        return this.rs.height;
    }

    private _margin = 10;
    set margin(value: number) {
        this._margin = value;
        this.chart.layoutPending = true;
    }
    get margin(): number {
        return this._margin;
    }

    set min(value: number) {
        this.rs.min = value;
    }
    get min(): number {
        return this.rs.min;
    }

    set max(value: number) {
        this.rs.max = value;
    }
    get max(): number {
        return this.rs.max;
    }

    constructor(chart: CartesianChart) {
        this.chart = chart;

        chart.scene.root!!.append(this.rs);
        this.rs.onRangeChange = (min, max) => this.updateAxes(min, max);
    }

    updateAxes(min: number, max: number) {
        const { chart } = this;
        let clipSeries = false;
        chart.axes.forEach(axis => {
            if (axis.direction === ChartAxisDirection.X) {
                if (!clipSeries && (min > 0 || max < 1)) {
                    clipSeries = true;
                }
                axis.visibleRange = [min, max];
                axis.update();
            }
        });
        chart.seriesRoot.enabled = clipSeries;
        chart.series.forEach(s => s.nodeDataPending = true);
    }

    onDragStart(offset: Offset) {
        if (!this.enabled) {
            return;
        }

        const { offsetX, offsetY } = offset;
        const { rs } = this;
        const { minHandle, maxHandle, x, width, min } = rs;
        const visibleRange = rs.computeVisibleRangeBBox();

        if (!(this.minHandleDragging || this.maxHandleDragging)) {
            if (minHandle.containsPoint(offsetX, offsetY)) {
                this.minHandleDragging = true;
            } else if (maxHandle.containsPoint(offsetX, offsetY)) {
                this.maxHandleDragging = true;
            } else if (visibleRange.containsPoint(offsetX, offsetY)) {
                this.panHandleOffset = (offsetX - x) / width - min;
            }
        }
    }

    onDrag(offset: Offset) {
        if (!this.enabled) {
            return;
        }

        const { rs, panHandleOffset } = this;
        const { x, y, width, height, minHandle, maxHandle } = rs;
        const { style } = this.chart.element;
        const { offsetX, offsetY } = offset;
        const minX = x + width * rs.min;
        const maxX = x + width * rs.max;
        const visibleRange = new BBox(minX, y, maxX - minX, height);

        function getRatio() {
            return Math.min(Math.max((offsetX - x) / width, 0), 1);
        }

        if (minHandle.containsPoint(offsetX, offsetY)) {
            style.cursor = 'ew-resize';
        } else if (maxHandle.containsPoint(offsetX, offsetY)) {
            style.cursor = 'ew-resize';
        } else if (visibleRange.containsPoint(offsetX, offsetY)) {
            style.cursor = 'grab';
        } else {
            style.cursor = 'default';
        }

        if (this.minHandleDragging) {
            rs.min = getRatio();
        } else if (this.maxHandleDragging) {
            rs.max = getRatio();
        } else if (!isNaN(panHandleOffset)) {
            const span = rs.max - rs.min;
            const min = Math.min(getRatio() - panHandleOffset, 1 - span);
            if (min <= rs.min) { // pan left
                rs.min = min;
                rs.max = rs.min + span;
            } else { // pan right
                rs.max = min + span;
                rs.min = rs.max - span;
            }
        }
    }

    onDragStop() {
        this.stopHandleDragging();
    }

    stopHandleDragging() {
        this.minHandleDragging = this.maxHandleDragging = false;
        this.panHandleOffset = NaN;
    }
}