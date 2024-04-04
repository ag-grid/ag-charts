export type Task = () => void;

export enum Stage {
    OPTIONS_UPDATE,
    DATA_PROCESS,
    PRE_RENDER,
    RENDER,
    // POST_RENDER,
}

export class StageQueue {
    private isProcessingSync = false;
    private requestAnimationFrameId: number | null = null;
    private readonly stageQueue = new Map<Stage, Set<Task>>(
        (Object.keys(Stage) as unknown as Stage[]).map((stage) => [stage, new Set()])
    );

    /**
     * Adds a task to the queue with a specified priority.
     * @param stage The priority stage of the task.
     * @param task The task to add.
     */
    enqueue(stage: Stage, task: Task): void {
        this.stageQueue.get(stage)?.add(task);

        if (stage === Stage.RENDER) {
            this.processAsyncQueue();
        } else {
            setTimeout(() => this.processSyncQueue());
        }
    }

    /**
     * Processes synchronous tasks, excluding RENDER tasks.
     */
    private processSyncQueue(): void {
        if (this.isProcessingSync) return;

        this.isProcessingSync = true;
        for (const [stage, tasks] of this.stageQueue.entries()) {
            if (stage === Stage.RENDER) continue;
            this.runTasks(tasks);
        }
        this.isProcessingSync = false;
        this.processAsyncQueue();
    }

    /**
     * Processes asynchronous RENDER tasks using requestAnimationFrame.
     */
    private processAsyncQueue(): void {
        if (this.requestAnimationFrameId !== null) return;

        this.requestAnimationFrameId = requestAnimationFrame(() => {
            this.requestAnimationFrameId = null;

            const tasks = this.stageQueue.get(Stage.RENDER)!;
            this.runTasks(tasks, true);
            // Trigger another cycle for newly added tasks.
            if (tasks.size) {
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
