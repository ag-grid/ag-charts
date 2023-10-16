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
    private readonly controllers: Map<string, IAnimation<any>> = new Map();
    private readonly shortCircuits: Map<string, number> = new Map();
    private readonly debug = Debug.create(true, 'animation');

    private isPlaying = false;
    private requestId: number | null = null;
    private skipAnimations = false;

    defaultDuration = 1000;

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
        try {
            if (opts.id != null && this.controllers.has(opts.id)) {
                if (!immutable) {
                    return this.controllers.get(opts.id)!.reset(opts);
                }
                this.controllers.get(opts.id)!.stop();
            }
        } catch (error: unknown) {
            this.failsafeOnError(error);
            return;
        }

        const id = opts.id ?? Math.random().toString();

        if (opts.shortCircuitId) {
            const shortCircuitTime = this.shortCircuits.get(opts.shortCircuitId);
            const isShortCircuited = shortCircuitTime && opts.duration && Date.now() - shortCircuitTime < opts.duration;

            if (isShortCircuited) {
                opts.delay = 0;
                opts.duration = 1;
            }

            this.shortCircuits.set(opts.shortCircuitId, Date.now());
        }

        return new Animation({
            ...opts,
            id,
            skip: this.skipAnimations,
            autoplay: this.isPlaying ? opts.autoplay : false,
            duration: opts.duration ?? this.defaultDuration,
            onPlay: (controller) => {
                this.controllers.set(id, controller);
                this.requestAnimation();
                if (disableInteractions) {
                    this.interactionManager.pause('animation');
                }
                opts.onPlay?.(controller);
            },
            onStop: (controller) => {
                this.controllers.delete(id);
                if (this.controllers.size === 0) {
                    this.cancelAnimation();
                }
                if (disableInteractions) {
                    this.interactionManager.resume('animation');
                }
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

        for (const controller of this.controllers.values()) {
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

        for (const controller of this.controllers.values()) {
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

        for (const controller of this.controllers.values()) {
            try {
                controller.stop();
            } catch (error: unknown) {
                this.failsafeOnError(error, false);
            }
        }
    }

    public stopByAnimationId(id: string) {
        try {
            if (id != null && this.controllers.has(id)) {
                this.controllers.get(id)?.stop();
            }
        } catch (error: unknown) {
            this.failsafeOnError(error);
            return;
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
        return this.skipAnimations;
    }

    private requestAnimation() {
        if (this.controllers.size === 0 || this.requestId !== null) return;

        let prevTime: number;
        const onAnimationFrame = (time: number) => {
            this.requestId = requestAnimationFrame(onAnimationFrame);

            const executeAnimationFrame = async () => {
                const deltaTime = time - (prevTime ?? time);

                prevTime = time;

                this.debug('AnimationManager - onAnimationFrame()', {
                    controllersCount: this.controllers.size,
                });

                for (const controller of this.controllers.values()) {
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

            // Only run the animation frame if we can acquire the chart update mutex immediately.
            this.chartUpdateMutex.acquireImmediately(executeAnimationFrame);
        };

        this.requestId = requestAnimationFrame(onAnimationFrame);
    }

    private cancelAnimation() {
        if (this.requestId === null) return;
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
    }

    private failsafeOnError(error: unknown, cancelAnimation = true) {
        Logger.error('Error during animation, skipping animations', error);
        if (cancelAnimation) {
            this.cancelAnimation();
        }
    }
}
