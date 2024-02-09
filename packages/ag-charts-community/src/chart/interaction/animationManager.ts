import type { AdditionalAnimationOptions, AnimationOptions, AnimationValue, IAnimation } from '../../motion/animation';
import { Animation } from '../../motion/animation';
import { Debug } from '../../util/debug';
import { Logger } from '../../util/logger';
import type { Mutex } from '../../util/mutex';
import { BaseManager } from './baseManager';
import { InteractionManager, InteractionState } from './interactionManager';

type AnimationEventType = 'animation-frame';

interface AnimationEvent {
    type: AnimationEventType;
    deltaMs: number;
}

const DEBUG_SELECTORS = [true, 'animation'];

/**
 * Manage animations across a chart, running all animations through only one `requestAnimationFrame` callback,
 * preventing duplicate animations and handling their lifecycle.
 */
export class AnimationManager extends BaseManager<AnimationEventType, AnimationEvent> {
    public defaultDuration = 1000;

    private batch = new AnimationBatch();

    private readonly debug = Debug.create(...DEBUG_SELECTORS);

    private isPlaying = false;
    private requestId: number | null = null;
    private skipAnimations = false;

    constructor(
        private readonly interactionManager: InteractionManager,
        private readonly chartUpdateMutex: Mutex
    ) {
        super();
    }

    /**
     * Create an animation to tween a value between the `from` and `to` properties. If an animation already exists
     * with the same `id`, immediately stop it.
     */
    public animate<T extends AnimationValue>({
        disableInteractions = true,
        immutable = true,
        ...opts
    }: AnimationOptions<T> & AdditionalAnimationOptions) {
        const { controllers } = this.batch;

        try {
            if (opts.id != null && controllers.has(opts.id)) {
                if (!immutable) {
                    return controllers.get(opts.id)!.reset(opts);
                }
                controllers.get(opts.id)!.stop();

                this.debug(`Skipping animation batch due to update of existing animation: ${opts.id}`);
                this.batch.skip();
            }
        } catch (error: unknown) {
            this.failsafeOnError(error);
            return;
        }

        const id = opts.id ?? Math.random().toString();

        const skip = this.isSkipped();
        if (skip) {
            this.debug('AnimationManager - skipping animation');
        }
        return new Animation({
            ...opts,
            id,
            skip,
            autoplay: this.isPlaying ? opts.autoplay : false,
            phase: opts.phase,
            onPlay: (controller) => {
                controllers.set(id, controller);
                this.requestAnimation();
                opts.onPlay?.(controller);
            },
            onStop: (controller) => {
                controllers.delete(id);
                opts.onStop?.(controller);
            },
        });
    }

    public play() {
        if (this.isPlaying) {
            return;
        }

        this.isPlaying = true;

        this.debug('AnimationManager.play()');

        for (const controller of this.batch.controllers.values()) {
            try {
                controller.play();
            } catch (error: unknown) {
                this.failsafeOnError(error);
            }
        }

        this.requestAnimation();
    }

    public pause() {
        if (!this.isPlaying) {
            return;
        }

        this.isPlaying = false;
        this.cancelAnimation();
        this.debug('AnimationManager.pause()');

        for (const controller of this.batch.controllers.values()) {
            try {
                controller.pause();
            } catch (error: unknown) {
                this.failsafeOnError(error);
            }
        }
    }

    public stop() {
        this.isPlaying = false;
        this.cancelAnimation();
        this.debug('AnimationManager.stop()');

        for (const controller of this.batch.controllers.values()) {
            try {
                controller.stop();
            } catch (error: unknown) {
                this.failsafeOnError(error, false);
            }
        }
    }

    public stopByAnimationId(id: string) {
        try {
            if (id != null && this.batch.controllers.has(id)) {
                this.batch.controllers.get(id)?.stop();
            }
        } catch (error: unknown) {
            this.failsafeOnError(error);
            return;
        }
    }

    public stopByAnimationGroupId(id: string) {
        for (const controller of this.batch.controllers.values()) {
            if (controller.groupId === id) {
                this.stopByAnimationId(controller.id);
            }
        }
    }

    public reset() {
        if (this.isPlaying) {
            this.stop();
            this.play();
        } else {
            this.stop();
        }
    }

