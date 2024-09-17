import { isNumber } from '../../util/type-guards';

type Task = () => void;

export enum PipelinePhase {
    OptionsUpdate,
    DataProcess,
    PreRender,
    Render,
    PostRender,
    Notify,
}

function phaseMapper(callback: (phase: PipelinePhase) => [PipelinePhase, Set<Task>]) {
    const isPipelinePhase = (value: unknown): value is PipelinePhase => isNumber(value);
    return Object.values(PipelinePhase).filter(isPipelinePhase).map(callback);
}

export class PipelineQueue {
    private readonly queue = new Map(phaseMapper((phase) => [phase, new Set()]));

    private isProcessingSync = false;
    private requestAnimationFrameId: number | null = null;
    private timerId?: number | NodeJS.Timeout;

    /**
     * Adds a task to the queue with a specified priority phase.
     * @param phase The priority phase of the task.
     * @param task The task to add.
     */
    enqueue(phase: PipelinePhase, task: Task): void {
        this.queue.get(phase)?.add(task);

        if (phase >= PipelinePhase.Render) {
            this.processAsyncQueue();
        } else if (!this.isProcessingSync) {
            this.isProcessingSync = true;
            this.timerId = setTimeout(() => this.processSyncQueue());
        }
    }

    /**
     * Clears all tasks and cancels any scheduled async tasks.
     */
    clear(): void {
        this.queue.forEach((tasks) => tasks.clear());
        if (this.requestAnimationFrameId !== null) {
            cancelAnimationFrame(this.requestAnimationFrameId);
            this.requestAnimationFrameId = null;
        }
        if (this.isProcessingSync) {
            clearTimeout(this.timerId);
            this.isProcessingSync = false;
            this.timerId = undefined;
        }
    }

    /**
     * Processes tasks before the Render phase synchronously.
     */
    private processSyncQueue(): void {
        for (const [phase, tasks] of this.queue.entries()) {
            if (phase < PipelinePhase.Render) {
                this.runTasks(tasks);
                continue;
            }
            if (tasks.size) {
                this.processAsyncQueue();
                break;
            }
        }
        this.isProcessingSync = false;
    }

    /**
     * Processes tasks in the Render phase or later asynchronously via requestAnimationFrame.
     */
    private processAsyncQueue(): void {
        if (this.requestAnimationFrameId !== null) return;

        this.requestAnimationFrameId = requestAnimationFrame(() => {
            this.requestAnimationFrameId = null;

            if (this.isProcessingSync) {
                this.processAsyncQueue();
                return;
            }

            const asyncTasks: Set<Task>[] = [];
            for (const [phase, tasks] of this.queue.entries()) {
                if (phase < PipelinePhase.Render) continue;
                this.runTasks(tasks, true);
                asyncTasks.push(tasks);
            }
            if (asyncTasks.some((tasks) => tasks.size)) {
                this.processAsyncQueue();
            }
        });
    }

    /**
     * Executes tasks, optionally working on a snapshot for async processing.
     */
    private runTasks(tasks: Set<Task>, takeSnapshot?: boolean) {
        for (const task of takeSnapshot ? [...tasks] : tasks) {
            tasks.delete(task);
            task();
        }
    }
}
