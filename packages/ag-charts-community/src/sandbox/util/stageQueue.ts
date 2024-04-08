import { isNumber } from '../../util/type-guards';

export type Task = () => void;

export enum Stage {
    OptionsUpdate,
    DataProcess,
    PreRender,
    Render,
    PostRender,
    Notify,
}

function stageMapper(callback: (stage: Stage) => [Stage, Set<Task>]) {
    return (Object.values(Stage).filter(isNumber) as unknown as Stage[]).map(callback);
}

export class StageQueue {
    private isProcessingSync = false;
    private requestAnimationFrameId: number | null = null;
    private readonly stageQueue = new Map<Stage, Set<Task>>(stageMapper((stage) => [stage, new Set()]));

    /**
     * Adds a task to the queue with a specified priority.
     * @param stage The priority stage of the task.
     * @param task The task to add.
     */
    enqueue(stage: Stage, task: Task): void {
        this.stageQueue.get(stage)?.add(task);

        if (stage === Stage.Render) {
            this.processAsyncQueue();
        } else if (!this.isProcessingSync) {
            this.isProcessingSync = true;
            setTimeout(() => this.processSyncQueue());
        }
    }

    /**
     * Processes synchronous tasks, excluding RENDER tasks.
     */
    private processSyncQueue(): void {
        for (const [stage, tasks] of this.stageQueue.entries()) {
            if (stage < Stage.Render) {
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
            for (const [stage, tasks] of this.stageQueue.entries()) {
                if (stage < Stage.Render) continue;
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
        this.stageQueue.forEach((tasks) => tasks.clear());
        if (this.requestAnimationFrameId !== null) {
            cancelAnimationFrame(this.requestAnimationFrameId);
            this.requestAnimationFrameId = null;
        }
    }
}
