import type { AdditionalAnimationOptions, AnimationOptions, AnimationValue, IAnimation } from '../../motion/animation';
import { Animation } from '../../motion/animation';
import { Debug } from '../../util/debug';
import { Logger } from '../../util/logger';
import type { Mutex } from '../../util/mutex';
import { BaseManager } from './baseManager';
import type { InteractionManager } from './interactionManager';

type AnimationEventType = 'animation-frame';

interface AnimationEvent {
    type: AnimationEventType;
    deltaMs: number;
}

/**
 * Manage animations across a chart, running all animations through only one `requestAnimationFrame` callback,
 * preventing duplicate animations and handling their lifecycle.
 */
export class AnimationManager extends BaseManager<AnimationEventType, AnimationEvent> {
    public defaultDuration = 1000;

    private batch = new AnimationBatch();

    private readonly debug = Debug.create(true, 'animation');

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
        const { batch } = this;

        try {
            if (opts.id != null && batch.controllers.has(opts.id)) {
                if (!immutable) {
                    return batch.controllers.get(opts.id)!.reset(opts);
                }
                batch.controllers.get(opts.id)!.stop();

                this.debug(`Skipping animation batch due to update of existing animation: ${opts.id}`);
                this.batch.skip();
            }
        } catch (error: unknown) {
            this.failsafeOnError(error);
            return;
        }

        const id = opts.id ?? Math.random().toString();

        return new Animation({
            ...opts,
            id,
            skip: this.isSkipped(),
            autoplay: this.isPlaying ? opts.autoplay : false,
            duration: opts.duration ?? this.defaultDuration,
            onPlay: (controller) => {
                batch.controllers.set(id, controller);
                this.requestAnimation();
                if (disableInteractions) {
                    this.interactionManager.pause('animation');
                }
                opts.onPlay?.call(controller, controller);
            },
            onStop: (controller) => {
                batch.controllers.delete(id);
                if (!batch.isActive()) {
                    this.cancelAnimation();
                }
                if (disableInteractions) {
                    this.interactionManager.resume('animation');
                }
                opts.onStop?.call(controller, controller);
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
        this.debug(`AnimationManager - skipCurrentBatch()`);
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

        if (this.batch.isSkipped() && !this.batch.isActive()) {
            this.batch.skip(false);
        }
    }
}

/**
 * A batch of animations that are synchronised together. Can be skipped independently of other batches and the main
 * animation skipping status.
 */
class AnimationBatch {
    public readonly controllers: Map<string, IAnimation<any>> = new Map();

    private skipAnimations = false;
    // private phase?: 'initial-load' | 'remove' | 'update' | 'add';

    isActive() {
        return this.controllers.size > 0;
    }

    skip(skip = true) {
        this.skipAnimations = skip;
    }

    isSkipped() {
        return this.skipAnimations;
    }

    destroy() {}
}
