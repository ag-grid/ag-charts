import { _ModuleSupport, _Widget } from 'ag-charts-community';

type Finger = {
    identifier: number;
    normalOriginX: number;
    normalOriginY: number;
};

function clientToNormal(pxOffset: number, pxLength: number, { min, max }: _ModuleSupport.ZoomState): number {
    if (pxLength === 0) return 0;
    // Interpolate pxOffset from [0, pxLength] to [min, max]
    return (pxOffset / pxLength) * (max - min) + min;
}

export class ZoomTwoFingers {
    private readonly fingers: [Finger, Finger] = [
        { identifier: 0, normalOriginX: NaN, normalOriginY: NaN },
        { identifier: 0, normalOriginX: NaN, normalOriginY: NaN },
    ];
    private readonly originZoom: Readonly<_ModuleSupport.DefinedZoomState> = {
        x: { min: 0, max: 1 },
        y: { min: 0, max: 1 },
    };
    private initialDeltaX = 0;
    private initialDeltaY = 0;

    start(
        event: _Widget.TouchWidgetEvent<'touchstart'>,
        target: _Widget.Widget,
        zoom: _ModuleSupport.AxisZoomState
    ): boolean {
        if (event.sourceEvent.targetTouches.length !== 2) return false;
        event.sourceEvent.preventDefault();
        const targetTouches = Array.from(event.sourceEvent.targetTouches);
        const rect = target.getBoundingClientRect();

        this.originZoom.x.min = zoom.x?.min ?? 0;
        this.originZoom.x.max = zoom.x?.max ?? 1;
        this.originZoom.y.min = zoom.y?.min ?? 0;
        this.originZoom.y.max = zoom.y?.max ?? 1;

        const [touch0, touch1] = targetTouches;

        this.fingers[0].identifier = touch0.identifier;
        this.fingers[0].normalOriginX = clientToNormal(touch0.clientX - rect.x, rect.width, this.originZoom.x);
        this.fingers[0].normalOriginY = clientToNormal(touch0.clientY - rect.y, rect.height, this.originZoom.y);

        this.fingers[1].identifier = touch1.identifier;
        this.fingers[1].normalOriginX = clientToNormal(touch1.clientX - rect.x, rect.width, this.originZoom.x);
        this.fingers[1].normalOriginY = clientToNormal(touch1.clientY - rect.y, rect.height, this.originZoom.y);

        this.initialDeltaX = Math.abs(touch1.clientX - touch0.clientX);
        this.initialDeltaY = Math.abs(touch1.clientY - touch0.clientY);

        return true;
    }

    update(event: _Widget.TouchWidgetEvent<'touchmove'>, target: _Widget.Widget): _ModuleSupport.DefinedZoomState {
        event.sourceEvent.preventDefault();
        const targetTouches = Array.from(event.sourceEvent.targetTouches);

        const rect = target.getBoundingClientRect();
        const [touch0, touch1] = targetTouches;
        const deltaX = Math.abs(touch1.clientX - touch0.clientX);
        const deltaY = Math.abs(touch1.clientY - touch0.clientY);

        const scaleX = deltaX / this.initialDeltaX;
        const scaleY = deltaY / this.initialDeltaY;

        const panX0 = touch0.clientX - rect.x;
        const panY0 = touch0.clientY - rect.y;

        const anchorX = this.fingers[0].normalOriginX;
        const anchorY = this.fingers[0].normalOriginY;

        const newMinX = anchorX - (anchorX - this.originZoom.x.min) * scaleX;
        const newMaxX = anchorX + (this.originZoom.x.max - anchorX) * scaleX;

        const newMinY = anchorY - (anchorY - this.originZoom.y.min) * scaleY;
        const newMaxY = anchorY + (this.originZoom.y.max - anchorY) * scaleY;

        const updatedZoom = {
            x: { min: Math.min(newMinX, newMaxX), max: Math.max(newMinX, newMaxX) },
            y: { min: Math.min(newMinY, newMaxY), max: Math.max(newMinY, newMaxY) },
        };

        panX0; panY0;
        return updatedZoom;
    }

    end(event: _Widget.TouchWidgetEvent<'touchend' | 'touchcancel'>): boolean {
        const identifiers = Array.from(event.sourceEvent.targetTouches).map((t) => t.identifier);
        return !identifiers.includes(this.fingers[0].identifier) || !identifiers.includes(this.fingers[1].identifier);
    }
}
