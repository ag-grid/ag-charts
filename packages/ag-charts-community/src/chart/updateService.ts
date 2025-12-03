import { EventEmitter, type EventListener } from 'ag-charts-core';

import { ChartUpdateType } from 'ag-charts-core';
import type { ISeries } from './series/seriesTypes';

export type UpdateCallback = (type: ChartUpdateType, opts?: UpdateOpts) => void;

export interface UpdateCompleteEvent {
    readonly type: 'update-complete';
    readonly apiUpdate: boolean;
    readonly wasShortcut: boolean;
}

export interface PreDomUpdateEvent {
    readonly type: 'pre-dom-update';
}

export interface PreSceneRenderEvent {
    readonly type: 'pre-scene-render';
}

export interface ProcessDataEvent {
    readonly type: 'process-data';
    readonly series: { shouldFlipXY?: boolean };
}

export interface UpdateOpts {
    forceNodeDataRefresh?: boolean;
    skipAnimations?: boolean;
    newAnimationBatch?: boolean;
    seriesToUpdate?: Iterable<ISeries<any, any, any>>;
    backOffMs?: number;
    apiUpdate?: boolean;
    clearCallbackCache?: boolean;
}

interface EventMap {
    'update-complete': UpdateCompleteEvent;
    'pre-dom-update': PreDomUpdateEvent;
    'pre-scene-render': PreSceneRenderEvent;
    'process-data': ProcessDataEvent;
}

export class UpdateService {
    private readonly events = new EventEmitter<EventMap>();

    constructor(private readonly updateCallback: UpdateCallback) {}

    public addListener<K extends keyof EventMap>(eventName: K, listener: EventListener<EventMap[K]>) {
        return this.events.on(eventName, listener);
    }

    public destroy() {
        this.events.clear();
    }

    public update(type = ChartUpdateType.FULL, options?: UpdateOpts) {
        this.updateCallback(type, options);
    }

    public dispatchUpdateComplete(apiUpdate: boolean, wasShortcut: boolean) {
        this.events.emit('update-complete', { type: 'update-complete', apiUpdate, wasShortcut });
    }

    public dispatchPreDomUpdate() {
        this.events.emit('pre-dom-update', { type: 'pre-dom-update' });
    }

    public dispatchPreSceneRender() {
        this.events.emit('pre-scene-render', { type: 'pre-scene-render' });
    }

    public dispatchProcessData({ series }: { series: { shouldFlipXY?: boolean } }) {
        this.events.emit('process-data', { type: 'process-data', series });
    }
}