    public skip(skip = true) {
        this.skipAnimations = skip;
    }

    public isSkipped() {
        return this.skipAnimations || this.batch.isSkipped();
    }

    public isActive() {
        return this.isPlaying && this.batch.isActive();
    }

    public skipCurrentBatch() {
        if (this.debug.check()) {
            this.debug(`AnimationManager - skipCurrentBatch()`, { stack: new Error().stack });
        }
        this.batch.skip();
    }

    /** Mocking point for tests to guarantee that animation updates happen. */
    public isSkippingFrames() {
        return true;
    }

    /** Mocking point for tests to capture requestAnimationFrame callbacks. */
    public scheduleAnimationFrame(cb: (time: number) => Promise<void>) {
        this.requestId = requestAnimationFrame(cb);
    }

    private requestAnimation() {
        if (!this.batch.isActive() || this.requestId !== null) return;

        let prevTime: number;
        const onAnimationFrame = async (time: number) => {
            const executeAnimationFrame = async () => {
                const deltaTime = time - (prevTime ?? time);

                prevTime = time;

                this.debug('AnimationManager - onAnimationFrame()', {
                    controllersCount: this.batch.controllers.size,
                });

                this.interactionManager.pushState(InteractionState.Animation);

                for (const controller of this.batch.controllers.values()) {
                    try {
                        controller.update(deltaTime);
                    } catch (error: unknown) {
                        this.failsafeOnError(error);
                    }
                }

                this.listeners.dispatch('animation-frame', {
                    type: 'animation-frame',
                    deltaMs: deltaTime,
                });
            };

            if (this.isSkippingFrames()) {
                // Only run the animation frame if we can acquire the chart update mutex immediately.
                await this.chartUpdateMutex.acquireImmediately(executeAnimationFrame);
            } else {
                // Wait for the next available point we can execute.
                await this.chartUpdateMutex.acquire(executeAnimationFrame);
            }

            if (this.batch.isActive()) {
                this.scheduleAnimationFrame(onAnimationFrame);
            } else {
                this.batch.dispatchStopped();
            }
        };

        this.scheduleAnimationFrame(onAnimationFrame);
    }

    private cancelAnimation() {
        if (this.requestId === null) return;
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
        this.startBatch();
    }

    private failsafeOnError(error: unknown, cancelAnimation = true) {
        Logger.error('Error during animation, skipping animations', error);
        if (cancelAnimation) {
            this.cancelAnimation();
        }
    }

    public startBatch(skipAnimations?: boolean) {
        this.debug(`AnimationManager - startBatch() with skipAnimations=${skipAnimations}.`);
        this.reset();
        this.batch.dispatchStopped();
        this.batch.destroy();
        this.batch = new AnimationBatch();
        if (skipAnimations === true) {
            this.batch.skip();
        }
    }

    public endBatch() {
        this.debug(
            `AnimationManager - endBatch() with ${
                this.batch.controllers.size
            } animations; skipped: ${this.batch.isSkipped()}.`
        );

        if (!this.batch.isActive()) {
            this.interactionManager.popState(InteractionState.Animation);
        }

        if (this.batch.isSkipped() && !this.batch.isActive()) {
            this.batch.skip(false);
        }
        this.batch.dispatchStopped();
    }

    public onBatchStop(cb: () => void) {
        this.batch.stoppedCbs.add(cb);
    }
}

/**
 * A batch of animations that are synchronised together. Can be skipped independently of other batches and the main
 * animation skipping status.
 */
class AnimationBatch {
    public readonly controllers: Map<string, IAnimation<any>> = new Map();
    public readonly stoppedCbs: Set<() => void> = new Set();

    private skipAnimations = false;
    // private phase?: 'initial-load' | 'remove' | 'update' | 'add';

    isActive() {
        return this.controllers.size > 0;
    }

    skip(skip = true) {
        if (this.skipAnimations === false && skip === true) {
            for (const controller of this.controllers.values()) {
                controller.stop();
            }
            this.controllers.clear();
        }
        this.skipAnimations = skip;
    }

    dispatchStopped() {
        this.stoppedCbs.forEach((cb) => cb());
        this.stoppedCbs.clear();
    }

    isSkipped() {
        return this.skipAnimations;
    }

    destroy() {}
}
