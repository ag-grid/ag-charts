import type { DOMManager } from '../../dom/domManager';
import { Debug } from '../../util/debug';
import { VERSION } from '../../version';
import type { MementoOriginator } from './memento';

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

    private readonly debug = Debug.create(true, 'history');

    constructor(domManager: DOMManager) {
        domManager.addEventListener('keydown', this.onKeyDown.bind(this));
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
        const undoAction = this.history[this.historyIndex];
        if (!undoAction) return;

        for (const mementoOriginatorKey of undoAction.mementos.keys()) {
            const previousMemento = this.findPreviousMemento(mementoOriginatorKey);
            if (previousMemento === NOT_FOUND) {
                throw new Error(`Could not find previous memento for [${mementoOriginatorKey}].`);
            }
            this.restoreMemento(mementoOriginatorKey, previousMemento);
        }

        this.historyIndex -= 1;

        this.debugEvent(`History undo: [${undoAction.label}]`);
    }

    redo() {
        const redoAction = this.history[this.historyIndex + 1];
        if (!redoAction) return;

        for (const [mementoOriginatorKey, memento] of redoAction.mementos.entries()) {
            this.restoreMemento(mementoOriginatorKey, memento);
        }

        this.historyIndex += 1;

        this.debugEvent(`History redo: [${redoAction.label}]`);
    }

    private onKeyDown(event: KeyboardEvent) {
        const modifierKey = event.ctrlKey || event.metaKey;

        if (modifierKey && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
            this.redo();
        } else if (modifierKey && event.key === 'z') {
            this.undo();
        }
    }

    private findPreviousMemento(mementoOriginatorKey: string) {
        for (let i = this.historyIndex - 1; i >= 0; i--) {
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
        this.originators.get(mementoOriginatorKey)?.restoreMemento(VERSION, VERSION, memento);
    }

    private debugEvent(...logContent: Array<any>) {
        this.debug(
            ...logContent,
            this.history.map((action, index) => (index === this.historyIndex ? `** ${action.label} **` : action.label))
        );
    }
}
