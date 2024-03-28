import type { Scale } from '../../scale/scale';
import type { BBox } from '../../scene/bbox';
import { type Listener, Listeners } from '../../util/listeners';
import { Logger } from '../../util/logger';
import type { ChartAxisDirection } from '../chartAxisDirection';

type LayoutStage = 'start-layout' | 'before-series';
type LayoutComplete = 'layout-complete';

export interface AxisLayout {
    rect: BBox;
    gridPadding: number;
    seriesAreaPadding: number;
    tickSize: number;
    label: {
        fractionDigits: number;
        padding: number;
        format?: string;
    };
    direction: ChartAxisDirection;
    domain: any[];
    scale: Scale<any, any>;
}

export interface LayoutCompleteEvent {
    type: 'layout-complete';
    chart: { width: number; height: number };
    series: { rect: BBox; paddedRect: BBox; visible: boolean; shouldFlipXY?: boolean };
    clipSeries: boolean;
    axes?: Array<AxisLayout & { id: string }>;
}

export interface LayoutContext {
    shrinkRect: BBox;
}

type EventTypes = LayoutStage | LayoutComplete;
type LayoutListener = (event: LayoutCompleteEvent) => void;
type LayoutProcessor = (ctx: LayoutContext) => LayoutContext;

type Handler<T extends EventTypes> = T extends LayoutStage ? LayoutProcessor : LayoutListener;

export class LayoutService extends Listeners<EventTypes, Handler<EventTypes>> {
    private readonly layoutComplete = 'layout-complete';

    public override addListener<T extends EventTypes>(eventType: T, handler: Handler<T>) {
        if (this.isLayoutStage(eventType) || this.isLayoutComplete(eventType)) {
            return super.addListener(eventType, handler);
        }
        throw new Error(`AG Charts - unsupported listener type: ${eventType}`);
    }

    public dispatchPerformLayout<T extends LayoutStage>(stage: T, ctx: LayoutContext) {
        if (this.isLayoutStage(stage)) {
            return this.getListenersByType(stage).reduce((result, listener) => {
                try {
                    return (listener as Listener<Handler<T>>).handler(result);
                } catch (e) {
                    Logger.errorOnce(e);
                    return result;
                }
            }, ctx);
        }
        return ctx;
    }

    public dispatchLayoutComplete(event: LayoutCompleteEvent) {
        this.dispatch(this.layoutComplete, event);
    }

    protected isLayoutStage(eventType: EventTypes): eventType is LayoutStage {
        return eventType !== this.layoutComplete;
    }

    protected isLayoutComplete(eventType: EventTypes): eventType is LayoutComplete {
        return eventType === this.layoutComplete;
    }
}
