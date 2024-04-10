import { isNumber } from '../../util/type-guards';

export type Task = () => void;

export enum PipelinePhase {
    OptionsUpdate,
    DataProcess,
    PreRender,
    Render,
    PostRender,
    Notify,
}

function phaseMapper(callback: (phase: PipelinePhase) => [PipelinePhase, Set<Task>]) {
    return (Object.values(PipelinePhase).filter(isNumber) as unknown as PipelinePhase[]).map(callback);
}

export class PipelineQueue {
    private readonly queue = new Map<PipelinePhase, Set<Task>>(phaseMapper((phase) => [phase, new Set()]));

    private isProcessingSync = false;
    private requestAnimationFrameId: number | null = null;
    private timerId?: number;

    /**
     * Adds a task to the queue with a specified priority phase.
     * @param phase The priority phase of the task.
     * @param task The task to add.
     */
    enqueue(phase: PipelinePhase, task: Task): void {
        this.queue.get(phase)?.add(task);

        if (phase === PipelinePhase.Render) {
            this.processAsyncQueue();
        } else if (!this.isProcessingSync) {
            this.isProcessingSync = true;
            this.timerId = setTimeout(() => this.processSyncQueue()) as any;
        }
    }

    /**
     * Processes synchronous tasks, excluding RENDER tasks.
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
     * Processes asynchronous RENDER tasks using requestAnimationFrame.
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

    private runTasks(tasks: Set<Task>, takeSnapshot?: boolean) {
        for (const task of takeSnapshot ? [...tasks] : tasks) {
            tasks.delete(task);
            task();
        }
    }

    /**
     * Clears all tasks from the queue and cancels any scheduled asynchronous tasks.
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
}
