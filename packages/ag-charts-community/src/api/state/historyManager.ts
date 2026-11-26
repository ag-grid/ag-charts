import type { DynamicContext, MementoOriginator } from 'ag-charts-core';
import { CleanupRegistry, Debug } from 'ag-charts-core';

import type { ChartRegistry } from '../../module/moduleContext';
import { VERSION } from '../../version';

interface HistoricalAction {
    label: string;
    mementos: Map<string, any>;
}

const NOT_FOUND = Symbol('previous-memento-not-found');

export class HistoryManager {
    private history: Array<HistoricalAction> = [];
    private historyIndex: number = -1;
    private readonly originators: Map<string, MementoOriginator> = new Map();
    private readonly clearState: Map<string, any> = new Map();
    private readonly maxHistoryLength = 100;

    private readonly beforeStepListeners = new Set<() => void>();

    private readonly debug = Debug.create(true, 'history');
    private readonly cleanup = new CleanupRegistry();

    constructor(ctx: DynamicContext<ChartRegistry>) {
        this.cleanup.register(
            ctx.eventsHub.on('series:undo', this.undo.bind(this)),
            ctx.eventsHub.on('series:redo', this.redo.bind(this))
        );
    }

    destroy() {
        this.cleanup.flush();
    }

    /** Registers a callback run before an undo or redo, so that a change not yet recorded can be recorded first. */
    onBeforeStep(listener: () => void) {
        this.beforeStepListeners.add(listener);
        return () => this.beforeStepListeners.delete(listener);
    }

    addMementoOriginator(originator: MementoOriginator) {
        this.originators.set(originator.mementoOriginatorKey, originator);
        this.clearState.set(originator.mementoOriginatorKey, originator.createMemento());

        this.debugEvent('History add originator:', originator.mementoOriginatorKey);
    }

    clear() {
        this.debug(`History clear:`, Object.keys(this.originators));

        this.history = [];
        this.historyIndex = -1;

        for (const [mementoOriginatorKey, originator] of this.originators.entries()) {
            this.clearState.set(mementoOriginatorKey, originator.createMemento());
        }
    }

    record(label: string, ...originators: Array<MementoOriginator>) {
        // Clear the history beyond the current index so we can not redo into an out of date state.
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        if (this.history.length > this.maxHistoryLength) {
            this.history = this.history.slice(-this.maxHistoryLength);
        }

        const mementos = new Map<string, any>();
        for (const originator of originators) {
            if (!this.originators.has(originator.mementoOriginatorKey)) {
                throw new Error(
                    `Originator [${originator.mementoOriginatorKey}] has not been added to the HistoryManager.`
                );
            }
            mementos.set(originator.mementoOriginatorKey, originator.createMemento());
        }

        this.history.push({ label, mementos });
        this.historyIndex = this.history.length - 1;

        this.debugEvent(`History record: [${label}]`);
    }

    undo() {
        this.beforeStep();
        const undoAction = this.history[this.historyIndex];
        if (undoAction == null) return;

        for (const mementoOriginatorKey of undoAction.mementos.keys()) {
            const previousMemento = this.findMemento(mementoOriginatorKey, this.historyIndex - 1);
            if (previousMemento === NOT_FOUND) {
                throw new Error(`Could not find previous memento for [${mementoOriginatorKey}].`);
            }
            this.restoreMemento(mementoOriginatorKey, previousMemento);
        }

        this.historyIndex -= 1;

        this.debugEvent(`History undo: [${undoAction.label}]`);
    }

    redo() {
        this.beforeStep();
        const redoAction = this.history[this.historyIndex + 1];
        if (redoAction == null) return;

        for (const [mementoOriginatorKey, memento] of redoAction.mementos.entries()) {
            this.restoreMemento(mementoOriginatorKey, memento);
        }

        this.historyIndex += 1;

        this.debugEvent(`History redo: [${redoAction.label}]`);
    }

    /** Restores the originators to the current history entry, without changing the history. */
    revert(...originators: Array<MementoOriginator>) {
        for (const { mementoOriginatorKey } of originators) {
            const memento = this.findMemento(mementoOriginatorKey, this.historyIndex);
            if (memento === NOT_FOUND) {
                throw new Error(`Could not find memento for [${mementoOriginatorKey}].`);
            }
            this.restoreMemento(mementoOriginatorKey, memento);
        }

        this.debugEvent('History revert:', originators.map((originator) => originator.mementoOriginatorKey).join());
    }

    private beforeStep() {
        for (const listener of this.beforeStepListeners) listener();
    }

    private findMemento(mementoOriginatorKey: string, fromIndex: number) {
        for (let i = fromIndex; i >= 0; i--) {
            if (this.history[i].mementos.has(mementoOriginatorKey)) {
                return this.history[i].mementos.get(mementoOriginatorKey);
            }
        }

        if (this.clearState.has(mementoOriginatorKey)) {
            return this.clearState.get(mementoOriginatorKey);
        }

        return NOT_FOUND;
    }

    private restoreMemento(mementoOriginatorKey: string, memento: any) {
        this.originators.get(mementoOriginatorKey)?.restoreMemento(VERSION, VERSION, memento, 'user-interaction');
    }

    private debugEvent(...logContent: Array<any>) {
        this.debug(
            ...logContent,
            this.history.map((action, index) => (index === this.historyIndex ? `** ${action.label} **` : action.label))
        );
    }
}
