import type { AdditionalAnimationOptions, AnimationOptions, AnimationValue, IAnimation } from '../../motion/animation';
import { Animation } from '../../motion/animation';
import { Debug } from '../../util/debug';
import { Logger } from '../../util/logger';
import type { Mutex } from '../../util/mutex';
import { AnimationBatch } from './animationBatch';
import { BaseManager } from './baseManager';
import { InteractionManager, InteractionState } from './interactionManager';

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
    private readonly rafAvailable = typeof requestAnimationFrame !== 'undefined';

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
    public animate<T extends AnimationValue>({ ...opts }: AnimationOptions<T> & AdditionalAnimationOptions) {
        const batch = this.batch;

        try {
            batch.checkOverlappingId(opts.id);
        } catch (error: unknown) {
            this.failsafeOnError(error);
            return;
        }

        const id = opts.id ?? Math.random().toString();

        const skip = this.isSkipped();
        if (skip) {
            this.debug('AnimationManager - skipping animation');
        }
        const animation = new Animation({
            ...opts,
            id,
            skip,
            autoplay: this.isPlaying ? opts.autoplay : false,
            phase: opts.phase,
            defaultDuration: this.defaultDuration,
        });

        if (this.forceTimeJump(animation, this.defaultDuration)) {
            // For tests, just skip animation forward in time.
            return;
        }
        this.batch.addAnimation(animation);

        return animation;
    }

    public play() {
        if (this.isPlaying) {
            return;
        }

        this.isPlaying = true;

        this.debug('AnimationManager.play()');

        try {
            this.batch.play();
        } catch (error: unknown) {
            this.failsafeOnError(error);
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

        try {
            this.batch.pause();
        } catch (error: unknown) {
            this.failsafeOnError(error);
        }
    }

    public stop() {
        this.isPlaying = false;
        this.cancelAnimation();
        this.debug('AnimationManager.stop()');

        this.batch.stop();
    }

    public stopByAnimationId(id: string) {
        try {
            this.batch.stopByAnimationId(id);
        } catch (error: unknown) {
            this.failsafeOnError(error);
        }
    }

    public stopByAnimationGroupId(id: string) {
        try {
            this.batch.stopByAnimationGroupId(id);
        } catch (error: unknown) {
            this.failsafeOnError(error);
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
        return !this.rafAvailable || this.skipAnimations || this.batch.isSkipped();
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

    /** Mocking point for tests to skip animations to a specific point in time. */
    public forceTimeJump(_animation: IAnimation, _defaultDuration: number): boolean {
        return false;
    }

    private requestAnimation() {
        if (!this.rafAvailable) return;
        if (!this.batch.isActive() || this.requestId !== null) return;

        let prevTime: number;
        const onAnimationFrame = async (time: number) => {
            const executeAnimationFrame = async () => {
                const deltaTime = time - (prevTime ?? time);

                prevTime = time;

                this.debug('AnimationManager - onAnimationFrame()', {
                    controllersCount: this.batch.size,
                    deltaTime,
                });

                this.interactionManager.pushState(InteractionState.Animation);

                try {
                    this.batch.progress(deltaTime);
                } catch (error: unknown) {
                    this.failsafeOnError(error);
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
                this.batch.stop();
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
        this.batch.stop();
        this.batch.destroy();
        this.batch = new AnimationBatch();
        if (skipAnimations === true) {
            this.batch.skip();
        }
    }

    public endBatch() {
        if (this.batch.isActive()) {
            this.batch.ready();
            this.requestAnimation();
        } else {
            this.interactionManager.popState(InteractionState.Animation);

            if (this.batch.isSkipped()) {
                this.batch.skip(false);
            }
        }
    }

    public onBatchStop(cb: () => void) {
        this.batch.stoppedCbs.add(cb);
    }
}
