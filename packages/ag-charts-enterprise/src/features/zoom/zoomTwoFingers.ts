import { _ModuleSupport, _Widget } from 'ag-charts-community';

type FingerOrigin = {
    identifier: number;
    clientX: number;
    clientY: number;
};

export class ZoomTwoFingers {
    private readonly origins: [FingerOrigin, FingerOrigin] = [
        { identifier: 0, clientX: NaN, clientY: NaN },
        { identifier: 0, clientX: NaN, clientY: NaN },
    ];
    private readonly originZoom: Readonly<_ModuleSupport.DefinedZoomState> = {
        x: { min: 0, max: 1 },
        y: { min: 0, max: 1 },
    };

    start(event: _Widget.TouchWidgetEvent<'touchstart'>, zoom: _ModuleSupport.AxisZoomState): boolean {
        if (event.sourceEvent.targetTouches.length !== 2) return false;
        event.sourceEvent.preventDefault();
        const targetTouches = Array.from(event.sourceEvent.targetTouches);

        this.originZoom.x.min = zoom.x?.min ?? 0;
        this.originZoom.x.max = zoom.x?.max ?? 1;
        this.originZoom.y.min = zoom.y?.min ?? 0;
        this.originZoom.y.max = zoom.y?.max ?? 1;

        for (const i of [0, 1]) {
            this.origins[i].identifier = targetTouches[i].identifier;
            this.origins[i].clientX = targetTouches[i].clientX;
            this.origins[i].clientY = targetTouches[i].clientY;
        }
        return true;
    }

    update(event: _Widget.TouchWidgetEvent<'touchmove'>, target: _Widget.Widget): _ModuleSupport.DefinedZoomState {
        event.sourceEvent.preventDefault();

        const { origins, originZoom } = this;

        const { width, height } = target.getBoundingClientRect();
        const targetTouches = Array.from(event.sourceEvent.targetTouches);
        const touches = [0, 1].map((i) => targetTouches.find((t) => t.identifier === origins[i].identifier)!);

        const dx0 = touches[0].clientX - origins[0].clientX;
        const dy0 = touches[0].clientY - origins[0].clientY;
        const dx1 = touches[1].clientX - origins[1].clientX;
        const dy1 = touches[1].clientY - origins[1].clientY;

        const avgDx = (dx0 + dx1) / 2;
        const avgDy = (dy0 + dy1) / 2;

        const scaleX = width / (width - (touches[1].clientX - touches[0].clientX));
        const scaleY = height / (height - (touches[1].clientY - touches[0].clientY));

        const minX = originZoom.x.min - (avgDx / width) * (originZoom.x.max - originZoom.x.min);
        const maxX = minX + (originZoom.x.max - originZoom.x.min) * scaleX;
        const minY = originZoom.y.min - (avgDy / height) * (originZoom.y.max - originZoom.y.min);
        const maxY = minY + (originZoom.y.max - originZoom.y.min) * scaleY;

        return { x: { min: minX, max: maxX }, y: { min: minY, max: maxY } };
    }

    end(event: _Widget.TouchWidgetEvent<'touchend' | 'touchcancel'>): boolean {
        event.sourceEvent.preventDefault();
        const identifiers = Array.from(event.sourceEvent.targetTouches).map((t) => t.identifier);
        return !identifiers.includes(this.origins[0].identifier) || !identifiers.includes(this.origins[1].identifier);
    }
}
