import { AgDocument, Debug, EventEmitter, type EventListener, Logger } from 'ag-charts-core';

import type {
    AdditionalAnimationOptions,
    AnimationOptions,
    AnimationPhase,
    AnimationValue,
    IAnimation,
} from '../../motion/animation';
import { Animation } from '../../motion/animation';
import type { Mutex } from '../../util/mutex';
import { MAX_ANIMATABLE_NODES } from '../data/processors';
import { AnimationBatch } from './animationBatch';
import { InteractionManager, InteractionState } from './interactionManager';

type AnimationEventType = 'animation-frame' | 'animation-start' | 'animation-stop';

export interface AnimationEvent {
    readonly type: AnimationEventType;
    readonly deltaMs: number;
}

type AnimationEventMap = { [K in AnimationEventType]: AnimationEvent };

function validAnimationDuration(testee?: number) {
    if (testee == null) return true;
    return !Number.isNaN(testee) && testee >= 0 && testee <= 2;
}

/**
 * Manage animations across a chart, running all animations through only one `requestAnimationFrame` callback,
 * preventing duplicate animations and handling their lifecycle.
 */
export class AnimationManager {
    public defaultDuration = 1000;
    public maxAnimatableItems = MAX_ANIMATABLE_NODES;

    private batch = new AnimationBatch(this.defaultDuration * 1.5);

    private readonly debug = Debug.create(true, 'animation');
    private readonly events = new EventEmitter<AnimationEventMap>();
    private readonly rafAvailable = typeof requestAnimationFrame !== 'undefined';

    private isPlaying = true;
    private requestId: number | null = null;
    private skipAnimations = true;

    private currentAnonymousAnimationId: number = 0;
    private cumulativeAnimationTime: number = 0;

    constructor(
        private readonly agDocument: AgDocument,
        private readonly interactionManager: InteractionManager,
        private readonly chartUpdateMutex: Mutex
    ) {}

    public addListener<K extends keyof AnimationEventMap>(eventName: K, listener: EventListener<AnimationEventMap[K]>) {
        return this.events.on(eventName, listener);
    }

    /**
     * Create an animation to tween a value between the `from` and `to` properties. If an animation already exists
     * with the same `id`, immediately stop it.
     */
    public animate<T extends AnimationValue>(opts: AnimationOptions<T> & AdditionalAnimationOptions) {
        const batch = this.batch;

        try {
            batch.checkOverlappingId(opts.id);
        } catch (error: unknown) {
            this.failsafeOnError(error);
            return;
        }

        let { id } = opts;
        if (id == null) {
            id = `__${this.currentAnonymousAnimationId}`;
            this.currentAnonymousAnimationId += 1;
        }

        const skip = (this.isSkipped() && !opts.forceAnimation) || opts.phase === 'none';
        if (skip) {
            this.debug('AnimationManager - skipping animation');
        }

        const { delay, duration } = opts;
        if (!validAnimationDuration(delay)) {
            throw new Error(`Animation delay of ${delay} is unsupported (${id})`);
        }
        if (!validAnimationDuration(duration)) {
            throw new Error(`Animation duration of ${duration} is unsupported (${id})`);
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

    public getRemainingTime(phase?: AnimationPhase) {
        return this.batch.getRemainingTime(phase);
    }

    public getCumulativeAnimationTime() {
        return this.cumulativeAnimationTime;
    }

    public skipCurrentBatch() {
        if (this.debug.check()) {
            this.debug(`AnimationManager - skipCurrentBatch()`, {
                stack: new Error('Stack trace for animation skip tracking').stack,
            });
        }
        this.batch.skip();
    }

    /** Mocking point for tests to guarantee that animation updates happen. */
    public isSkippingFrames() {
        return true;
    }

    /** Mocking point for tests to capture requestAnimationFrame callbacks. */
    public scheduleAnimationFrame(cb: (time: number) => Promise<void>) {
        this.requestId = this.agDocument.requestAnimationFrame((t) => {
            cb(t).catch((e) => Logger.error(e));
        });
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
            await this.debug.group('AnimationManager.onAnimationFrame()', async () => {
                const executeAnimationFrame = () => {
                    const deltaTime = time - (prevTime ?? time);

                    prevTime = time;

                    this.debug('AnimationManager', {
                        controllersCount: this.batch.size,
                        deltaTime,
                    });

                    this.interactionManager.pushState(InteractionState.Animation);

                    try {
                        this.batch.progress(deltaTime);
                        this.cumulativeAnimationTime += deltaTime;
                    } catch (error: unknown) {
                        this.failsafeOnError(error);
                    }

                    this.events.emit('animation-frame', {
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
                    this.events.emit('animation-stop', {
                        type: 'animation-stop',
                        deltaMs: this.batch.consumedTimeMs,
                    });
                }
            });
        };

        this.events.emit('animation-start', {
            type: 'animation-start',
            deltaMs: 0,
        });
        this.scheduleAnimationFrame(onAnimationFrame);
    }

    private cancelAnimation() {
        if (this.requestId === null) return;

        this.agDocument.cancelAnimationFrame(this.requestId);
        this.events.emit('animation-stop', {
            type: 'animation-stop',
            deltaMs: this.batch.consumedTimeMs,
        });

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
        this.batch = new AnimationBatch(this.defaultDuration * 1.5);
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

    public destroy() {
        this.stop();
        this.events.clear();
    }
}
