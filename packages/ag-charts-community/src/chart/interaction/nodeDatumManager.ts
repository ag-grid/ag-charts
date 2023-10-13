import type { SeriesNodeDatum } from '../series/seriesTypes';
import { BaseManager } from './baseManager';

type NodeDatumEventType = 'node-click' | 'node-double-click';
type NodeDatumEvents = NodeDatumClick | NodeDatumDoubleClick;

interface NodeDatumEvent<NodeDatumEventType> {
    type: NodeDatumEventType;
    callerId: string;
    datum: SeriesNodeDatum;
}

interface NodeDatumClick extends NodeDatumEvent<'node-click'> {}
interface NodeDatumDoubleClick extends NodeDatumEvent<'node-double-click'> {}

export class NodeDatumManager extends BaseManager<NodeDatumEventType, NodeDatumEvents> {
    private readonly enteredStates: Map<string, SeriesNodeDatum> = new Map();

    pointerEnterNode(callerId: string, datum: SeriesNodeDatum) {
        this.enteredStates.set(callerId, datum);
    }

    pointerLeaveNode(callerId: string) {
        this.enteredStates.delete(callerId);
    }

    isPointerOverNode() {
        return this.enteredStates.size > 0;
    }

    clickNode(callerId: string, datum: SeriesNodeDatum) {
        const event: NodeDatumClick = { type: 'node-click', callerId, datum };
        this.listeners.dispatch('node-click', event);
    }

    doubleClickNode(callerId: string, datum: SeriesNodeDatum) {
        const event: NodeDatumDoubleClick = { type: 'node-double-click', callerId, datum };
        this.listeners.dispatch('node-double-click', event);
    }
}
